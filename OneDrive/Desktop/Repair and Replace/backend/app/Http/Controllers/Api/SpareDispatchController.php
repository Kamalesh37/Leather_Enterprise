<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SpareDispatchRequest;
use App\Models\InventoryAuditLog;
use App\Models\Part;
use App\Models\RepairLog;
use App\Models\RepairSpareRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SpareDispatchController extends Controller
{
    /**
     * Spare Head Queue: Approved spare parts awaiting warehouse dispatch
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
            'techLead',
            'spareRequests' => function ($q) {
                $q->with('part')->where('status', RepairSpareRequest::STATUS_APPROVED);
            },
        ])
        ->where('status', RepairLog::STATUS_PENDING_SPARE_DISPATCH)
        ->orderByDesc('priority')
        ->orderBy('created_at')
        ->get();

        return response()->json([
            'success' => true,
            'data' => $tickets,
        ]);
    }

    /**
     * Atomic Dispatch with Row-Level Locking (lockForUpdate)
     */
    public function dispatch(SpareDispatchRequest $request, int $ticketId): JsonResponse
    {
        $ticket = RepairLog::with('spareRequests')->findOrFail($ticketId);
        $user = $request->user();
        $validated = $request->validated();

        $specificRequestIds = $validated['request_ids'] ?? null;
        $remarks = $validated['remarks'] ?? 'Dispatched for breakdown ticket ' . $ticket->ticket_number;

        $dispatchedSummary = [];

        try {
            DB::transaction(function () use ($ticket, $user, $specificRequestIds, $remarks, &$dispatchedSummary) {
                $ticket->spare_head_id = $user ? $user->id : 1;

                $query = RepairSpareRequest::where('repair_log_id', $ticket->id)
                    ->where('status', RepairSpareRequest::STATUS_APPROVED);

                if (!empty($specificRequestIds)) {
                    $query->whereIn('id', $specificRequestIds);
                }

                $spareRequests = $query->get();

                if ($spareRequests->isEmpty()) {
                    throw new \RuntimeException('No pending approved spare requests found for dispatch.');
                }

                foreach ($spareRequests as $spareReq) {
                    $qtyToDispatch = $spareReq->approved_quantity;

                    if ($qtyToDispatch <= 0) {
                        continue;
                    }

                    // PESSIMISTIC ROW-LEVEL LOCKING to prevent race conditions
                    $part = Part::where('id', $spareReq->part_id)
                        ->lockForUpdate()
                        ->firstOrFail();

                    if ($part->stock_quantity < $qtyToDispatch) {
                        throw new \RuntimeException(
                            "Insufficient inventory for part '{$part->name}' ({$part->part_number}) in Bin '{$part->location_bin}'. Available: {$part->stock_quantity}, Required: {$qtyToDispatch}."
                        );
                    }

                    $balanceBefore = $part->stock_quantity;
                    $balanceAfter = $balanceBefore - $qtyToDispatch;

                    // Decrement stock atomically
                    $part->stock_quantity = $balanceAfter;
                    $part->save();

                    // Record in immutable audit ledger
                    InventoryAuditLog::create([
                        'part_id' => $part->id,
                        'repair_log_id' => $ticket->id,
                        'user_id' => $user ? $user->id : null,
                        'change_type' => InventoryAuditLog::TYPE_DISPATCH,
                        'quantity_delta' => -$qtyToDispatch,
                        'balance_before' => $balanceBefore,
                        'balance_after' => $balanceAfter,
                        'remarks' => "Dispatch from bin {$part->location_bin} to mechanic. {$remarks}",
                        'timestamp' => now(),
                    ]);

                    // Update spare request state
                    $spareReq->update([
                        'status' => RepairSpareRequest::STATUS_DISPATCHED,
                        'dispatched_quantity' => $qtyToDispatch,
                        'unit_cost_at_dispatch' => $part->unit_cost,
                    ]);

                    $dispatchedSummary[] = [
                        'part_number' => $part->part_number,
                        'name' => $part->name,
                        'bin' => $part->location_bin,
                        'dispatched_quantity' => $qtyToDispatch,
                        'remaining_stock' => $balanceAfter,
                    ];
                }

                // Check if all approved requests are dispatched
                $remainingApproved = RepairSpareRequest::where('repair_log_id', $ticket->id)
                    ->where('status', RepairSpareRequest::STATUS_APPROVED)
                    ->count();

                if ($remainingApproved === 0) {
                    $ticket->status = RepairLog::STATUS_IN_REPAIR;
                }

                $ticket->save();
            });

            return response()->json([
                'success' => true,
                'message' => 'Spare parts dispatched successfully with row-locked atomic stock deduction.',
                'data' => [
                    'ticket' => $ticket->fresh([
                        'machine',
                        'mechanic',
                        'techLead',
                        'spareHead',
                        'spareRequests.part',
                    ]),
                    'dispatched_parts' => $dispatchedSummary,
                ],
            ]);
        } catch (\RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Atomic stock deduction failed: ' . $e->getMessage(),
            ], 500);
        }
    }
}
