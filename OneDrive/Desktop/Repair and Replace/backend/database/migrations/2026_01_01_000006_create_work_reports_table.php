<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('work_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('manager_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('report_type')->default('daily_work_done'); // daily_work_done, shift_handover, incident_escalation, maintenance_summary, line_performance, floor_operations
            $table->string('title');
            $table->string('shift')->default('morning'); // morning, evening, night, general
            $table->text('summary');
            $table->json('tasks_completed')->nullable(); // [{"title": "Replaced hydraulic seal", "status": "completed", "details": "..."}]
            $table->json('metrics')->nullable(); // {"repairs_completed": 3, "line_availability": 98.5}
            $table->text('blockers_and_delays')->nullable();
            $table->text('recommendations')->nullable();
            $table->string('status')->default('submitted'); // submitted, reviewed, acknowledged
            $table->text('acknowledgement_notes')->nullable();
            $table->timestamp('acknowledged_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['manager_id', 'status']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('work_reports');
    }
};
