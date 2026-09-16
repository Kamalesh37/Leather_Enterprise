<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMachineRequest;
use App\Models\Machine;
use App\Models\RepairLog;
use App\Models\ServiceCatalog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MachineController extends Controller
{
    /**
     * Helper to generate unique sequential machine codes and serials for batch provisioning
     */
    private function generateSequentialCodes(string $baseCode, string $baseSerial, int $quantity): array
    {
        // Clean trailing numbers/delimiters like -01, -1, _1
        $cleanBaseCode = preg_replace('/[-_#]?\d+$/', '', trim($baseCode));
        if (empty($cleanBaseCode)) {
            $cleanBaseCode = trim($baseCode);
        }

        $cleanBaseSerial = preg_replace('/[-_#]?\d+$/', '', trim($baseSerial));
        if (empty($cleanBaseSerial)) {
            $cleanBaseSerial = trim($baseSerial);
        }

        $units = [];
        $existingCodes = Machine::pluck('machine_code')->toArray();
        $existingSerials = Machine::pluck('serial_number')->toArray();

        $index = 1;
        while (count($units) < $quantity) {
            $candidateCode = $quantity === 1 && !in_array($baseCode, $existingCodes)
                ? $baseCode
                : $cleanBaseCode . '-' . sprintf('%02d', $index);

            $candidateSerial = $quantity === 1 && !in_array($baseSerial, $existingSerials)
                ? $baseSerial
                : $cleanBaseSerial . '-' . sprintf('%02d', $index);

            if (!in_array($candidateCode, $existingCodes) && !in_array($candidateSerial, $existingSerials)) {
                $units[] = [
                    'machine_code' => $candidateCode,
                    'serial_number' => $candidateSerial,
                ];
                $existingCodes[] = $candidateCode;
                $existingSerials[] = $candidateSerial;
            }
            $index++;
        }

        return $units;
    }

    public function index(Request $request): JsonResponse
    {
        $query = Machine::with(['vendor', 'block', 'floor', 'line'])
            ->withCount(['repairLogs as open_tickets_count' => function ($q) {
                $q->whereNotIn('status', [RepairLog::STATUS_OPERATIONAL, RepairLog::STATUS_CLOSED]);
            }]);

        if ($request->filled('block_id')) {
            $query->where('block_id', $request->block_id);
        }

        if ($request->filled('floor_id')) {
            $query->where('floor_id', $request->floor_id);
        }

        if ($request->filled('line_id')) {
            $query->where('line_id', $request->line_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('vendor_id')) {
            $query->where('vendor_id', $request->vendor_id);
        }

        if ($request->filled('search')) {
            $rawSearch = trim($request->search);
            $terms = array_filter(explode(' ', $rawSearch), fn($t) => strlen(trim($t)) > 0);

            $query->where(function ($q) use ($terms, $rawSearch) {
                $q->where('name', 'like', "%{$rawSearch}%")
                  ->orWhere('machine_code', 'like', "%{$rawSearch}%")
                  ->orWhere('model_number', 'like', "%{$rawSearch}%")
                  ->orWhere('serial_number', 'like', "%{$rawSearch}%")
                  ->orWhere('qr_code_hash', 'like', "%{$rawSearch}%")
                  ->orWhereHas('vendor', function ($vq) use ($rawSearch) {
                      $vq->where('name', 'like', "%{$rawSearch}%");
                  })
                  ->orWhereHas('line', function ($lq) use ($rawSearch) {
                      $lq->where('name', 'like', "%{$rawSearch}%")
                         ->orWhere('line_code', 'like', "%{$rawSearch}%");
                  })
                  ->orWhereHas('floor', function ($fq) use ($rawSearch) {
                      $fq->where('name', 'like', "%{$rawSearch}%");
                  });

                if (count($terms) > 1) {
                    $q->orWhere(function ($subQ) use ($terms) {
                        foreach ($terms as $term) {
                            $subQ->where(function ($tQ) use ($term) {
                                $tQ->where('name', 'like', "%{$term}%")
                                   ->orWhere('machine_code', 'like', "%{$term}%")
                                   ->orWhere('model_number', 'like', "%{$term}%")
                                   ->orWhere('serial_number', 'like', "%{$term}%")
                                   ->orWhereHas('vendor', fn($vq) => $vq->where('name', 'like', "%{$term}%"))
                                   ->orWhereHas('line', fn($lq) => $lq->where('name', 'like', "%{$term}%")->orWhere('line_code', 'like', "%{$term}%"));
                            });
                        }
                    });
                }
            });
        }

        $machines = $query->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => $machines,
        ]);
    }

    /**
     * Grouped machine models with quantity counts and separate physical unit lists
     */
    public function groupedTypes(Request $request): JsonResponse
    {
        $query = Machine::with(['vendor', 'block', 'floor', 'line'])
            ->withCount(['repairLogs as open_tickets_count' => function ($q) {
                $q->whereNotIn('status', [RepairLog::STATUS_OPERATIONAL, RepairLog::STATUS_CLOSED]);
            }]);

        if ($request->filled('block_id')) {
            $query->where('block_id', $request->block_id);
        }
        if ($request->filled('floor_id')) {
            $query->where('floor_id', $request->floor_id);
        }
        if ($request->filled('line_id')) {
            $query->where('line_id', $request->line_id);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('vendor_id')) {
            $query->where('vendor_id', $request->vendor_id);
        }

        $allMachines = $query->orderBy('name')->get();

        $grouped = [];
        foreach ($allMachines as $machine) {
            $key = trim($machine->model_number ?: $machine->name);
            if (!isset($grouped[$key])) {
                $grouped[$key] = [
                    'type_key' => $key,
                    'name' => $machine->name,
                    'model_number' => $machine->model_number,
                    'vendor' => $machine->vendor,
                    'vendor_id' => $machine->vendor_id,
                    'specifications' => $machine->specifications,
                    'image_url' => $machine->image_url,
                    'total_quantity' => 0,
                    'operational_count' => 0,
                    'breakdown_count' => 0,
                    'maintenance_count' => 0,
                    'machines' => [],
                ];
            }

            $grouped[$key]['total_quantity']++;
            if ($machine->status === Machine::STATUS_OPERATIONAL) {
                $grouped[$key]['operational_count']++;
            } elseif ($machine->status === Machine::STATUS_BREAKDOWN) {
                $grouped[$key]['breakdown_count']++;
            } elseif ($machine->status === Machine::STATUS_UNDER_MAINTENANCE) {
                $grouped[$key]['maintenance_count']++;
            }
            $grouped[$key]['machines'][] = $machine;
        }

        return response()->json([
            'success' => true,
            'data' => array_values($grouped),
            'meta' => [
                'total_types' => count($grouped),
                'total_machines' => $allMachines->count(),
            ],
        ]);
    }

    public function store(StoreMachineRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $quantity = max(1, (int) ($validated['quantity'] ?? 1));

        $imageUrl = $validated['image_url'] ?? null;
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('machines', 'public');
            $imageUrl = '/storage/' . $path;
        }

        $unitsMeta = $this->generateSequentialCodes(
            $validated['machine_code'],
            $validated['serial_number'],
            $quantity
        );

        $createdMachines = [];

        DB::transaction(function () use ($validated, $unitsMeta, $imageUrl, &$createdMachines) {
            foreach ($unitsMeta as $idx => $unit) {
                $qrHash = 'QR-' . strtoupper(Str::random(10)) . '-' . crc32($unit['machine_code'] . microtime() . $idx);

                $machine = Machine::create([
                    'machine_code' => $unit['machine_code'],
                    'name' => $validated['name'],
                    'model_number' => $validated['model_number'],
                    'serial_number' => $unit['serial_number'],
                    'vendor_id' => $validated['vendor_id'] ?? null,
                    'block_id' => $validated['block_id'] ?? null,
                    'floor_id' => $validated['floor_id'] ?? null,
                    'line_id' => $validated['line_id'] ?? null,
                    'qr_code_hash' => $qrHash,
                    'specifications' => $validated['specifications'] ?? [],
                    'image_url' => $imageUrl,
                    'status' => $validated['status'] ?? Machine::STATUS_OPERATIONAL,
                    'installed_at' => $validated['installed_at'] ?? now(),
                ]);

                $createdMachines[] = $machine->load(['vendor', 'block', 'floor', 'line']);
            }
        });

        $message = $quantity > 1
            ? "Successfully registered {$quantity} physical machine units with separate QR codes."
            : "Machine registered successfully with unique QR code.";

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $createdMachines[0],
            'machines' => $createdMachines,
            'created_count' => count($createdMachines),
        ], 201);
    }

    /**
     * Add more quantity / physical units to an existing machine type or model
     */
    public function addQuantity(Request $request): JsonResponse
    {
        $request->validate([
            'machine_id' => 'nullable|exists:machines,id',
            'model_number' => 'nullable|string',
            'quantity' => 'required|integer|min:1|max:100',
            'line_id' => 'nullable|exists:lines,id',
            'floor_id' => 'nullable|exists:floors,id',
            'block_id' => 'nullable|exists:blocks,id',
        ]);

        $quantity = (int) $request->input('quantity', 1);

        $templateMachine = null;
        if ($request->filled('machine_id')) {
            $templateMachine = Machine::find($request->machine_id);
        } elseif ($request->filled('model_number')) {
            $templateMachine = Machine::where('model_number', $request->model_number)->first();
        }

        if (!$templateMachine) {
            return response()->json([
                'success' => false,
                'message' => 'Target machine model or template not found.',
            ], 404);
        }

        $unitsMeta = $this->generateSequentialCodes(
            $templateMachine->machine_code,
            $templateMachine->serial_number,
            $quantity
        );

        $createdMachines = [];

        DB::transaction(function () use ($templateMachine, $unitsMeta, $request, &$createdMachines) {
            foreach ($unitsMeta as $idx => $unit) {
                $qrHash = 'QR-' . strtoupper(Str::random(10)) . '-' . crc32($unit['machine_code'] . microtime() . $idx);

                $machine = Machine::create([
                    'machine_code' => $unit['machine_code'],
                    'name' => $templateMachine->name,
                    'model_number' => $templateMachine->model_number,
                    'serial_number' => $unit['serial_number'],
                    'vendor_id' => $templateMachine->vendor_id,
                    'block_id' => $request->block_id ?? $templateMachine->block_id,
                    'floor_id' => $request->floor_id ?? $templateMachine->floor_id,
                    'line_id' => $request->line_id ?? $templateMachine->line_id,
                    'qr_code_hash' => $qrHash,
                    'specifications' => $templateMachine->specifications,
                    'image_url' => $templateMachine->image_url,
                    'status' => Machine::STATUS_OPERATIONAL,
                    'installed_at' => now(),
                ]);

                $createdMachines[] = $machine->load(['vendor', 'block', 'floor', 'line']);
            }
        });

        return response()->json([
            'success' => true,
            'message' => "Successfully added {$quantity} physical unit(s) to {$templateMachine->name} with separate QR codes.",
            'data' => $createdMachines[0] ?? null,
            'machines' => $createdMachines,
            'created_count' => count($createdMachines),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $machine = Machine::with([
            'vendor',
            'block',
            'floor',
            'line',
            'repairLogs' => function ($q) {
                $q->with([
                    'reporter.block',
                    'reporter.floor',
                    'reporter.line',
                    'mechanic',
                    'techLead',
                    'spareHead',
                    'line.floor.block',
                    'spareRequests.part',
                    'auditLogs.user',
                ])
                ->orderByDesc('created_at');
            }
        ])->findOrFail($id);

        $authoritiesMap = [];
        $totalDowntime = 0;
        $completedCount = 0;
        $openCount = 0;

        foreach ($machine->repairLogs as $log) {
            $totalDowntime += (int) ($log->total_downtime_minutes ?: 0);
            if (in_array($log->status, [RepairLog::STATUS_OPERATIONAL, RepairLog::STATUS_CLOSED])) {
                $completedCount++;
            } else {
                $openCount++;
            }

            // 1. Reporter
            if ($log->reporter) {
                $uid = $log->reporter->id;
                if (!isset($authoritiesMap[$uid])) {
                    $authoritiesMap[$uid] = [
                        'user' => $log->reporter,
                        'role' => $log->reporter->role,
                        'action_types' => [],
                        'interventions_count' => 0,
                        'last_activity_at' => (string) $log->created_at,
                    ];
                }
                $authoritiesMap[$uid]['action_types'][] = 'Reported Breakdown / Scheduled Service';
                $authoritiesMap[$uid]['interventions_count']++;
            }

            // 2. Mechanic
            if ($log->mechanic) {
                $uid = $log->mechanic->id;
                if (!isset($authoritiesMap[$uid])) {
                    $authoritiesMap[$uid] = [
                        'user' => $log->mechanic,
                        'role' => $log->mechanic->role,
                        'action_types' => [],
                        'interventions_count' => 0,
                        'last_activity_at' => (string) $log->updated_at,
                    ];
                }
                $authoritiesMap[$uid]['action_types'][] = 'Primary Diagnosis & Servicing';
                $authoritiesMap[$uid]['interventions_count']++;
            }

            // 3. Tech Lead
            if ($log->techLead) {
                $uid = $log->techLead->id;
                if (!isset($authoritiesMap[$uid])) {
                    $authoritiesMap[$uid] = [
                        'user' => $log->techLead,
                        'role' => $log->techLead->role,
                        'action_types' => [],
                        'interventions_count' => 0,
                        'last_activity_at' => (string) $log->updated_at,
                    ];
                }
                $authoritiesMap[$uid]['action_types'][] = 'Engineering Diagnostic Approval';
                $authoritiesMap[$uid]['interventions_count']++;
            }

            // 4. Spare Head
            if ($log->spareHead) {
                $uid = $log->spareHead->id;
                if (!isset($authoritiesMap[$uid])) {
                    $authoritiesMap[$uid] = [
                        'user' => $log->spareHead,
                        'role' => $log->spareHead->role,
                        'action_types' => [],
                        'interventions_count' => 0,
                        'last_activity_at' => (string) $log->updated_at,
                    ];
                }
                $authoritiesMap[$uid]['action_types'][] = 'Warehouse Spare Parts Dispatch';
                $authoritiesMap[$uid]['interventions_count']++;
            }
        }

        // Clean action types deduplication
        foreach ($authoritiesMap as &$auth) {
            $auth['action_types'] = array_values(array_unique($auth['action_types']));
        }

        $serviceStats = [
            'total_services_done' => $machine->repairLogs->count(),
            'completed_services' => $completedCount,
            'open_services' => $openCount,
            'total_downtime_minutes' => $totalDowntime,
            'unique_authorities_count' => count($authoritiesMap),
            'authorities_roster' => array_values($authoritiesMap),
        ];

        return response()->json([
            'success' => true,
            'data' => $machine,
            'service_stats' => $serviceStats,
        ]);
    }

    /**
     * Fast QR lookup for Line Supervisors and Mobile Scanners
     */
    public function lookupByQR(string $qrHash): JsonResponse
    {
        $machine = Machine::with([
            'vendor',
            'block',
            'floor',
            'line',
            'repairLogs' => function ($q) {
                $q->with(['reporter', 'mechanic', 'techLead', 'spareRequests.part'])
                  ->orderByDesc('created_at')
                  ->limit(5);
            }
        ])->where('qr_code_hash', $qrHash)->first();

        if (!$machine) {
            return response()->json([
                'success' => false,
                'message' => "No machinery found matching QR Hash: [{$qrHash}]",
            ], 404);
        }

        // Suggest frequent service templates based on model / specifications
        $suggestedServices = ServiceCatalog::query()
            ->when(str_contains(strtolower($machine->name), 'sew') || str_contains(strtolower($machine->name), 'stitch'), function ($q) {
                $q->where('machine_category', 'Sewing');
            })
            ->when(str_contains(strtolower($machine->name), 'press') || str_contains(strtolower($machine->name), 'click'), function ($q) {
                $q->orWhere('machine_category', 'Hydraulic Press');
            })
            ->when(str_contains(strtolower($machine->name), 'split') || str_contains(strtolower($machine->name), 'skiv'), function ($q) {
                $q->orWhere('machine_category', 'Splitting & Skiving');
            })
            ->get();

        if ($suggestedServices->isEmpty()) {
            $suggestedServices = ServiceCatalog::limit(4)->get();
        }

        return response()->json([
            'success' => true,
            'data' => [
                'machine' => $machine,
                'suggested_services' => $suggestedServices,
                'active_breakdown' => $machine->repairLogs->first(fn($log) => !in_array($log->status, [RepairLog::STATUS_OPERATIONAL, RepairLog::STATUS_CLOSED])),
            ],
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $machine = Machine::findOrFail($id);
        $code = $machine->machine_code;
        $machine->delete();

        return response()->json([
            'success' => true,
            'message' => "Machine {$code} deleted successfully.",
        ]);
    }


    /**
     * Printable QR Code label metadata
     */
    public function qrLabel(int $id): JsonResponse
    {
        $machine = Machine::with(['vendor', 'block', 'floor', 'line'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => [
                'machine_id' => $machine->id,
                'machine_code' => $machine->machine_code,
                'name' => $machine->name,
                'model_number' => $machine->model_number,
                'serial_number' => $machine->serial_number,
                'qr_code_hash' => $machine->qr_code_hash,
                'location' => [
                    'block' => $machine->block?->name,
                    'floor' => $machine->floor?->name,
                    'line' => $machine->line?->name,
                ],
                'specs_summary' => $machine->specifications,
                'vendor' => $machine->vendor?->name,
            ],
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $machine = Machine::findOrFail($id);

        $validated = $request->validate([
            'machine_code' => 'sometimes|required|string|max:50|unique:machines,machine_code,' . $id,
            'name' => 'sometimes|required|string|max:255',
            'model_number' => 'sometimes|required|string|max:100',
            'serial_number' => 'sometimes|required|string|max:100',
            'vendor_id' => 'nullable|exists:vendors,id',
            'block_id' => 'nullable|exists:blocks,id',
            'floor_id' => 'nullable|exists:floors,id',
            'line_id' => 'nullable|exists:lines,id',
            'status' => 'sometimes|required|string|in:OPERATIONAL,UNDER_MAINTENANCE,BREAKDOWN,DECOMMISSIONED',
            'specifications' => 'nullable|array',
            'image_url' => 'nullable|string',
            'installed_at' => 'nullable|date',
        ]);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('machines', 'public');
            $validated['image_url'] = '/storage/' . $path;
        }

        $machine->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Machine specifications updated successfully.',
            'data' => $machine->fresh(['vendor', 'block', 'floor', 'line']),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $machine = Machine::findOrFail($id);

        $hasOpenTickets = $machine->repairLogs()
            ->whereNotIn('status', [RepairLog::STATUS_OPERATIONAL, RepairLog::STATUS_CLOSED])
            ->exists();

        if ($hasOpenTickets) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete machine with active breakdown tickets in progress. Please close or complete open tickets first.',
            ], 422);
        }

        // Clean up repair logs associations before deleting machine
        $machine->repairLogs()->delete();
        $machine->delete();

        return response()->json([
            'success' => true,
            'message' => "Machine [{$machine->machine_code}] deleted successfully.",
        ]);
    }
}
