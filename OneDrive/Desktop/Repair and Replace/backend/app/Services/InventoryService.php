<?php

namespace App\Services;

use App\Enums\InventoryChangeType;
use App\Models\InventoryAuditLog;
use App\Models\Part;
use App\Models\Product;
use App\Models\ServiceTicket;
use App\Models\TicketPartUsed;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class InventoryService
{
    /**
     * Executes atomic multi-part allocation with row-level locks and rollback.
     */
    public function applyPartsAtomically(string $ticketId, array $requestedParts): array
    {
        return DB::transaction(function () use ($ticketId, $requestedParts) {
            $ticket = ServiceTicket::where('ticket_id', $ticketId)->first();
            if (!$ticket) {
                throw new \Exception('Ticket not found', 404);
            }

            // Consolidate duplicate requested parts
            $consolidated = [];
            foreach ($requestedParts as $item) {
                $pId = $item['part_id'];
                $qty = (int) $item['quantity'];
                if ($qty <= 0) continue;
                $consolidated[$pId] = ($consolidated[$pId] ?? 0) + $qty;
            }

            if (empty($consolidated)) {
                throw new \Exception('No valid parts to apply', 400);
            }

            // Lock and fetch parts
            $partIds = array_keys($consolidated);
            $parts = Part::whereIn('part_id', $partIds)->lockForUpdate()->get()->keyBy('part_id');

            // Pre-flight check: verify all parts exist and have sufficient stock
            $insufficient = [];
            foreach ($consolidated as $pId => $neededQty) {
                $part = $parts->get($pId);
                if (!$part) {
                    throw new \Exception("Part not found: {$pId}", 404);
                }
                if ($part->stock_quantity < $neededQty) {
                    $insufficient[] = [
                        'part_id' => $pId,
                        'part_number' => $part->part_number,
                        'name' => $part->name,
                        'requested_quantity' => $neededQty,
                        'available_quantity' => $part->stock_quantity,
                    ];
                }
            }

            if (!empty($insufficient)) {
                $error = new \Exception('Insufficient stock for one or more requested parts.', 409);
                (function () use ($insufficient) {
                    $this->details = $insufficient;
                    $this->code = 'INSUFFICIENT_STOCK';
                })->call($error);
                throw $error;
            }

            // Apply deductions atomically
            $deductions = [];
            foreach ($consolidated as $pId => $qty) {
                $part = $parts->get($pId);
                $newBalance = $part->stock_quantity - $qty;

                // Create TicketPartUsed record
                $usage = TicketPartUsed::create([
                    'id' => (string) Str::uuid(),
                    'ticket_id' => $ticketId,
                    'part_id' => $pId,
                    'quantity_used' => $qty,
                    'unit_price_at_repair' => $part->unit_cost,
                    'created_at' => now(),
                ]);

                // Update Part stock
                $part->stock_quantity = $newBalance;
                $part->save();

                // Create Audit Log
                InventoryAuditLog::create([
                    'log_id' => (string) Str::uuid(),
                    'part_id' => $pId,
                    'ticket_id' => $ticketId,
                    'change_amount' => -$qty,
                    'change_type' => InventoryChangeType::REPAIR_DEDUCTION,
                    'balance_after' => $newBalance,
                    'timestamp' => now(),
                ]);

                $deductions[] = [
                    'part_id' => $pId,
                    'part_number' => $part->part_number,
                    'name' => $part->name,
                    'quantity_deducted' => $qty,
                    'remaining_stock' => $newBalance,
                    'unit_price_charged' => (float) $part->unit_cost,
                ];
            }

            return [
                'ticket_id' => $ticketId,
                'parts_applied_count' => count($deductions),
                'deductions' => $deductions,
            ];
        });
    }

    /**
     * Inbound restock of a part SKU.
     */
    public function restockPart(string $partId, int $quantity, ?float $unitCost = null): array
    {
        return DB::transaction(function () use ($partId, $quantity, $unitCost) {
            $part = Part::where('part_id', $partId)->lockForUpdate()->first();
            if (!$part) {
                throw new \Exception('Part not found', 404);
            }

            $newBalance = $part->stock_quantity + $quantity;
            $part->stock_quantity = $newBalance;
            if ($unitCost !== null && $unitCost > 0) {
                $part->unit_cost = $unitCost;
            }
            $part->save();

            InventoryAuditLog::create([
                'log_id' => (string) Str::uuid(),
                'part_id' => $partId,
                'ticket_id' => null,
                'change_amount' => $quantity,
                'change_type' => InventoryChangeType::RESTOCK,
                'balance_after' => $newBalance,
                'timestamp' => now(),
            ]);

            return [
                'part_id' => $part->part_id,
                'part_number' => $part->part_number,
                'name' => $part->name,
                'previous_stock' => $newBalance - $quantity,
                'quantity_added' => $quantity,
                'new_stock_quantity' => $newBalance,
                'unit_cost' => (float) $part->unit_cost,
            ];
        });
    }

    /**
     * Dashboard statistics calculation.
     */
    public function getDashboardStats(): array
    {
        $parts = Part::all();
        $totalUnique = $parts->count();
        $totalUnits = $parts->sum('stock_quantity');
        $lowStock = $parts->filter(fn($p) => $p->stock_quantity <= $p->min_threshold && $p->stock_quantity > 0)->count();
        $outOfStock = $parts->filter(fn($p) => $p->stock_quantity == 0)->count();
        $totalValuation = $parts->sum(fn($p) => $p->stock_quantity * (float) $p->unit_cost);

        $tickets = ServiceTicket::all();
        $totalTickets = $tickets->count();
        $activeTickets = $tickets->filter(fn($t) => !in_array($t->status->value, ['COMPLETED', 'DELIVERED']))->count();
        $completedTickets = $tickets->filter(fn($t) => in_array($t->status->value, ['COMPLETED', 'DELIVERED']))->count();

        $byStatus = [
            'INTAKE' => $tickets->where('status.value', 'INTAKE')->count(),
            'DIAGNOSING' => $tickets->where('status.value', 'DIAGNOSING')->count(),
            'WAITING_PARTS' => $tickets->where('status.value', 'WAITING_PARTS')->count(),
            'IN_PROGRESS' => $tickets->where('status.value', 'IN_PROGRESS')->count(),
            'COMPLETED' => $tickets->where('status.value', 'COMPLETED')->count(),
            'DELIVERED' => $tickets->where('status.value', 'DELIVERED')->count(),
        ];

        $recentActivity = InventoryAuditLog::with(['part', 'ticket'])
            ->orderBy('timestamp', 'desc')
            ->limit(10)
            ->get();

        return [
            'inventory' => [
                'total_unique_parts' => $totalUnique,
                'total_stock_units' => (int) $totalUnits,
                'low_stock_count' => $lowStock,
                'out_of_stock_count' => $outOfStock,
                'total_valuation' => (float) $totalValuation,
            ],
            'tickets' => [
                'total_tickets' => $totalTickets,
                'active_tickets' => $activeTickets,
                'completed_tickets' => $completedTickets,
                'by_status' => $byStatus,
            ],
            'products' => [
                'total_products' => Product::count(),
            ],
            'recent_activity' => $recentActivity,
        ];
    }
}
