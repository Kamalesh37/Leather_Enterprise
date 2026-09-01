<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Block;
use App\Models\Floor;
use App\Models\Line;
use App\Models\Machine;
use App\Models\RepairLog;
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

        $blocks = Block::select('id', 'name', 'code')->get();
        $floors = Floor::select('id', 'block_id', 'name', 'floor_number')->get();
        $lines = Line::select('id', 'floor_id', 'name', 'line_code')->get();

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

    public function createBlock(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'code' => 'nullable|string|max:50',
            'description' => 'nullable|string|max:500',
        ]);

        $block = Block::create([
            'name' => $validated['name'],
            'code' => $validated['code'] ?? $validated['name'],
            'description' => $validated['description'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Block {$block->name} created successfully.",
            'data' => $block,
        ], 201);
    }

    public function updateBlock(Request $request, int $id): JsonResponse
    {
        $block = Block::findOrFail($id);
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'code' => 'nullable|string|max:50',
            'description' => 'nullable|string|max:500',
        ]);

        $block->update([
            'name' => $validated['name'],
            'code' => $validated['code'] ?? $validated['name'],
            'description' => $validated['description'] ?? $block->description,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Block updated to {$block->name}.",
            'data' => $block,
        ]);
    }

    public function createFloor(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'block_id' => 'required|exists:blocks,id',
            'name' => 'required|string|max:100',
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
            'data' => $floor,
        ], 201);
    }

    public function updateFloor(Request $request, int $id): JsonResponse
    {
        $floor = Floor::findOrFail($id);
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'floor_number' => 'nullable|integer',
            'block_id' => 'nullable|exists:blocks,id',
        ]);

        $floor->update(array_filter([
            'name' => $validated['name'],
            'floor_number' => $validated['floor_number'] ?? $floor->floor_number,
            'block_id' => $validated['block_id'] ?? $floor->block_id,
        ]));

        return response()->json([
            'success' => true,
            'message' => "Floor updated to {$floor->name}.",
            'data' => $floor,
        ]);
    }

    public function createLine(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'floor_id' => 'required|exists:floors,id',
            'name' => 'required|string|max:100',
            'line_code' => 'nullable|string|max:50',
        ]);

        $line = Line::create([
            'floor_id' => $validated['floor_id'],
            'name' => $validated['name'],
            'line_code' => $validated['line_code'] ?? $validated['name'],
        ]);

        return response()->json([
            'success' => true,
            'message' => "Line {$line->name} created successfully.",
            'data' => $line,
        ], 201);
    }

    public function updateLine(Request $request, int $id): JsonResponse
    {
        $line = Line::findOrFail($id);
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'line_code' => 'nullable|string|max:50',
            'floor_id' => 'nullable|exists:floors,id',
        ]);

        $line->update(array_filter([
            'name' => $validated['name'],
            'line_code' => $validated['line_code'] ?? $validated['name'],
            'floor_id' => $validated['floor_id'] ?? $line->floor_id,
        ]));

        return response()->json([
            'success' => true,
            'message' => "Line updated to {$line->name}.",
            'data' => $line,
        ]);
    }
}

