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

    // ==========================================
    // WAREHOUSE & INVENTORY CATEGORY MASTER CRUD
    // ==========================================

    public function listCategories(): JsonResponse
    {
        $categories = \App\Models\InventoryCategory::orderBy('name')->get();

        $stats = Part::select(
            'category',
            DB::raw('COUNT(*) as parts_count'),
            DB::raw('SUM(stock_quantity) as total_units'),
            DB::raw('SUM(stock_quantity * unit_cost) as total_value')
        )
        ->groupBy('category')
        ->get()
        ->keyBy('category');

        $data = $categories->map(function ($cat) use ($stats) {
            $catStat = $stats[$cat->name] ?? null;
            return [
                'id' => $cat->id,
                'category_code' => $cat->category_code,
                'name' => $cat->name,
                'description' => $cat->description,
                'storage_zone' => $cat->storage_zone,
                'color' => $cat->color,
                'is_active' => (bool) $cat->is_active,
                'parts_count' => $catStat ? (int) $catStat->parts_count : 0,
                'total_units' => $catStat ? (int) $catStat->total_units : 0,
                'total_value' => $catStat ? (float) $catStat->total_value : 0.0,
                'created_at' => $cat->created_at,
                'updated_at' => $cat->updated_at,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    public function storeCategory(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category_code' => 'required|string|max:50|unique:inventory_categories,category_code',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'storage_zone' => 'required|string|max:100',
            'color' => 'nullable|string|max:20',
            'is_active' => 'nullable|boolean',
        ]);

        $category = \App\Models\InventoryCategory::create([
            'category_code' => strtoupper($validated['category_code']),
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'storage_zone' => $validated['storage_zone'],
            'color' => $validated['color'] ?? '#818cf8',
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Inventory Category created successfully.',
            'data' => $category,
        ], 201);
    }

    public function updateCategory(Request $request, int $id): JsonResponse
    {
        $category = \App\Models\InventoryCategory::findOrFail($id);

        $validated = $request->validate([
            'category_code' => 'sometimes|required|string|max:50|unique:inventory_categories,category_code,' . $id,
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'storage_zone' => 'sometimes|required|string|max:100',
            'color' => 'nullable|string|max:20',
            'is_active' => 'nullable|boolean',
        ]);

        $oldName = $category->name;
        if (isset($validated['category_code'])) {
            $validated['category_code'] = strtoupper($validated['category_code']);
        }

        $category->update($validated);

        // If category name changed, update corresponding parts
        if (isset($validated['name']) && $validated['name'] !== $oldName) {
            Part::where('category', $oldName)->update(['category' => $validated['name']]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Inventory Category updated successfully.',
            'data' => $category,
        ]);
    }

    public function destroyCategory(int $id): JsonResponse
    {
        $category = \App\Models\InventoryCategory::findOrFail($id);

        if (Part::where('category', $category->name)->exists()) {
            return response()->json([
                'success' => false,
                'message' => "Cannot delete Category [{$category->name}] because it has active spare parts allocated to it. Reassign parts first.",
            ], 422);
        }

        $category->delete();

        return response()->json([
            'success' => true,
            'message' => "Category [{$category->name}] deleted successfully.",
        ]);
    }

    // =========================================================================
    // WAREHOUSE STORAGE ZONES CRUD
    // =========================================================================
    public function listStorageZones(Request $request): JsonResponse
    {
        $query = \App\Models\WarehouseStorageZone::query();

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                  ->orWhere('zone_code', 'like', "%{$s}%")
                  ->orWhere('aisle_bay', 'like', "%{$s}%")
                  ->orWhere('location_type', 'like', "%{$s}%")
                  ->orWhere('description', 'like', "%{$s}%");
            });
        }

        $zones = $query->orderBy('zone_code')->get();

        $data = $zones->map(function ($zone) {
            $categoriesCount = \App\Models\InventoryCategory::where('storage_zone', 'like', "%{$zone->zone_code}%")
                ->orWhere('storage_zone', 'like', "%{$zone->name}%")
                ->count();

            return [
                'id' => $zone->id,
                'zone_code' => $zone->zone_code,
                'name' => $zone->name,
                'location_type' => $zone->location_type,
                'aisle_bay' => $zone->aisle_bay,
                'capacity_bins' => (int) $zone->capacity_bins,
                'description' => $zone->description,
                'color' => $zone->color,
                'is_active' => (bool) $zone->is_active,
                'categories_count' => $categoriesCount,
                'created_at' => $zone->created_at,
                'updated_at' => $zone->updated_at,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    public function storeStorageZone(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'zone_code' => 'required|string|max:32|unique:warehouse_storage_zones,zone_code',
            'name' => 'required|string|max:128',
            'location_type' => 'nullable|string|max:64',
            'aisle_bay' => 'nullable|string|max:128',
            'capacity_bins' => 'nullable|integer|min:1',
            'description' => 'nullable|string',
            'color' => 'nullable|string|max:20',
            'is_active' => 'nullable|boolean',
        ]);

        $zone = \App\Models\WarehouseStorageZone::create([
            'zone_code' => strtoupper($validated['zone_code']),
            'name' => $validated['name'],
            'location_type' => $validated['location_type'] ?? 'RACK',
            'aisle_bay' => $validated['aisle_bay'] ?? null,
            'capacity_bins' => $validated['capacity_bins'] ?? 20,
            'description' => $validated['description'] ?? null,
            'color' => $validated['color'] ?? '#3b82f6',
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Warehouse Storage Zone created successfully.',
            'data' => $zone,
        ], 201);
    }

    public function updateStorageZone(Request $request, int $id): JsonResponse
    {
        $zone = \App\Models\WarehouseStorageZone::findOrFail($id);

        $validated = $request->validate([
            'zone_code' => 'sometimes|required|string|max:32|unique:warehouse_storage_zones,zone_code,' . $id,
            'name' => 'sometimes|required|string|max:128',
            'location_type' => 'nullable|string|max:64',
            'aisle_bay' => 'nullable|string|max:128',
            'capacity_bins' => 'nullable|integer|min:1',
            'description' => 'nullable|string',
            'color' => 'nullable|string|max:20',
            'is_active' => 'nullable|boolean',
        ]);

        if (isset($validated['zone_code'])) {
            $validated['zone_code'] = strtoupper($validated['zone_code']);
        }

        $zone->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Warehouse Storage Zone updated successfully.',
            'data' => $zone,
        ]);
    }

    public function destroyStorageZone(int $id): JsonResponse
    {
        $zone = \App\Models\WarehouseStorageZone::findOrFail($id);

        // Check if any category or part refers to this zone
        $hasLinkedCategory = \App\Models\InventoryCategory::where('storage_zone', 'like', "%{$zone->zone_code}%")
            ->orWhere('storage_zone', 'like', "%{$zone->name}%")
            ->exists();

        if ($hasLinkedCategory) {
            return response()->json([
                'success' => false,
                'message' => "Cannot delete Zone [{$zone->name}] because it is assigned to active Inventory Categories.",
            ], 422);
        }

        $zone->delete();

        return response()->json([
            'success' => true,
            'message' => "Warehouse Storage Zone [{$zone->name}] deleted successfully.",
        ]);
    }
}
