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

    public function options(): JsonResponse
    {
        $blocks = Block::select('id', 'name', 'code')->get();
        $floors = Floor::select('id', 'block_id', 'name', 'floor_number')->get();
        $lines = Line::select('id', 'floor_id', 'name', 'line_code')->get();

        return response()->json([
            'success' => true,
            'data' => [
                'blocks' => $blocks,
                'floors' => $floors,
                'lines' => $lines,
            ],
        ]);
    }

    public function dashboardSummary(Request $request): JsonResponse
    {
        $user = $request->user();

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
