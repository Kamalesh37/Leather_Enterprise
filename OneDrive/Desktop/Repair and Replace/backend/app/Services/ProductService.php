<?php

namespace App\Services;

use App\Enums\ServiceType;
use App\Enums\TicketStatus;
use App\Models\Product;
use App\Models\ServiceTicket;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductService
{
    public function __construct(
        protected QRService $qrService
    ) {}

    public function intakeProduct(array $data): array
    {
        return DB::transaction(function () use ($data) {
            $qrHash = $this->qrService->generateDeterministicHash(
                $data['serial_number'],
                $data['model_name']
            );

            // Check if product already exists
            $existing = Product::where('serial_number', $data['serial_number'])
                ->orWhere('qr_code_hash', $qrHash)
                ->first();

            if ($existing) {
                $product = $existing;
            } else {
                $product = Product::create([
                    'product_id' => (string) Str::uuid(),
                    'qr_code_hash' => $qrHash,
                    'serial_number' => $data['serial_number'],
                    'model_name' => $data['model_name'],
                    'customer_name' => $data['customer_name'],
                    'customer_contact' => $data['customer_contact'],
                    'created_at' => now(),
                ]);
            }

            // Create initial service ticket
            $ticket = ServiceTicket::create([
                'ticket_id' => (string) Str::uuid(),
                'product_id' => $product->product_id,
                'service_type' => ServiceType::from($data['service_type'] ?? 'REPAIR'),
                'status' => TicketStatus::INTAKE,
                'diagnosis_notes' => $data['initial_notes'] ?? null,
                'technician_id' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return [
                'product' => $product,
                'initial_ticket' => $ticket,
                'qr_tracking' => [
                    'hash' => $qrHash,
                    'qr_data_payload' => $qrHash,
                ],
            ];
        });
    }

    public function lookupByQR(string $qrHash): array
    {
        $product = Product::where('qr_code_hash', $qrHash)
            ->with(['serviceTickets' => function ($query) {
                $query->with(['partsUsed.part', 'auditLogs'])->orderBy('created_at', 'desc');
            }])
            ->first();

        if (!$product) {
            throw new \Exception('Product not found for the provided QR code.', 404);
        }

        $tickets = $product->serviceTickets->map(function ($ticket) {
            $totalCount = $ticket->partsUsed->sum('quantity_used');
            $totalCost = $ticket->partsUsed->sum(fn($p) => $p->quantity_used * (float) $p->unit_price_at_repair);

            $parts = $ticket->partsUsed->map(function ($pu) {
                return [
                    'usage_id' => $pu->id,
                    'part_id' => $pu->part_id,
                    'part_number' => $pu->part->part_number ?? '',
                    'name' => $pu->part->name ?? '',
                    'category' => $pu->part->category ?? '',
                    'location_bin' => $pu->part->location_bin ?? '',
                    'quantity_used' => $pu->quantity_used,
                    'unit_price_at_repair' => (float) $pu->unit_price_at_repair,
                    'total_price' => $pu->quantity_used * (float) $pu->unit_price_at_repair,
                    'created_at' => $pu->created_at->toISOString(),
                ];
            });

            return [
                'ticket_id' => $ticket->ticket_id,
                'product_id' => $ticket->product_id,
                'service_type' => $ticket->service_type->value,
                'status' => $ticket->status->value,
                'diagnosis_notes' => $ticket->diagnosis_notes,
                'technician_id' => $ticket->technician_id,
                'created_at' => $ticket->created_at->toISOString(),
                'updated_at' => $ticket->updated_at->toISOString(),
                'bill_of_materials' => [
                    'total_parts_count' => $totalCount,
                    'total_parts_cost' => (float) $totalCost,
                    'parts' => $parts,
                ],
            ];
        });

        $activeCount = $tickets->filter(fn($t) => !in_array($t['status'], ['COMPLETED', 'DELIVERED']))->count();

        return [
            'product' => $product,
            'service_history' => [
                'total_tickets' => $tickets->count(),
                'active_tickets' => $activeCount,
                'tickets' => $tickets,
            ],
        ];
    }
}
