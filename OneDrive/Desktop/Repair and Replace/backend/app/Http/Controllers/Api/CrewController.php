<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCrewRequest;
use App\Http\Requests\UpdateCrewPermissionsRequest;
use App\Models\RepairLog;
use App\Models\User;
use App\Models\UserPermission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class CrewController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::with(['permission', 'block', 'floor', 'line']);

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        if ($request->filled('block_id')) {
            $query->where('block_id', $request->block_id);
        }

        if ($request->filled('floor_id')) {
            $query->where('floor_id', $request->floor_id);
        }

        if ($request->filled('line_id')) {
            $query->where('line_id', $request->line_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $crew = $query->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => $crew,
        ]);
    }

    public function store(StoreCrewRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $user = DB::transaction(function () use ($validated) {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => $validated['role'],
                'block_id' => $validated['block_id'] ?? null,
                'floor_id' => $validated['floor_id'] ?? null,
                'line_id' => $validated['line_id'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'status' => $validated['status'] ?? 'active',
            ]);

            $permissionsData = $validated['permissions'] ?? [];

            // Set default permission flags based on role if not provided explicitly
            $defaults = $this->getDefaultPermissionsForRole($validated['role']);
            $mergedPermissions = array_merge($defaults, $permissionsData);

            UserPermission::create([
                'user_id' => $user->id,
                'can_manage_vendors' => (bool) ($mergedPermissions['can_manage_vendors'] ?? false),
                'can_edit_machines' => (bool) ($mergedPermissions['can_edit_machines'] ?? false),
                'can_assign_mechanics' => (bool) ($mergedPermissions['can_assign_mechanics'] ?? false),
                'can_approve_diagnostics' => (bool) ($mergedPermissions['can_approve_diagnostics'] ?? false),
                'can_dispatch_spares' => (bool) ($mergedPermissions['can_dispatch_spares'] ?? false),
                'can_adjust_inventory_stock' => (bool) ($mergedPermissions['can_adjust_inventory_stock'] ?? false),
                'can_view_analytics' => (bool) ($mergedPermissions['can_view_analytics'] ?? false),
            ]);

            return $user->load(['permission', 'block', 'floor', 'line']);
        });

        return response()->json([
            'success' => true,
            'message' => 'Crew member provisioned successfully.',
            'data' => $user,
        ], 201);
    }

    public function update(UpdateCrewPermissionsRequest $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $validated = $request->validated();

        DB::transaction(function () use ($user, $validated) {
            $user->update(array_filter([
                'role' => $validated['role'] ?? $user->role,
                'block_id' => array_key_exists('block_id', $validated) ? $validated['block_id'] : $user->block_id,
                'floor_id' => array_key_exists('floor_id', $validated) ? $validated['floor_id'] : $user->floor_id,
                'line_id' => array_key_exists('line_id', $validated) ? $validated['line_id'] : $user->line_id,
                'phone' => array_key_exists('phone', $validated) ? $validated['phone'] : $user->phone,
                'status' => $validated['status'] ?? $user->status,
            ], fn($val) => $val !== null));

            if (isset($validated['permissions'])) {
                UserPermission::updateOrCreate(
                    ['user_id' => $user->id],
                    [
                        'can_manage_vendors' => (bool) ($validated['permissions']['can_manage_vendors'] ?? false),
                        'can_edit_machines' => (bool) ($validated['permissions']['can_edit_machines'] ?? false),
                        'can_assign_mechanics' => (bool) ($validated['permissions']['can_assign_mechanics'] ?? false),
                        'can_approve_diagnostics' => (bool) ($validated['permissions']['can_approve_diagnostics'] ?? false),
                        'can_dispatch_spares' => (bool) ($validated['permissions']['can_dispatch_spares'] ?? false),
                        'can_adjust_inventory_stock' => (bool) ($validated['permissions']['can_adjust_inventory_stock'] ?? false),
                        'can_view_analytics' => (bool) ($validated['permissions']['can_view_analytics'] ?? false),
                    ]
                );
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Crew member updated successfully.',
            'data' => $user->fresh(['permission', 'block', 'floor', 'line']),
        ]);
    }

    public function mechanics(): JsonResponse
    {
        $mechanics = User::where('role', 'mechanic')
            ->where('status', 'active')
            ->with(['block', 'floor', 'line'])
            ->withCount(['assignedRepairs as active_repairs_count' => function ($query) {
                $query->whereIn('status', [
                    RepairLog::STATUS_REPORTED,
                    RepairLog::STATUS_DIAGNOSING,
                    RepairLog::STATUS_PENDING_TECH_APPROVAL,
                    RepairLog::STATUS_PENDING_SPARE_DISPATCH,
                    RepairLog::STATUS_IN_REPAIR,
                    RepairLog::STATUS_PENDING_SIGN_OFF,
                ]);
            }])
            ->get();

        return response()->json([
            'success' => true,
            'data' => $mechanics,
        ]);
    }

    private function getDefaultPermissionsForRole(string $role): array
    {
        return match ($role) {
            'admin' => [
                'can_manage_vendors' => true,
                'can_edit_machines' => true,
                'can_assign_mechanics' => true,
                'can_approve_diagnostics' => true,
                'can_dispatch_spares' => true,
                'can_adjust_inventory_stock' => true,
                'can_view_analytics' => true,
            ],
            'block_manager', 'floor_manager' => [
                'can_manage_vendors' => false,
                'can_edit_machines' => true,
                'can_assign_mechanics' => true,
                'can_approve_diagnostics' => false,
                'can_dispatch_spares' => false,
                'can_adjust_inventory_stock' => false,
                'can_view_analytics' => true,
            ],
            'line_supervisor' => [
                'can_manage_vendors' => false,
                'can_edit_machines' => false,
                'can_assign_mechanics' => true,
                'can_approve_diagnostics' => false,
                'can_dispatch_spares' => false,
                'can_adjust_inventory_stock' => false,
                'can_view_analytics' => true,
            ],
            'tech_lead' => [
                'can_manage_vendors' => false,
                'can_edit_machines' => true,
                'can_assign_mechanics' => true,
                'can_approve_diagnostics' => true,
                'can_dispatch_spares' => false,
                'can_adjust_inventory_stock' => false,
                'can_view_analytics' => true,
            ],
            'spare_head' => [
                'can_manage_vendors' => true,
                'can_edit_machines' => false,
                'can_assign_mechanics' => false,
                'can_approve_diagnostics' => false,
                'can_dispatch_spares' => true,
                'can_adjust_inventory_stock' => true,
                'can_view_analytics' => true,
            ],
            'mechanic' => [
                'can_manage_vendors' => false,
                'can_edit_machines' => false,
                'can_assign_mechanics' => false,
                'can_approve_diagnostics' => false,
                'can_dispatch_spares' => false,
                'can_adjust_inventory_stock' => false,
                'can_view_analytics' => false,
            ],
            default => [],
        };
    }
}
