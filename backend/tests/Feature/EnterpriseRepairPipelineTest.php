<?php

namespace Tests\Feature;

use App\Models\Machine;
use App\Models\Part;
use App\Models\RepairLog;
use App\Models\RepairSpareRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EnterpriseRepairPipelineTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_health_check_returns_up(): void
    {
        $response = $this->getJson('/api/health');
        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'UP');
    }

    public function test_auth_login_with_valid_credentials(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'admin@leathermfg.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'user' => ['id', 'name', 'email', 'role', 'permission'],
                    'token',
                ],
            ]);
    }

    public function test_admin_can_provision_crew_with_permission_matrix(): void
    {
        $admin = User::where('role', User::ROLE_ADMIN)->first();
        $token = $admin->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/crew', [
                'name' => 'Sara Connor',
                'email' => 'sara@leathermfg.com',
                'password' => 'securepass123',
                'role' => 'line_supervisor',
                'block_id' => 1,
                'floor_id' => 1,
                'line_id' => 1,
                'phone' => '+1 555 4321',
                'permissions' => [
                    'can_manage_vendors' => false,
                    'can_edit_machines' => true,
                    'can_assign_mechanics' => true,
                    'can_approve_diagnostics' => false,
                    'can_dispatch_spares' => false,
                    'can_adjust_inventory_stock' => false,
                    'can_view_analytics' => true,
                ],
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.email', 'sara@leathermfg.com')
            ->assertJsonPath('data.permission.can_edit_machines', true)
            ->assertJsonPath('data.permission.can_assign_mechanics', true);

        $this->assertDatabaseHas('users', ['email' => 'sara@leathermfg.com']);
        $this->assertDatabaseHas('user_permissions', ['can_edit_machines' => 1]);
    }

    public function test_qr_code_machine_lookup(): void
    {
        $machine = Machine::first();

        $response = $this->getJson("/api/machines/qr/{$machine->qr_code_hash}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.machine.machine_code', $machine->machine_code)
            ->assertJsonStructure([
                'data' => [
                    'machine' => ['id', 'name', 'model_number', 'specifications', 'vendor'],
                    'suggested_services',
                ],
            ]);
    }

    public function test_complete_end_to_end_repair_pipeline_and_atomic_dispatch(): void
    {
        $machine = Machine::where('status', Machine::STATUS_OPERATIONAL)->first();
        $supervisor = User::where('role', User::ROLE_LINE_SUPERVISOR)->first();
        $mechanic = User::where('role', User::ROLE_MECHANIC)->first();
        $techLead = User::where('role', User::ROLE_TECH_LEAD)->first();
        $spareHead = User::where('role', User::ROLE_SPARE_HEAD)->first();
        $part = Part::first();

        $initialStock = $part->stock_quantity;
        $this->assertGreaterThan(5, $initialStock);

        // 1. Line Supervisor creates breakdown ticket via QR Scan
        $supToken = $supervisor->createToken('sup')->plainTextToken;
        $createRes = $this->withHeader('Authorization', "Bearer {$supToken}")
            ->postJson('/api/tickets', [
                'qr_code_hash' => $machine->qr_code_hash,
                'ticket_type' => 'BREAKDOWN_REPAIR',
                'priority' => 'HIGH',
                'reported_issue' => 'Motor thermal cutoff tripped during heavy leather embossing run.',
                'mechanic_id' => $mechanic->id,
            ]);

        $createRes->assertStatus(201);
        $ticketId = $createRes->json('data.id');

        // Machine status should transition to BREAKDOWN
        $this->assertEquals(Machine::STATUS_BREAKDOWN, $machine->fresh()->status);

        // 2. Mechanic diagnoses machine and requests 2 replacement parts (BOM)
        $mechToken = $mechanic->createToken('mech')->plainTextToken;
        $diagRes = $this->withHeader('Authorization', "Bearer {$mechToken}")
            ->postJson("/api/tickets/{$ticketId}/diagnosis", [
                'diagnosis_notes' => 'Confirmed servo drive coil burnout and thermal sensor damage.',
                'spare_parts' => [
                    [
                        'part_id' => $part->id,
                        'quantity' => 2,
                    ],
                ],
            ]);

        $diagRes->assertStatus(200)
            ->assertJsonPath('data.status', RepairLog::STATUS_PENDING_TECH_APPROVAL);

        $spareReq = RepairSpareRequest::where('repair_log_id', $ticketId)->first();
        $this->assertNotNull($spareReq);
        $this->assertEquals(2, $spareReq->requested_quantity);

        // 3. Tech Lead reviews and approves requested parts
        $techToken = $techLead->createToken('tech')->plainTextToken;
        $approveRes = $this->withHeader('Authorization', "Bearer {$techToken}")
            ->postJson("/api/approvals/spares/{$ticketId}/approve", [
                'tech_lead_notes' => 'Approved 2 units. Verified part compatibility against machinery specs.',
                'parts_approval' => [
                    [
                        'request_id' => $spareReq->id,
                        'approved_quantity' => 2,
                        'status' => 'APPROVED',
                        'notes' => 'Matches voltage requirements.',
                    ],
                ],
            ]);

        $approveRes->assertStatus(200)
            ->assertJsonPath('data.status', RepairLog::STATUS_PENDING_SPARE_DISPATCH);

        // 4. Spare Head fulfills approved parts -> Atomic Deduction with lockForUpdate & Audit Logging
        $spareToken = $spareHead->createToken('spare')->plainTextToken;
        $dispatchRes = $this->withHeader('Authorization', "Bearer {$spareToken}")
            ->postJson("/api/dispatches/spares/{$ticketId}/dispatch", [
                'remarks' => 'Dispatched from central warehouse bin.',
            ]);

        $dispatchRes->assertStatus(200)
            ->assertJsonPath('success', true);

        // Verify stock decremented atomically by exactly 2
        $this->assertEquals($initialStock - 2, $part->fresh()->stock_quantity);

        // Verify immutable audit log recorded
        $this->assertDatabaseHas('inventory_audit_logs', [
            'part_id' => $part->id,
            'repair_log_id' => $ticketId,
            'change_type' => 'DISPATCH',
            'quantity_delta' => -2,
            'balance_after' => $initialStock - 2,
        ]);

        // Ticket transitioned to IN_REPAIR
        $this->assertEquals(RepairLog::STATUS_IN_REPAIR, RepairLog::find($ticketId)->status);

        // 5. Mechanic completes repair work
        $completeRes = $this->withHeader('Authorization', "Bearer {$mechToken}")
            ->patchJson("/api/tickets/{$ticketId}/complete");

        $completeRes->assertStatus(200)
            ->assertJsonPath('data.status', RepairLog::STATUS_PENDING_SIGN_OFF);

        // 6. Tech Lead performs final verification and sign-off
        $signOffRes = $this->withHeader('Authorization', "Bearer {$techToken}")
            ->patchJson("/api/tickets/{$ticketId}/sign-off");

        $signOffRes->assertStatus(200)
            ->assertJsonPath('data.status', RepairLog::STATUS_OPERATIONAL);

        // Verify machine restored to OPERATIONAL and total downtime computed
        $updatedMachine = $machine->fresh();
        $this->assertEquals(Machine::STATUS_OPERATIONAL, $updatedMachine->status);
        $this->assertNotNull(RepairLog::find($ticketId)->total_downtime_minutes);
    }

    public function test_work_report_templates_for_roles(): void
    {
        $mechanic = User::where('role', User::ROLE_MECHANIC)->first();
        $token = $mechanic->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/work-reports/templates');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'title',
                    'shift',
                    'report_type',
                    'tasks_completed',
                    'metrics' => [
                        'repairs_completed',
                        'machines_serviced',
                        'active_backlog',
                        'avg_repair_time_min',
                    ],
                ],
            ]);
    }
}

