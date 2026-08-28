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
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    public function dashboard(Request $request): JsonResponse
    {
        $totalMachines = Machine::count();
        $operationalCount = Machine::where('status', Machine::STATUS_OPERATIONAL)->count();
        $breakdownCount = Machine::whereIn('status', [Machine::STATUS_BREAKDOWN, Machine::STATUS_UNDER_MAINTENANCE])->count();

        $totalTickets = RepairLog::count();
        $openTickets = RepairLog::whereNotIn('status', [RepairLog::STATUS_OPERATIONAL, RepairLog::STATUS_CLOSED])->count();
        $completedTickets = RepairLog::whereIn('status', [RepairLog::STATUS_OPERATIONAL, RepairLog::STATUS_CLOSED])->count();

        // Calculate MTTR (Mean Time To Repair in minutes)
        $avgMttrMinutes = RepairLog::whereNotNull('total_downtime_minutes')->avg('total_downtime_minutes') ?? 0;
        $totalDowntimeMinutes = RepairLog::sum('total_downtime_minutes') ?? 0;

        // Line-by-line downtime and active breakdowns
        $lineMetrics = Line::with(['floor.block'])
            ->withCount(['machines as total_machines'])
            ->withCount(['repairLogs as open_breakdowns' => function ($q) {
                $q->whereNotIn('status', [RepairLog::STATUS_OPERATIONAL, RepairLog::STATUS_CLOSED]);
            }])
            ->get()
            ->map(function ($line) {
                $totalLineDowntime = RepairLog::where('line_id', $line->id)->sum('total_downtime_minutes') ?? 0;
                return [
                    'line_id' => $line->id,
                    'line_name' => $line->name,
                    'line_code' => $line->line_code,
                    'floor_name' => $line->floor?->name,
                    'block_name' => $line->floor?->block?->name,
                    'total_machines' => $line->total_machines,
                    'open_breakdowns' => $line->open_breakdowns,
                    'total_downtime_minutes' => $totalLineDowntime,
                ];
            });

        // Failure distribution by machine type / model
        $failuresByModel = RepairLog::join('machines', 'repair_logs.machine_id', '=', 'machines.id')
            ->select('machines.name as machine_name', 'machines.model_number', DB::raw('count(repair_logs.id) as ticket_count'), DB::raw('sum(repair_logs.total_downtime_minutes) as downtime_sum'))
            ->groupBy('machines.name', 'machines.model_number')
            ->orderByDesc('ticket_count')
            ->limit(6)
            ->get();

        // Tickets by status
        $ticketsByStatus = RepairLog::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status');

        return response()->json([
            'success' => true,
            'data' => [
                'overview' => [
                    'total_machines' => $totalMachines,
                    'operational_count' => $operationalCount,
                    'breakdown_count' => $breakdownCount,
                    'availability_pct' => $totalMachines > 0 ? round(($operationalCount / $totalMachines) * 100, 1) : 100,
                    'total_tickets' => $totalTickets,
                    'open_tickets' => $openTickets,
                    'completed_tickets' => $completedTickets,
                    'mttr_minutes' => round($avgMttrMinutes, 1),
                    'total_downtime_minutes' => $totalDowntimeMinutes,
                ],
                'tickets_by_status' => $ticketsByStatus,
                'line_metrics' => $lineMetrics,
                'failures_by_model' => $failuresByModel,
            ],
        ]);
    }
}
