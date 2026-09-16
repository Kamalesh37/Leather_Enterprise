<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Block;
use App\Models\Floor;
use App\Models\Line;
use App\Models\Machine;
use App\Models\RepairLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HierarchyController extends Controller
{
    public function index(): JsonResponse
    {
        $blocks = Block::with([
            'floors.lines.machines' => function ($query) {
                $query->select('id', 'machine_code', 'name', 'line_id', 'status', 'qr_code_hash');
            }
        ])->get();

        return response()->json([
            'success' => true,
            'data' => $blocks,
        ]);
    }

    public function options(Request $request): JsonResponse
    {
        $user = auth('sanctum')->user() ?? $request->user();

        $blocks = Block::select('id', 'name', 'code', 'description')->get();
        $floors = Floor::select('id', 'block_id', 'name', 'floor_number')->with('block:id,name,code')->get();
        $lines = Line::select('id', 'floor_id', 'name', 'line_code')->with('floor.block:id,name,code')->get();

        return response()->json([
            'success' => true,
            'data' => [
                'blocks' => $blocks,
                'floors' => $floors,
                'lines' => $lines,
                'user_scope' => $user ? [
                    'role' => $user->role,
                    'block_id' => $user->block_id,
                    'floor_id' => $user->floor_id,
                    'line_id' => $user->line_id,
                ] : null,
            ],
        ]);
    }

    // ==========================================
    // BLOCK MASTER CRUD
    // ==========================================
    public function listBlocks(): JsonResponse
    {
        $blocks = Block::withCount(['floors', 'machines', 'users'])
            ->with(['floors' => function ($q) {
                $q->withCount(['lines', 'machines']);
            }])
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $blocks,
        ]);
    }

    public function storeBlock(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50',
            'description' => 'nullable|string|max:500',
        ]);

        $block = Block::create([
            'name' => $validated['name'],
            'code' => !empty($validated['code']) ? $validated['code'] : $validated['name'],
            'description' => $validated['description'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Block {$block->name} created successfully.",
            'data' => $block->loadCount(['floors', 'machines', 'users']),
        ], 201);
    }

    public function updateBlock(Request $request, int $id): JsonResponse
    {
        $block = Block::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'code' => 'nullable|string|max:50',
            'description' => 'nullable|string|max:500',
        ]);

        $block->update(array_filter([
            'name' => $validated['name'] ?? $block->name,
            'code' => $validated['code'] ?? $block->code,
            'description' => array_key_exists('description', $validated) ? $validated['description'] : $block->description,
        ]));

        return response()->json([
            'success' => true,
            'message' => "Block updated successfully.",
            'data' => $block->fresh()->loadCount(['floors', 'machines', 'users']),
        ]);
    }

    public function destroyBlock(int $id): JsonResponse
    {
        $block = Block::findOrFail($id);

        if ($block->floors()->exists() || $block->machines()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete Block with active floors or machinery. Reassign or remove dependencies first.',
            ], 422);
        }

        $block->delete();

        return response()->json([
            'success' => true,
            'message' => 'Block deleted successfully.',
        ]);
    }

    // ==========================================
    // FLOOR MASTER CRUD
    // ==========================================
    public function listFloors(): JsonResponse
    {
        $floors = Floor::with('block:id,name,code')
            ->withCount(['lines', 'machines', 'users'])
            ->orderBy('block_id')
            ->orderBy('floor_number')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $floors,
        ]);
    }

    public function storeFloor(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'block_id' => 'required|exists:blocks,id',
            'name' => 'required|string|max:255',
            'floor_number' => 'nullable|integer',
        ]);

        $floor = Floor::create([
            'block_id' => $validated['block_id'],
            'name' => $validated['name'],
            'floor_number' => $validated['floor_number'] ?? 1,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Floor {$floor->name} created successfully.",
            'data' => $floor->load(['block:id,name,code'])->loadCount(['lines', 'machines', 'users']),
        ], 201);
    }

    public function updateFloor(Request $request, int $id): JsonResponse
    {
        $floor = Floor::findOrFail($id);

        $validated = $request->validate([
            'block_id' => 'sometimes|required|exists:blocks,id',
            'name' => 'sometimes|required|string|max:255',
            'floor_number' => 'nullable|integer',
        ]);

        $floor->update(array_filter([
            'name' => $validated['name'] ?? $floor->name,
            'block_id' => $validated['block_id'] ?? $floor->block_id,
            'floor_number' => $validated['floor_number'] ?? $floor->floor_number,
        ]));

        return response()->json([
            'success' => true,
            'message' => "Floor updated successfully.",
            'data' => $floor->fresh(['block:id,name,code'])->loadCount(['lines', 'machines', 'users']),
        ]);
    }

    public function destroyFloor(int $id): JsonResponse
    {
        $floor = Floor::findOrFail($id);

        if ($floor->lines()->exists() || $floor->machines()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete Floor with active lines or machinery. Reassign or remove dependencies first.',
            ], 422);
        }

        $floor->delete();

        return response()->json([
            'success' => true,
            'message' => 'Floor deleted successfully.',
        ]);
    }

    // ==========================================
    // LINE MASTER CRUD
    // ==========================================
    public function listLines(): JsonResponse
    {
        $lines = Line::with(['floor.block:id,name,code'])
            ->withCount(['machines', 'users', 'repairLogs'])
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $lines,
        ]);
    }

    public function storeLine(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'floor_id' => 'required|exists:floors,id',
            'name' => 'required|string|max:255',
            'line_code' => 'nullable|string|max:50',
        ]);

        $line = Line::create([
            'floor_id' => $validated['floor_id'],
            'name' => $validated['name'],
            'line_code' => !empty($validated['line_code']) ? $validated['line_code'] : $validated['name'],
        ]);

        return response()->json([
            'success' => true,
            'message' => "Line {$line->name} created successfully.",
            'data' => $line->load(['floor.block:id,name,code'])->loadCount(['machines', 'users']),
        ], 201);
    }

    public function updateLine(Request $request, int $id): JsonResponse
    {
        $line = Line::findOrFail($id);

        $validated = $request->validate([
            'floor_id' => 'sometimes|required|exists:floors,id',
            'name' => 'sometimes|required|string|max:255',
            'line_code' => 'nullable|string|max:50',
        ]);

        $line->update(array_filter([
            'name' => $validated['name'] ?? $line->name,
            'line_code' => $validated['line_code'] ?? $line->line_code,
            'floor_id' => $validated['floor_id'] ?? $line->floor_id,
        ]));

        return response()->json([
            'success' => true,
            'message' => "Line updated successfully.",
            'data' => $line->fresh(['floor.block:id,name,code'])->loadCount(['machines', 'users']),
        ]);
    }

    public function destroyLine(int $id): JsonResponse
    {
        $line = Line::findOrFail($id);

        if ($line->machines()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete Line with active machinery units installed.',
            ], 422);
        }

        $line->delete();

        return response()->json([
            'success' => true,
            'message' => 'Line deleted successfully.',
        ]);
    }

    // ==========================================
    // ROLE MASTER DEFINITIONS & CRUD
    // ==========================================
    public function listRoles(): JsonResponse
    {
        $roles = \App\Models\Role::orderBy('id')->get();
        $counts = User::select('role', \DB::raw('count(*) as count'))
            ->groupBy('role')
            ->pluck('count', 'role');

        $data = $roles->map(function ($r) use ($counts) {
            return [
                'id' => $r->id,
                'role' => $r->role_key,
                'name' => $r->name,
                'category' => $r->category,
                'description' => $r->description,
                'scope' => $r->scope,
                'color' => $r->color,
                'badge' => $r->badge,
                'permissions' => $r->permissions ?? [],
                'is_system' => (bool) $r->is_system,
                'crew_count' => $counts[$r->role_key] ?? 0,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    public function storeRole(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'role_key' => 'required|string|max:50|unique:roles,role_key|alpha_dash',
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:100',
            'description' => 'nullable|string',
            'scope' => 'required|string|max:255',
            'color' => 'nullable|string|max:20',
            'badge' => 'nullable|string|max:50',
            'permissions' => 'nullable|array',
        ]);

        $role = \App\Models\Role::create([
            'role_key' => strtolower($validated['role_key']),
            'name' => $validated['name'],
            'category' => $validated['category'],
            'description' => $validated['description'] ?? null,
            'scope' => $validated['scope'],
            'color' => $validated['color'] ?? '#6366f1',
            'badge' => $validated['badge'] ?? 'Custom Role',
            'permissions' => $validated['permissions'] ?? [],
            'is_system' => false,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Role Profile created successfully.',
            'data' => $role,
        ], 201);
    }

    public function updateRole(Request $request, int $id): JsonResponse
    {
        $role = \App\Models\Role::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'category' => 'sometimes|required|string|max:100',
            'description' => 'nullable|string',
            'scope' => 'sometimes|required|string|max:255',
            'color' => 'nullable|string|max:20',
            'badge' => 'nullable|string|max:50',
            'permissions' => 'nullable|array',
        ]);

        $role->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Role Profile updated successfully.',
            'data' => $role,
        ]);
    }

    public function destroyRole(int $id): JsonResponse
    {
        $role = \App\Models\Role::findOrFail($id);

        if ($role->is_system) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete standard system role profile.',
            ], 422);
        }

        if (User::where('role', $role->role_key)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete Role with active assigned crew members. Reassign members first.',
            ], 422);
        }

        $role->delete();

        return response()->json([
            'success' => true,
            'message' => 'Role Profile deleted successfully.',
        ]);
    }

    public function dashboardSummary(Request $request): JsonResponse
    {
        $user = auth('sanctum')->user() ?? $request->user();

        $machineQuery = Machine::query();
        $ticketQuery = RepairLog::query();

        // Scope by user's hierarchy if not global admin
        if ($user && $user->role === 'block_manager' && $user->block_id) {
            $machineQuery->where('block_id', $user->block_id);
            $ticketQuery->whereHas('machine', fn($q) => $q->where('block_id', $user->block_id));
        } elseif ($user && $user->role === 'floor_manager' && $user->floor_id) {
            $machineQuery->where('floor_id', $user->floor_id);
            $ticketQuery->whereHas('machine', fn($q) => $q->where('floor_id', $user->floor_id));
        } elseif ($user && $user->role === 'line_supervisor' && $user->line_id) {
            $machineQuery->where('line_id', $user->line_id);
            $ticketQuery->where('line_id', $user->line_id);
        }

        $totalMachines = (clone $machineQuery)->count();
        $operationalMachines = (clone $machineQuery)->where('status', Machine::STATUS_OPERATIONAL)->count();
        $breakdownMachines = (clone $machineQuery)->whereIn('status', [Machine::STATUS_BREAKDOWN, Machine::STATUS_UNDER_MAINTENANCE])->count();
        
        $activeTickets = (clone $ticketQuery)->whereNotIn('status', [RepairLog::STATUS_OPERATIONAL, RepairLog::STATUS_CLOSED])->count();
        $totalDowntime = (clone $ticketQuery)->sum('total_downtime_minutes') ?? 0;

        return response()->json([
            'success' => true,
            'data' => [
                'total_machines' => $totalMachines,
                'operational_machines' => $operationalMachines,
                'breakdown_machines' => $breakdownMachines,
                'availability_rate' => $totalMachines > 0 ? round(($operationalMachines / $totalMachines) * 100, 1) : 100,
                'active_tickets' => $activeTickets,
                'total_downtime_minutes' => $totalDowntime,
            ],
        ]);
    }
}

