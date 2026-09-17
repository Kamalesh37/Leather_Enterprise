<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateRepairTicketRequest;
use App\Http\Requests\SubmitDiagnosisRequest;
use App\Models\Machine;
use App\Models\RepairLog;
use App\Models\RepairSpareRequest;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RepairTicketController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = RepairLog::with([
            'machine.vendor',
            'machine.block',
            'machine.floor',
            'machine.line',
            'reporter',
            'mechanic',
            'techLead',
            'spareHead',
            'spareRequests.part',
        ]);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('ticket_type')) {
            $query->where('ticket_type', $request->ticket_type);
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        if ($request->filled('line_id')) {
            $query->where('line_id', $request->line_id);
        }

        if ($request->filled('mechanic_id')) {
            $query->where('mechanic_id', $request->mechanic_id);
        }

        // Scope by user role if requested
        if ($request->boolean('my_queue') && $user) {
            if ($user->role === 'mechanic') {
                $query->where('mechanic_id', $user->id);
            } elseif ($user->role === 'line_supervisor' && $user->line_id) {
                $query->where('line_id', $user->line_id);
            } elseif ($user->role === 'tech_lead') {
                $query->whereIn('status', [
                    RepairLog::STATUS_PENDING_TECH_APPROVAL,
                    RepairLog::STATUS_PENDING_SIGN_OFF,
                ]);
            } elseif ($user->role === 'spare_head') {
                $query->where('status', RepairLog::STATUS_PENDING_SPARE_DISPATCH);
            }
        }

        $tickets = $query->orderByDesc('created_at')->get();

        return response()->json([
            'success' => true,
            'data' => $tickets,
        ]);
    }

    /**
     * Intake: Line Supervisor scans QR and creates ticket
     */
    public function store(CreateRepairTicketRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $user = $request->user();

        // Resolve machine
        $machine = null;
        if (!empty($validated['qr_code_hash'])) {
            $machine = Machine::where('qr_code_hash', $validated['qr_code_hash'])->firstOrFail();
        } elseif (!empty($validated['machine_id'])) {
            $machine = Machine::findOrFail($validated['machine_id']);
        } else {
            return response()->json([
                'success' => false,
                'message' => 'Either machine_id or qr_code_hash must be provided.',
            ], 422);
        }

        $ticketNumber = 'TKT-' . date('Ymd') . '-' . strtoupper(Str::random(5));

        $ticket = DB::transaction(function () use ($validated, $user, $machine, $ticketNumber) {
            // Update machine status
            $machine->status = $validated['ticket_type'] === RepairLog::TYPE_ROUTINE_SERVICE 
                ? Machine::STATUS_UNDER_MAINTENANCE 
                : Machine::STATUS_BREAKDOWN;
            $machine->save();

            $initialStatus = !empty($validated['mechanic_id']) 
                ? RepairLog::STATUS_DIAGNOSING 
                : RepairLog::STATUS_REPORTED;

            return RepairLog::create([
                'ticket_number' => $ticketNumber,
                'machine_id' => $machine->id,
                'line_id' => $machine->line_id,
                'reporter_id' => $user ? $user->id : 1,
                'mechanic_id' => $validated['mechanic_id'] ?? null,
                'ticket_type' => $validated['ticket_type'],
                'priority' => $validated['priority'],
                'status' => $initialStatus,
                'reported_issue' => $validated['reported_issue'],
                'breakdown_start_time' => now(),
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Breakdown ticket created successfully.',
            'data' => $ticket->load([
                'machine.vendor',
                'machine.block',
                'machine.floor',
                'machine.line',
                'reporter',
                'mechanic',
            ]),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $ticket = RepairLog::with([
            'machine.vendor',
            'machine.block',
            'machine.floor',
            'machine.line',
            'reporter',
            'mechanic',
            'techLead',
            'spareHead',
            'spareRequests.part',
            'auditLogs.part',
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $ticket,
        ]);
    }

    /**
     * Line Supervisor assigns Mechanic
     */
    public function assignMechanic(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'mechanic_id' => 'required|exists:users,id',
        ]);

        $ticket = RepairLog::findOrFail($id);
        $mechanic = User::where('id', $request->mechanic_id)->where('role', 'mechanic')->firstOrFail();

        $ticket->mechanic_id = $mechanic->id;
        if ($ticket->status === RepairLog::STATUS_REPORTED) {
            $ticket->status = RepairLog::STATUS_DIAGNOSING;
        }
        $ticket->save();

        return response()->json([
            'success' => true,
            'message' => "Assigned mechanic {$mechanic->name} to ticket {$ticket->ticket_number}.",
            'data' => $ticket->fresh(['mechanic', 'machine']),
        ]);
    }

    /**
     * Mechanic submits inspection diagnosis and Bill of Materials (BOM) requisition
     */
    public function submitDiagnosis(SubmitDiagnosisRequest $request, int $id): JsonResponse
    {
        $ticket = RepairLog::findOrFail($id);
        $validated = $request->validated();
        $user = $request->user();

        DB::transaction(function () use ($ticket, $validated, $user) {
            $ticket->diagnosis_notes = $validated['diagnosis_notes'];
            if ($user && $user->role === 'mechanic') {
                $ticket->mechanic_id = $user->id;
            }

            // Remove any draft requested parts if resubmitting
            $ticket->spareRequests()->where('status', RepairSpareRequest::STATUS_REQUESTED)->delete();

            $hasParts = false;
            if (!empty($validated['spare_parts'])) {
                foreach ($validated['spare_parts'] as $item) {
                    RepairSpareRequest::create([
                        'repair_log_id' => $ticket->id,
                        'part_id' => $item['part_id'],
                        'requested_quantity' => $item['quantity'],
                        'status' => RepairSpareRequest::STATUS_REQUESTED,
                    ]);
                    $hasParts = true;
                }
            }

            // If BOM parts are requested -> requires Tech Lead approval
            // If no replacement parts needed -> mechanic can proceed directly to repair
            if ($hasParts) {
                $ticket->status = RepairLog::STATUS_PENDING_TECH_APPROVAL;
            } else {
                $ticket->status = RepairLog::STATUS_IN_REPAIR;
            }

            $ticket->save();
        });

        return response()->json([
            'success' => true,
            'message' => 'Diagnostic assessment & BOM parts requisition submitted successfully.',
            'data' => $ticket->fresh([
                'machine',
                'mechanic',
                'spareRequests.part',
            ]),
        ]);
    }

    /**
     * Mechanic marks hands-on repair work completed
     */
    public function completeRepair(Request $request, int $id): JsonResponse
    {
        $ticket = RepairLog::findOrFail($id);

        $ticket->status = RepairLog::STATUS_PENDING_SIGN_OFF;
        $ticket->save();

        return response()->json([
            'success' => true,
            'message' => 'Repair completed by mechanic. Moved to Tech Lead for final verification sign-off.',
            'data' => $ticket->fresh(['machine', 'mechanic', 'spareRequests.part']),
        ]);
    }

    /**
     * Tech Lead performs final verification sign-off, marks machine OPERATIONAL, and calculates downtime
     */
    public function signOff(Request $request, int $id): JsonResponse
    {
        $ticket = RepairLog::with(['machine'])->findOrFail($id);
        $user = $request->user();

        $endTime = now();
        $startTime = $ticket->breakdown_start_time ? Carbon::parse($ticket->breakdown_start_time) : $ticket->created_at;
        $totalDowntimeMinutes = (int) max(1, round($startTime->diffInMinutes($endTime)));

        DB::transaction(function () use ($ticket, $user, $endTime, $totalDowntimeMinutes) {
            $ticket->tech_lead_id = $user ? $user->id : $ticket->tech_lead_id;
            $ticket->status = RepairLog::STATUS_OPERATIONAL;
            $ticket->breakdown_end_time = $endTime;
            $ticket->total_downtime_minutes = $totalDowntimeMinutes;
            $ticket->save();

            // Mark machine back to operational
            $ticket->machine->status = Machine::STATUS_OPERATIONAL;
            $ticket->machine->save();
        });

        return response()->json([
            'success' => true,
            'message' => "Final verification complete. Machine {$ticket->machine->machine_code} restored to OPERATIONAL. Total downtime: {$totalDowntimeMinutes} minutes.",
            'data' => $ticket->fresh([
                'machine',
                'mechanic',
                'techLead',
                'spareRequests.part',
            ]),
        ]);
    }
}
