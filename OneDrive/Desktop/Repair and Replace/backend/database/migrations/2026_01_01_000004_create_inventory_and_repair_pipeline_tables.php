<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('parts', function (Blueprint $table) {
            $table->id();
            $table->string('part_number', 50)->unique();
            $table->string('name', 100);
            $table->string('category', 50);
            $table->integer('stock_quantity')->default(0);
            $table->integer('min_threshold')->default(5);
            $table->decimal('unit_cost', 10, 2)->default(0.00);
            $table->string('location_bin', 30);
            $table->json('compatible_machine_types')->nullable();
            $table->timestamps();

            $table->index(['category', 'stock_quantity']);
        });

        Schema::create('repair_logs', function (Blueprint $table) {
            $table->id();
            $table->string('ticket_number', 50)->unique();
            $table->foreignId('machine_id')->constrained('machines')->onDelete('cascade');
            $table->foreignId('line_id')->nullable()->constrained('lines')->nullOnDelete();
            $table->foreignId('reporter_id')->constrained('users');
            $table->foreignId('mechanic_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('tech_lead_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('spare_head_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('ticket_type', 50)->default('BREAKDOWN_REPAIR');
            $table->string('priority', 20)->default('HIGH');
            $table->string('status', 50)->default('REPORTED');
            $table->text('reported_issue');
            $table->text('diagnosis_notes')->nullable();
            $table->timestamp('breakdown_start_time')->useCurrent();
            $table->timestamp('breakdown_end_time')->nullable();
            $table->integer('total_downtime_minutes')->nullable();
            $table->timestamps();

            $table->index(['status', 'priority']);
            $table->index(['line_id', 'status']);
        });

        Schema::create('repair_spare_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('repair_log_id')->constrained('repair_logs')->onDelete('cascade');
            $table->foreignId('part_id')->constrained('parts')->onDelete('restrict');
            $table->integer('requested_quantity')->default(1);
            $table->integer('approved_quantity')->nullable();
            $table->integer('dispatched_quantity')->default(0);
            $table->decimal('unit_cost_at_dispatch', 10, 2)->nullable();
            $table->string('status', 30)->default('REQUESTED');
            $table->text('tech_lead_notes')->nullable();
            $table->timestamps();

            $table->index(['repair_log_id', 'status']);
        });

        Schema::create('inventory_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('part_id')->constrained('parts')->onDelete('restrict');
            $table->foreignId('repair_log_id')->nullable()->constrained('repair_logs')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('change_type', 50);
            $table->integer('quantity_delta');
            $table->integer('balance_before');
            $table->integer('balance_after');
            $table->string('remarks')->nullable();
            $table->timestamp('timestamp')->useCurrent();

            $table->index(['part_id', 'timestamp']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_audit_logs');
        Schema::dropIfExists('repair_spare_requests');
        Schema::dropIfExists('repair_logs');
        Schema::dropIfExists('parts');
    }
};
