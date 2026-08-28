<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\RestockInventoryRequest;
use App\Models\InventoryAuditLog;
use App\Models\Part;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InventoryController extends Controller
{
    public function parts(Request $request): JsonResponse
    {
        $query = Part::query();

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        if ($request->boolean('low_stock')) {
            $query->whereRaw('stock_quantity <= min_threshold');
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('part_number', 'like', "%{$search}%")
                  ->orWhere('location_bin', 'like', "%{$search}%")
                  ->orWhere('category', 'like', "%{$search}%");
            });
        }

        $parts = $query->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => $parts,
        ]);
    }

    public function createPart(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'part_number' => 'required|string|max:50|unique:parts,part_number',
            'name' => 'required|string|max:100',
            'category' => 'required|string|max:50',
            'stock_quantity' => 'required|integer|min:0',
            'min_threshold' => 'required|integer|min:0',
            'unit_cost' => 'required|numeric|min:0',
            'location_bin' => 'required|string|max:30',
            'compatible_machine_types' => 'nullable|array',
        ]);

        $part = DB::transaction(function () use ($validated, $request) {
            $part = Part::create($validated);

            if ($part->stock_quantity > 0) {
                InventoryAuditLog::create([
                    'part_id' => $part->id,
                    'user_id' => $request->user()?->id,
                    'change_type' => InventoryAuditLog::TYPE_RESTOCK,
                    'quantity_delta' => $part->stock_quantity,
                    'balance_before' => 0,
                    'balance_after' => $part->stock_quantity,
                    'remarks' => "Initial catalog provisioning in Bin {$part->location_bin}",
                    'timestamp' => now(),
                ]);
            }

            return $part;
        });

        return response()->json([
            'success' => true,
            'message' => 'Spare part registered in catalog.',
            'data' => $part,
        ], 201);
    }

    public function restock(RestockInventoryRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $user = $request->user();

        $part = DB::transaction(function () use ($validated, $user) {
            $part = Part::where('id', $validated['part_id'])->lockForUpdate()->firstOrFail();

            $balanceBefore = $part->stock_quantity;
            $delta = (int) $validated['quantity'];
            $balanceAfter = $balanceBefore + $delta;

            $part->stock_quantity = $balanceAfter;
            $part->save();

            InventoryAuditLog::create([
                'part_id' => $part->id,
                'user_id' => $user?->id,
                'change_type' => InventoryAuditLog::TYPE_RESTOCK,
                'quantity_delta' => $delta,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'remarks' => $validated['remarks'] ?? "Restocked to Bin {$part->location_bin}",
                'timestamp' => now(),
            ]);

            return $part;
        });

        return response()->json([
            'success' => true,
            'message' => "Successfully restocked {$validated['quantity']} units of {$part->name}.",
            'data' => $part,
        ]);
    }

    public function adjustStock(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'part_id' => 'required|exists:parts,id',
            'new_quantity' => 'required|integer|min:0',
            'reason' => 'required|string|max:255',
        ]);

        $user = $request->user();

        $part = DB::transaction(function () use ($validated, $user) {
            $part = Part::where('id', $validated['part_id'])->lockForUpdate()->firstOrFail();

            $balanceBefore = $part->stock_quantity;
            $balanceAfter = (int) $validated['new_quantity'];
            $delta = $balanceAfter - $balanceBefore;

            $part->stock_quantity = $balanceAfter;
            $part->save();

            InventoryAuditLog::create([
                'part_id' => $part->id,
                'user_id' => $user?->id,
                'change_type' => InventoryAuditLog::TYPE_ADJUSTMENT,
                'quantity_delta' => $delta,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'remarks' => "Stock Audit Adjustment: " . $validated['reason'],
                'timestamp' => now(),
            ]);

            return $part;
        });

        return response()->json([
            'success' => true,
            'message' => "Stock adjusted for {$part->name}.",
            'data' => $part,
        ]);
    }

    public function auditLogs(Request $request): JsonResponse
    {
        $query = InventoryAuditLog::with(['part', 'repairLog.machine', 'user']);

        if ($request->filled('part_id')) {
            $query->where('part_id', $request->part_id);
        }

        if ($request->filled('change_type')) {
            $query->where('change_type', $request->change_type);
        }

        if ($request->filled('ticket_id')) {
            $query->where('repair_log_id', $request->ticket_id);
        }

        $logs = $query->orderByDesc('timestamp')->limit(100)->get();

        return response()->json([
            'success' => true,
            'data' => $logs,
        ]);
    }

    public function stats(): JsonResponse
    {
        $totalUniqueParts = Part::count();
        $totalStockUnits = Part::sum('stock_quantity') ?? 0;
        $lowStockCount = Part::whereRaw('stock_quantity <= min_threshold')->count();
        $outOfStockCount = Part::where('stock_quantity', 0)->count();
        $totalValuation = Part::selectRaw('SUM(stock_quantity * unit_cost) as total')->value('total') ?? 0;

        $categories = Part::select('category', DB::raw('COUNT(*) as count'), DB::raw('SUM(stock_quantity) as total_units'))
            ->groupBy('category')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'total_unique_parts' => $totalUniqueParts,
                'total_stock_units' => (int) $totalStockUnits,
                'low_stock_count' => $lowStockCount,
                'out_of_stock_count' => $outOfStockCount,
                'total_valuation' => (float) $totalValuation,
                'categories' => $categories,
            ],
        ]);
    }
}
