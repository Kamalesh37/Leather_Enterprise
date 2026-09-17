<?php

namespace App\Services;

use App\Models\Machine;
use App\Models\RepairLog;
use App\Models\ServiceCatalog;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductService
{
    public function __construct(
        protected QRService $qrService
    ) {}

    public function registerMachine(array $data): array
    {
        return DB::transaction(function () use ($data) {
            $qrHash = $data['qr_code_hash'] ?? $this->qrService->generateDeterministicHash(
                $data['serial_number'],
                $data['model_number'] ?? $data['model_name'] ?? 'DEFAULT'
            );

            // Check if machine already exists
            $existing = Machine::where('serial_number', $data['serial_number'])
                ->orWhere('qr_code_hash', $qrHash)
                ->first();

            if ($existing) {
                $machine = $existing;
            } else {
                $machine = Machine::create([
                    'machine_code' => $data['machine_code'] ?? ('MAC-' . strtoupper(Str::random(6))),
                    'name' => $data['name'],
                    'model_number' => $data['model_number'] ?? $data['model_name'] ?? 'DEFAULT',
                    'serial_number' => $data['serial_number'],
                    'vendor_id' => $data['vendor_id'] ?? null,
                    'block_id' => $data['block_id'] ?? null,
                    'floor_id' => $data['floor_id'] ?? null,
                    'line_id' => $data['line_id'] ?? null,
                    'qr_code_hash' => $qrHash,
                    'specifications' => $data['specifications'] ?? [],
                    'status' => Machine::STATUS_OPERATIONAL,
                    'installed_at' => now(),
                ]);
            }

            return [
                'machine' => $machine->load(['vendor', 'block', 'floor', 'line']),
                'qr_tracking' => [
                    'hash' => $qrHash,
                    'qr_data_payload' => $qrHash,
                ],
            ];
        });
    }

    public function lookupByQR(string $qrHash): array
    {
        $machine = Machine::where('qr_code_hash', $qrHash)
            ->with(['vendor', 'block', 'floor', 'line'])
            ->first();

        if (!$machine) {
            throw new \Exception('Machine not found for the provided QR code.', 404);
        }

        $activeBreakdown = RepairLog::with(['mechanic', 'spareRequests.part'])
            ->where('machine_id', $machine->id)
            ->whereNotIn('status', [RepairLog::STATUS_OPERATIONAL, RepairLog::STATUS_CLOSED])
            ->latest()
            ->first();

        $suggestedServices = ServiceCatalog::all();

        return [
            'machine' => $machine,
            'active_breakdown' => $activeBreakdown,
            'suggested_services' => $suggestedServices,
        ];
    }
}
