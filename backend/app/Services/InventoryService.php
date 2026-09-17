<?php

namespace App\Services;

use App\Exceptions\InsufficientStockException;
use App\Models\InventoryAuditLog;
use App\Models\Machine;
use App\Models\Part;
use App\Models\RepairLog;
use App\Models\RepairSpareRequest;
use Illuminate\Support\Facades\DB;

class InventoryService
{
    /**
     * Executes atomic multi-part allocation with row-level locks and rollback.
     */
    public function applyPartsAtomically(int|string $ticketId, array $requestedParts, ?int $userId = null): array
    {
        return DB::transaction(function () use ($ticketId, $requestedParts, $userId) {
            $ticket = is_numeric($ticketId)
                ? RepairLog::find((int) $ticketId)
                : RepairLog::where('ticket_number', $ticketId)->first();

            if (!$ticket) {
                throw new \Exception('Repair ticket not found', 404);
            }

            // Consolidate duplicate requested parts
            $consolidated = [];
            foreach ($requestedParts as $item) {
                $pId = $item['part_id'] ?? $item['id'] ?? null;
                $qty = (int) ($item['quantity'] ?? $item['requested_quantity'] ?? 0);
                if (!$pId || $qty <= 0) continue;
                $consolidated[$pId] = ($consolidated[$pId] ?? 0) + $qty;
            }

            if (empty($consolidated)) {
                throw new \Exception('No valid parts to apply', 400);
            }

            // Lock and fetch parts using pessimistic row-level locking
            $partIds = array_keys($consolidated);
            $parts = Part::whereIn('id', $partIds)->lockForUpdate()->get()->keyBy('id');

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
                throw new InsufficientStockException(
                    'Insufficient stock for one or more requested parts.',
                    $insufficient,
                    'INSUFFICIENT_STOCK',
                    409
                );
            }

            // Apply deductions atomically
            $deductions = [];
            foreach ($consolidated as $pId => $qty) {
                $part = $parts->get($pId);
                $balanceBefore = $part->stock_quantity;
                $newBalance = $balanceBefore - $qty;

                // Create or update RepairSpareRequest record
                RepairSpareRequest::create([
                    'repair_log_id' => $ticket->id,
                    'part_id' => $part->id,
                    'requested_quantity' => $qty,
                    'approved_quantity' => $qty,
                    'dispatched_quantity' => $qty,
                    'unit_cost_at_dispatch' => $part->unit_cost,
                    'status' => RepairSpareRequest::STATUS_DISPATCHED,
                    'tech_lead_notes' => 'Allocated atomically via InventoryService',
                ]);

                // Update Part stock
                $part->stock_quantity = $newBalance;
                $part->save();

                // Create Audit Log
                InventoryAuditLog::create([
                    'part_id' => $part->id,
                    'repair_log_id' => $ticket->id,
                    'user_id' => $userId,
                    'change_type' => InventoryAuditLog::TYPE_DISPATCH,
                    'quantity_delta' => -$qty,
                    'balance_before' => $balanceBefore,
                    'balance_after' => $newBalance,
                    'remarks' => "Dispatch from bin {$part->location_bin} for ticket {$ticket->ticket_number}",
                    'timestamp' => now(),
                ]);

                $deductions[] = [
                    'part_id' => $part->id,
                    'part_number' => $part->part_number,
                    'name' => $part->name,
                    'bin' => $part->location_bin,
                    'quantity_deducted' => $qty,
                    'remaining_stock' => $newBalance,
                    'unit_price_charged' => (float) $part->unit_cost,
                ];
            }

            return [
                'ticket_id' => $ticket->id,
                'ticket_number' => $ticket->ticket_number,
                'parts_applied_count' => count($deductions),
                'deductions' => $deductions,
            ];
        });
    }

    /**
     * Inbound restock of a part SKU.
     */
    public function restockPart(int|string $partId, int $quantity, ?float $unitCost = null, ?int $userId = null, ?string $remarks = null): array
    {
        return DB::transaction(function () use ($partId, $quantity, $unitCost, $userId, $remarks) {
            $part = is_numeric($partId)
                ? Part::where('id', (int) $partId)->lockForUpdate()->first()
                : Part::where('part_number', $partId)->lockForUpdate()->first();

            if (!$part) {
                throw new \Exception('Part not found', 404);
            }

            $balanceBefore = $part->stock_quantity;
            $newBalance = $balanceBefore + $quantity;
            $part->stock_quantity = $newBalance;
            if ($unitCost !== null && $unitCost > 0) {
                $part->unit_cost = $unitCost;
            }
            $part->save();

            InventoryAuditLog::create([
                'part_id' => $part->id,
                'repair_log_id' => null,
                'user_id' => $userId,
                'change_type' => InventoryAuditLog::TYPE_RESTOCK,
                'quantity_delta' => $quantity,
                'balance_before' => $balanceBefore,
                'balance_after' => $newBalance,
                'remarks' => $remarks ?? "Restock to Bin {$part->location_bin}",
                'timestamp' => now(),
            ]);

            return [
                'part_id' => $part->id,
                'part_number' => $part->part_number,
                'name' => $part->name,
                'bin' => $part->location_bin,
                'previous_stock' => $balanceBefore,
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

        $tickets = RepairLog::all();
        $totalTickets = $tickets->count();
        $activeTickets = $tickets->filter(fn($t) => !in_array($t->status, [RepairLog::STATUS_OPERATIONAL, RepairLog::STATUS_CLOSED]))->count();
        $completedTickets = $tickets->filter(fn($t) => in_array($t->status, [RepairLog::STATUS_OPERATIONAL, RepairLog::STATUS_CLOSED]))->count();

        $byStatus = [
            'REPORTED' => $tickets->where('status', RepairLog::STATUS_REPORTED)->count(),
            'DIAGNOSING' => $tickets->where('status', RepairLog::STATUS_DIAGNOSING)->count(),
            'PENDING_TECH_APPROVAL' => $tickets->where('status', RepairLog::STATUS_PENDING_TECH_APPROVAL)->count(),
            'PENDING_SPARE_DISPATCH' => $tickets->where('status', RepairLog::STATUS_PENDING_SPARE_DISPATCH)->count(),
            'IN_REPAIR' => $tickets->where('status', RepairLog::STATUS_IN_REPAIR)->count(),
            'PENDING_SIGN_OFF' => $tickets->where('status', RepairLog::STATUS_PENDING_SIGN_OFF)->count(),
            'OPERATIONAL' => $tickets->where('status', RepairLog::STATUS_OPERATIONAL)->count(),
            'CLOSED' => $tickets->where('status', RepairLog::STATUS_CLOSED)->count(),
        ];

        $recentActivity = InventoryAuditLog::with(['part', 'repairLog.machine', 'user'])
            ->orderByDesc('timestamp')
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
            'machines' => [
                'total_machines' => Machine::count(),
                'breakdown_machines' => Machine::where('status', Machine::STATUS_BREAKDOWN)->count(),
                'operational_machines' => Machine::where('status', Machine::STATUS_OPERATIONAL)->count(),
            ],
            'recent_activity' => $recentActivity,
        ];
    }
}
