<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('blocks', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('floors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('block_id')->constrained('blocks')->onDelete('cascade');
            $table->string('name');
            $table->integer('floor_number')->default(1);
            $table->timestamps();
        });

        Schema::create('lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('floor_id')->constrained('floors')->onDelete('cascade');
            $table->string('name');
            $table->string('line_code')->unique();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lines');
        Schema::dropIfExists('floors');
        Schema::dropIfExists('blocks');
    }
};
