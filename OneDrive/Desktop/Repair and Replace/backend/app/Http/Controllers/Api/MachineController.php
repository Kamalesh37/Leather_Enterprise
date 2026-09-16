<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMachineRequest;
use App\Models\Machine;
use App\Models\RepairLog;
use App\Models\ServiceCatalog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class MachineController extends Controller
{
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
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('machine_code', 'like', "%{$search}%")
                  ->orWhere('model_number', 'like', "%{$search}%")
                  ->orWhere('serial_number', 'like', "%{$search}%")
                  ->orWhere('qr_code_hash', 'like', "%{$search}%");
            });
        }

        $machines = $query->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => $machines,
        ]);
    }

    public function store(StoreMachineRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $qrHash = 'QR-' . strtoupper(Str::random(10)) . '-' . crc32($validated['machine_code'] . microtime());

        $imageUrl = $validated['image_url'] ?? null;
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('machines', 'public');
            $imageUrl = '/storage/' . $path;
        }

        $machine = Machine::create([
            'machine_code' => $validated['machine_code'],
            'name' => $validated['name'],
            'model_number' => $validated['model_number'],
            'serial_number' => $validated['serial_number'],
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

        return response()->json([
            'success' => true,
            'message' => 'Machine registered successfully with unique QR code.',
            'data' => $machine->load(['vendor', 'block', 'floor', 'line']),
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
                $q->with(['reporter', 'mechanic', 'techLead', 'spareRequests.part'])
                  ->orderByDesc('created_at')
                  ->limit(10);
            }
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $machine,
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
