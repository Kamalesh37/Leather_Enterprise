<?php

namespace App\Services;

use App\Enums\TicketStatus;
use App\Models\ServiceTicket;

class TicketService
{
    public function getTicketById(string $ticketId): array
    {
        $ticket = ServiceTicket::where('ticket_id', $ticketId)
            ->with(['product', 'partsUsed.part', 'auditLogs.part'])
            ->first();

        if (!$ticket) {
            throw new \Exception('Service ticket not found', 404);
        }

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
            'product' => $ticket->product,
            'bill_of_materials' => [
                'total_parts_count' => $totalCount,
                'total_parts_cost' => (float) $totalCost,
                'parts' => $parts,
            ],
            'audit_logs' => $ticket->auditLogs,
        ];
    }

    public function updateDiagnosis(string $ticketId, string $notes): array
    {
        $ticket = ServiceTicket::where('ticket_id', $ticketId)->first();
        if (!$ticket) {
            throw new \Exception('Service ticket not found', 404);
        }

        $ticket->diagnosis_notes = $notes;
        $ticket->updated_at = now();
        $ticket->save();

        return $this->getTicketById($ticketId);
    }

    public function updateStatus(string $ticketId, string $status): array
    {
        $ticket = ServiceTicket::where('ticket_id', $ticketId)->first();
        if (!$ticket) {
            throw new \Exception('Service ticket not found', 404);
        }

        $ticket->status = TicketStatus::from($status);
        $ticket->updated_at = now();
        $ticket->save();

        return $this->getTicketById($ticketId);
    }
}
