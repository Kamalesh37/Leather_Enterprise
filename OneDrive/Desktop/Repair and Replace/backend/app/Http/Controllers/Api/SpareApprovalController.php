<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\TechLeadApprovalRequest;
use App\Models\RepairLog;
use App\Models\RepairSpareRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SpareApprovalController extends Controller
{
    /**
     * Tech Lead Queue: tickets waiting for spare parts technical review
     */
    public function index(): JsonResponse
    {
        $tickets = RepairLog::with([
            'machine.vendor',
            'machine.block',
            'machine.floor',
            'machine.line',
            'reporter',
            'mechanic',
            'spareRequests.part',
        ])
        ->where('status', RepairLog::STATUS_PENDING_TECH_APPROVAL)
        ->orderByDesc('priority')
        ->orderBy('created_at')
        ->get();

        return response()->json([
            'success' => true,
            'data' => $tickets,
        ]);
    }

    /**
     * Tech Lead validates diagnosis, approves/modifies requested parts, routes to Spare Head
     */
    public function approve(TechLeadApprovalRequest $request, int $ticketId): JsonResponse
    {
        $ticket = RepairLog::with('spareRequests')->findOrFail($ticketId);
        $user = $request->user();
        $validated = $request->validated();

        $hasApprovedParts = false;

        DB::transaction(function () use ($ticket, $user, $validated, &$hasApprovedParts) {
            $ticket->tech_lead_id = $user ? $user->id : 1;
            $ticket->diagnosis_notes = ($ticket->diagnosis_notes ? $ticket->diagnosis_notes . "\n\n" : '') 
                . "[Tech Lead Review: " . ($validated['tech_lead_notes'] ?? 'Approved') . "]";

            foreach ($validated['parts_approval'] as $item) {
                $spareReq = RepairSpareRequest::where('repair_log_id', $ticket->id)
                    ->where('id', $item['request_id'])
                    ->firstOrFail();

                $status = $item['status'];
                $approvedQty = $status === RepairSpareRequest::STATUS_APPROVED ? (int) $item['approved_quantity'] : 0;

                $spareReq->update([
                    'status' => $status,
                    'approved_quantity' => $approvedQty,
                    'tech_lead_notes' => $item['notes'] ?? null,
                ]);

                if ($status === RepairSpareRequest::STATUS_APPROVED && $approvedQty > 0) {
                    $hasApprovedParts = true;
                }
            }

            if ($hasApprovedParts) {
                $ticket->status = RepairLog::STATUS_PENDING_SPARE_DISPATCH;
            } else {
                // If all rejected or 0 approved, return directly to in-repair
                $ticket->status = RepairLog::STATUS_IN_REPAIR;
            }

            $ticket->save();
        });

        return response()->json([
            'success' => true,
            'message' => $hasApprovedParts 
                ? 'Spare parts approved and routed to Spare Head dispatch queue.' 
                : 'Review completed. Ticket returned to active repair.',
            'data' => $ticket->fresh([
                'machine',
                'mechanic',
                'techLead',
                'spareRequests.part',
            ]),
        ]);
    }
}
