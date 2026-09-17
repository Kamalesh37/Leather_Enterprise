<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('role_key', 50)->unique();
            $table->string('name', 255);
            $table->string('category', 100)->default('Operations');
            $table->text('description')->nullable();
            $table->string('scope', 255)->default('Plant Wide');
            $table->string('color', 20)->default('#6366f1');
            $table->string('badge', 50)->default('Custom Role');
            $table->json('permissions')->nullable();
            $table->boolean('is_system')->default(false);
            $table->timestamps();
        });

        // Seed default 7 roles into database
        $defaultRoles = [
            [
                'role_key' => 'admin',
                'name' => 'System Administrator',
                'category' => 'Global Governance',
                'description' => 'Full administrative control over plant hierarchy, user provisioning, permissions, and system settings.',
                'scope' => 'Global Plant / Enterprise Wide',
                'color' => '#818cf8',
                'badge' => 'Enterprise HQ',
                'permissions' => json_encode([
                    'can_manage_vendors' => true,
                    'can_edit_machines' => true,
                    'can_assign_mechanics' => true,
                    'can_approve_diagnostics' => true,
                    'can_dispatch_spares' => true,
                    'can_adjust_inventory_stock' => true,
                    'can_view_analytics' => true,
                ]),
                'is_system' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'role_key' => 'block_manager',
                'name' => 'Block Manager',
                'category' => 'Facility Operations',
                'description' => 'Monitors aggregated manufacturing performance, machine availability, and downtime across the entire building block.',
                'scope' => 'Block Level Scope',
                'color' => '#38bdf8',
                'badge' => 'Building Level',
                'permissions' => json_encode([
                    'can_manage_vendors' => false,
                    'can_edit_machines' => true,
                    'can_assign_mechanics' => true,
                    'can_approve_diagnostics' => false,
                    'can_dispatch_spares' => false,
                    'can_adjust_inventory_stock' => false,
                    'can_view_analytics' => true,
                ]),
                'is_system' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'role_key' => 'floor_manager',
                'name' => 'Floor Manager',
                'category' => 'Floor Management',
                'description' => 'Supervises floor-level production lines, repair backlogs, and mechanical bottlenecks.',
                'scope' => 'Floor Level Scope',
                'color' => '#34d399',
                'badge' => 'Floor Level',
                'permissions' => json_encode([
                    'can_manage_vendors' => false,
                    'can_edit_machines' => true,
                    'can_assign_mechanics' => true,
                    'can_approve_diagnostics' => false,
                    'can_dispatch_spares' => false,
                    'can_adjust_inventory_stock' => false,
                    'can_view_analytics' => true,
                ]),
                'is_system' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'role_key' => 'line_supervisor',
                'name' => 'Line Supervisor',
                'category' => 'Line Intake & Operations',
                'description' => 'Initial QR breakdown intake, symptom logging, urgency assessment, and line mechanic triage assignment.',
                'scope' => 'Production Line Scope',
                'color' => '#fbbf24',
                'badge' => 'Line Station',
                'permissions' => json_encode([
                    'can_manage_vendors' => false,
                    'can_edit_machines' => false,
                    'can_assign_mechanics' => true,
                    'can_approve_diagnostics' => false,
                    'can_dispatch_spares' => false,
                    'can_adjust_inventory_stock' => false,
                    'can_view_analytics' => true,
                ]),
                'is_system' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'role_key' => 'mechanic',
                'name' => 'Line Maintenance Mechanic',
                'category' => 'Engineering & Repair',
                'description' => 'Performs physical machine diagnostics, submits Bill of Materials (BOM) requisitions, and executes mechanical repairs.',
                'scope' => 'Line Station & Machine Scope',
                'color' => '#fb923c',
                'badge' => 'Technical Field',
                'permissions' => json_encode([
                    'can_manage_vendors' => false,
                    'can_edit_machines' => false,
                    'can_assign_mechanics' => false,
                    'can_approve_diagnostics' => false,
                    'can_dispatch_spares' => false,
                    'can_adjust_inventory_stock' => false,
                    'can_view_analytics' => false,
                ]),
                'is_system' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'role_key' => 'tech_lead',
                'name' => 'Senior Technical Lead',
                'category' => 'Quality & Engineering Validation',
                'description' => 'Technical diagnostic validation, authorization of spare parts BOM requisitions, and final quality sign-off.',
                'scope' => 'Plant Engineering Scope',
                'color' => '#c084fc',
                'badge' => 'QA Authority',
                'permissions' => json_encode([
                    'can_manage_vendors' => false,
                    'can_edit_machines' => true,
                    'can_assign_mechanics' => true,
                    'can_approve_diagnostics' => true,
                    'can_dispatch_spares' => false,
                    'can_adjust_inventory_stock' => false,
                    'can_view_analytics' => true,
                ]),
                'is_system' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'role_key' => 'spare_head',
                'name' => 'Central Spare Parts Head',
                'category' => 'Warehouse & Inventory',
                'description' => 'Manages storage bins, executes atomic spare parts dispatches, controls restocking, and oversees inventory audit ledger.',
                'scope' => 'Central Warehouse & Storage Bins',
                'color' => '#f43f5e',
                'badge' => 'Warehouse Authority',
                'permissions' => json_encode([
                    'can_manage_vendors' => true,
                    'can_edit_machines' => false,
                    'can_assign_mechanics' => false,
                    'can_approve_diagnostics' => false,
                    'can_dispatch_spares' => true,
                    'can_adjust_inventory_stock' => true,
                    'can_view_analytics' => true,
                ]),
                'is_system' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('roles')->insert($defaultRoles);
    }

    public function down(): void
    {
        Schema::dropIfExists('roles');
    }
};
