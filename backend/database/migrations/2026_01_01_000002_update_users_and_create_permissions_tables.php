<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('line_supervisor')->after('email');
            $table->foreignId('block_id')->nullable()->after('role')->constrained('blocks')->nullOnDelete();
            $table->foreignId('floor_id')->nullable()->after('block_id')->constrained('floors')->nullOnDelete();
            $table->foreignId('line_id')->nullable()->after('floor_id')->constrained('lines')->nullOnDelete();
            $table->string('phone')->nullable()->after('line_id');
            $table->string('status')->default('active')->after('phone');
        });

        Schema::create('user_permissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->boolean('can_manage_vendors')->default(false);
            $table->boolean('can_edit_machines')->default(false);
            $table->boolean('can_assign_mechanics')->default(false);
            $table->boolean('can_approve_diagnostics')->default(false);
            $table->boolean('can_dispatch_spares')->default(false);
            $table->boolean('can_adjust_inventory_stock')->default(false);
            $table->boolean('can_view_analytics')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_permissions');

        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['block_id']);
            $table->dropForeign(['floor_id']);
            $table->dropForeign(['line_id']);
            $table->dropColumn(['role', 'block_id', 'floor_id', 'line_id', 'phone', 'status']);
        });
    }
};
