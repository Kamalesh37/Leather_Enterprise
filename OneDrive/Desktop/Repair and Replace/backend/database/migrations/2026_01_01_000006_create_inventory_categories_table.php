<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_categories', function (Blueprint $table) {
            $table->id();
            $table->string('category_code', 50)->unique();
            $table->string('name', 255);
            $table->text('description')->nullable();
            $table->string('storage_zone', 100)->default('Zone A (General Storage)');
            $table->string('color', 20)->default('#818cf8');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Seed standard enterprise leather manufacturing inventory categories
        $categories = [
            [
                'category_code' => 'CAT-NEEDLE',
                'name' => 'Needles & Hooks',
                'description' => 'Precision sewing needles, diamond points, rotary hooks, and thread tension bobbins.',
                'storage_zone' => 'Zone A - Small Parts Cabinet (Bin A1-A12)',
                'color' => '#818cf8',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'category_code' => 'CAT-HYD',
                'name' => 'Hydraulic Valves',
                'description' => 'Proportional directional valves, pressure relief valves, hydraulic seal kits, and high-pressure hoses.',
                'storage_zone' => 'Zone B - Heavy Hydraulics Bay (Bin B1-B8)',
                'color' => '#38bdf8',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'category_code' => 'CAT-BLADE',
                'name' => 'Blades & Knives',
                'description' => 'Continuous bandknife splitting blades, skiving bell knives, and CNC rotary punching dies.',
                'storage_zone' => 'Zone C - Tooling & Edge Storage (Bin C1-C6)',
                'color' => '#f43f5e',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'category_code' => 'CAT-BELT',
                'name' => 'Drive Belts',
                'description' => 'Heavy-duty synchronous timing belts, V-belts, and conveyor polyurethane drive bands.',
                'storage_zone' => 'Zone D - Power Transmission (Bin D1-D10)',
                'color' => '#fbbf24',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'category_code' => 'CAT-MOTOR',
                'name' => 'Motors & Sensors',
                'description' => 'Direct-drive AC servo motors, encoder sensors, optical proximity detectors, and emergency stops.',
                'storage_zone' => 'Zone E - Electrical & Automation (Bin E1-E10)',
                'color' => '#a855f7',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'category_code' => 'CAT-HEAT',
                'name' => 'Heating Elements',
                'description' => 'Cartridge heaters, thermostatic heating plates for hot stamping presses, and thermocouple probes.',
                'storage_zone' => 'Zone F - Thermal Components (Bin F1-F6)',
                'color' => '#fb923c',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'category_code' => 'CAT-ROLLER',
                'name' => 'Rollers & Guides',
                'description' => 'Polyurethane feed rollers, serrated guide wheels, and ball-bearing track glides.',
                'storage_zone' => 'Zone G - Feed Mechanisms (Bin G1-G8)',
                'color' => '#34d399',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'category_code' => 'CAT-WEAR',
                'name' => 'Wear Plates',
                'description' => 'Hardened steel throat plates, Teflon presser foot covers, and sacrificial clicking cutting pads.',
                'storage_zone' => 'Zone H - Wear Plates & Beds (Bin H1-H8)',
                'color' => '#06b6d4',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('inventory_categories')->insert($categories);
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_categories');
    }
};
