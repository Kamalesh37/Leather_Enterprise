<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('warehouse_storage_zones', function (Blueprint $table) {
            $table->id();
            $table->string('zone_code', 32)->unique();
            $table->string('name', 128);
            $table->string('location_type', 64)->default('RACK'); // RACK, SHELF_CABINET, HEAVY_BAY, TOOL_CAGE, PALLET_DECK
            $table->string('aisle_bay', 128)->nullable();
            $table->integer('capacity_bins')->default(20);
            $table->text('description')->nullable();
            $table->string('color', 16)->default('#3b82f6');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Seed standard enterprise warehouse zones for leather machinery & spare storage
        $defaultZones = [
            [
                'zone_code' => 'ZONE-A',
                'name' => 'Zone A (Small Fast-Moving Consumables)',
                'location_type' => 'SHELF_CABINET',
                'aisle_bay' => 'Aisle 01 / Cabinet Bays A1-A12',
                'capacity_bins' => 24,
                'description' => 'High-density multi-drawer cabinet for sewing needles, diamond points, hooks, and tension springs.',
                'color' => '#818cf8',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'zone_code' => 'ZONE-B',
                'name' => 'Zone B (Heavy Hydraulics & Power Units)',
                'location_type' => 'HEAVY_BAY',
                'aisle_bay' => 'Aisle 02 / Heavy Racks B1-B8',
                'capacity_bins' => 16,
                'description' => 'Reinforced floor racks for hydraulic valves, cylinders, manifold blocks, and high-pressure hoses.',
                'color' => '#38bdf8',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'zone_code' => 'ZONE-C',
                'name' => 'Zone C (Tooling, Knives & Band Blades)',
                'location_type' => 'TOOL_CAGE',
                'aisle_bay' => 'Aisle 03 / Tooling Cage C1-C6',
                'capacity_bins' => 12,
                'description' => 'Climate-controlled secure cage for splitting bandknives, rotary skiving bells, and punching dies.',
                'color' => '#f43f5e',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'zone_code' => 'ZONE-D',
                'name' => 'Zone D (Belts & Power Transmission)',
                'location_type' => 'RACK',
                'aisle_bay' => 'Aisle 04 / Belt Hanger Bays D1-D10',
                'capacity_bins' => 20,
                'description' => 'Overhead hanger bays for polyurethane timing belts, V-belts, and drive pulleys.',
                'color' => '#fbbf24',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'zone_code' => 'ZONE-E',
                'name' => 'Zone E (Automation, Motors & Sensors)',
                'location_type' => 'SHELF_CABINET',
                'aisle_bay' => 'Aisle 05 / ESD Shielded Bay E1-E10',
                'capacity_bins' => 20,
                'description' => 'Anti-static ESD storage for servo motors, PLCs, proximity switches, and optical encoders.',
                'color' => '#a855f7',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'zone_code' => 'ZONE-F',
                'name' => 'Zone F (Thermal & Heating Assemblies)',
                'location_type' => 'RACK',
                'aisle_bay' => 'Aisle 06 / Heat Storage Bay F1-F6',
                'capacity_bins' => 12,
                'description' => 'Insulated bin compartments for stamping heating cartridges, heating plates, and thermocouple probes.',
                'color' => '#fb923c',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'zone_code' => 'ZONE-G',
                'name' => 'Zone G (Feed Rollers & Conveyor Tracks)',
                'location_type' => 'PALLET_DECK',
                'aisle_bay' => 'Aisle 07 / Pallet Deck G1-G8',
                'capacity_bins' => 16,
                'description' => 'Heavy-duty deck shelving for rubberized feed rollers, knurled shafts, and guide assemblies.',
                'color' => '#34d399',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'zone_code' => 'ZONE-H',
                'name' => 'Zone H (Hardened Wear Plates & Anvils)',
                'location_type' => 'PALLET_DECK',
                'aisle_bay' => 'Aisle 08 / Lower Deck H1-H8',
                'capacity_bins' => 16,
                'description' => 'Lower steel pallet decks for clicking press throat plates, cutting pads, and anvil blocks.',
                'color' => '#06b6d4',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('warehouse_storage_zones')->insert($defaultZones);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('warehouse_storage_zones');
    }
};
