<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendors', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('contact_name')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('tax_id')->nullable();
            $table->text('address')->nullable();
            $table->json('machinery_categories')->nullable();
            $table->decimal('rating', 3, 2)->default(4.50);
            $table->timestamps();
        });

        Schema::create('machines', function (Blueprint $table) {
            $table->id();
            $table->string('machine_code')->unique();
            $table->string('name');
            $table->string('model_number');
            $table->string('serial_number')->unique();
            $table->foreignId('vendor_id')->nullable()->constrained('vendors')->nullOnDelete();
            $table->foreignId('block_id')->nullable()->constrained('blocks')->nullOnDelete();
            $table->foreignId('floor_id')->nullable()->constrained('floors')->nullOnDelete();
            $table->foreignId('line_id')->nullable()->constrained('lines')->nullOnDelete();
            $table->string('qr_code_hash', 64)->unique();
            $table->json('specifications')->nullable();
            $table->string('image_url')->nullable();
            $table->string('status')->default('OPERATIONAL');
            $table->timestamp('installed_at')->nullable();
            $table->timestamps();

            $table->index(['line_id', 'status']);
            $table->index('qr_code_hash');
        });

        Schema::create('service_catalog', function (Blueprint $table) {
            $table->id();
            $table->string('machine_category');
            $table->string('title');
            $table->text('description')->nullable();
            $table->integer('estimated_duration_minutes')->default(60);
            $table->integer('recommended_frequency_days')->default(30);
            $table->json('standard_procedures')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_catalog');
        Schema::dropIfExists('machines');
        Schema::dropIfExists('vendors');
    }
};
