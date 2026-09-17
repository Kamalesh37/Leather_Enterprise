<?php

namespace App\Services;

use App\Models\RepairLog;

class TicketService
{
    public function getTicketById(int|string $ticketId): array
    {
        $ticket = is_numeric($ticketId)
            ? RepairLog::with(['machine.vendor', 'machine.line', 'reporter', 'mechanic', 'techLead', 'spareHead', 'spareRequests.part', 'auditLogs.part'])->find((int) $ticketId)
            : RepairLog::with(['machine.vendor', 'machine.line', 'reporter', 'mechanic', 'techLead', 'spareHead', 'spareRequests.part', 'auditLogs.part'])->where('ticket_number', $ticketId)->first();

        if (!$ticket) {
            throw new \Exception('Repair ticket not found', 404);
        }

        $totalPartsCount = $ticket->spareRequests->sum('dispatched_quantity');
        $totalPartsCost = $ticket->spareRequests->sum(fn($p) => $p->dispatched_quantity * (float) ($p->unit_cost_at_dispatch ?? $p->part->unit_cost ?? 0));

        $parts = $ticket->spareRequests->map(function ($req) {
            return [
                'request_id' => $req->id,
                'part_id' => $req->part_id,
                'part_number' => $req->part->part_number ?? '',
                'name' => $req->part->name ?? '',
                'category' => $req->part->category ?? '',
                'location_bin' => $req->part->location_bin ?? '',
                'requested_quantity' => $req->requested_quantity,
                'approved_quantity' => $req->approved_quantity,
                'dispatched_quantity' => $req->dispatched_quantity,
                'unit_cost' => (float) ($req->unit_cost_at_dispatch ?? $req->part->unit_cost ?? 0),
                'total_cost' => $req->dispatched_quantity * (float) ($req->unit_cost_at_dispatch ?? $req->part->unit_cost ?? 0),
                'status' => $req->status,
                'created_at' => $req->created_at?->toISOString(),
            ];
        });

        return [
            'id' => $ticket->id,
            'ticket_number' => $ticket->ticket_number,
            'machine_id' => $ticket->machine_id,
            'machine' => $ticket->machine,
            'ticket_type' => $ticket->ticket_type,
            'priority' => $ticket->priority,
            'status' => $ticket->status,
            'reported_issue' => $ticket->reported_issue,
            'diagnosis_notes' => $ticket->diagnosis_notes,
            'breakdown_start_time' => $ticket->breakdown_start_time?->toISOString(),
            'breakdown_end_time' => $ticket->breakdown_end_time?->toISOString(),
            'total_downtime_minutes' => $ticket->total_downtime_minutes,
            'reporter' => $ticket->reporter,
            'mechanic' => $ticket->mechanic,
            'tech_lead' => $ticket->techLead,
            'spare_head' => $ticket->spareHead,
            'created_at' => $ticket->created_at?->toISOString(),
            'updated_at' => $ticket->updated_at?->toISOString(),
            'bill_of_materials' => [
                'total_parts_count' => $totalPartsCount,
                'total_parts_cost' => (float) $totalPartsCost,
                'parts' => $parts,
            ],
            'audit_logs' => $ticket->auditLogs,
        ];
    }

    public function updateDiagnosis(int|string $ticketId, string $notes): array
    {
        $ticket = is_numeric($ticketId)
            ? RepairLog::find((int) $ticketId)
            : RepairLog::where('ticket_number', $ticketId)->first();

        if (!$ticket) {
            throw new \Exception('Repair ticket not found', 404);
        }

        $ticket->diagnosis_notes = $notes;
        $ticket->save();

        return $this->getTicketById($ticket->id);
    }

    public function updateStatus(int|string $ticketId, string $status): array
    {
        $ticket = is_numeric($ticketId)
            ? RepairLog::find((int) $ticketId)
            : RepairLog::where('ticket_number', $ticketId)->first();

        if (!$ticket) {
            throw new \Exception('Repair ticket not found', 404);
        }

        $ticket->status = $status;
        $ticket->save();

        return $this->getTicketById($ticket->id);
    }
}
