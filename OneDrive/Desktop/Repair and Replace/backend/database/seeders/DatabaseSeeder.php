<?php

namespace Database\Seeders;

use App\Models\Block;
use App\Models\Floor;
use App\Models\InventoryAuditLog;
use App\Models\Line;
use App\Models\Machine;
use App\Models\Part;
use App\Models\RepairLog;
use App\Models\RepairSpareRequest;
use App\Models\ServiceCatalog;
use App\Models\User;
use App\Models\UserPermission;
use App\Models\Vendor;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed Hierarchy (Block -> Floor -> Line)
        $blockA = Block::create([
            'name' => 'Alpha Leather Tannery & Complex',
            'code' => 'BLK-ALPHA',
            'description' => 'Main manufacturing and leather fabrication complex housing cutting, skiving, stitching, and finishing units.',
        ]);

        $floor1 = Floor::create([
            'block_id' => $blockA->id,
            'name' => 'Level 1: Cutting, Skiving & Stamping',
            'floor_number' => 1,
        ]);

        $floor2 = Floor::create([
            'block_id' => $blockA->id,
            'name' => 'Level 2: High-Precision Stitching & Assembly',
            'floor_number' => 2,
        ]);

        $line1 = Line::create([
            'floor_id' => $floor1->id,
            'name' => 'Shoe Upper Cutting Line 01',
            'line_code' => 'LINE-CUT-01',
        ]);

        $line2 = Line::create([
            'floor_id' => $floor1->id,
            'name' => 'Luxury Handbag Preparation Line 02',
            'line_code' => 'LINE-BAG-02',
        ]);

        $line3 = Line::create([
            'floor_id' => $floor2->id,
            'name' => 'Belt & Heavy Strap Stitching Line 03',
            'line_code' => 'LINE-STITCH-03',
        ]);

        $line4 = Line::create([
            'floor_id' => $floor2->id,
            'name' => 'Automotive Leather Upholstery Line 04',
            'line_code' => 'LINE-AUTO-04',
        ]);

        // 2. Seed Users across all 7 Roles
        $usersData = [
            [
                'name' => 'Arthur Vance',
                'email' => 'admin@leathermfg.com',
                'role' => User::ROLE_ADMIN,
                'block_id' => null,
                'floor_id' => null,
                'line_id' => null,
                'phone' => '+1 (555) 019-2831',
                'permissions' => [
                    'can_manage_vendors' => true,
                    'can_edit_machines' => true,
                    'can_assign_mechanics' => true,
                    'can_approve_diagnostics' => true,
                    'can_dispatch_spares' => true,
                    'can_adjust_inventory_stock' => true,
                    'can_view_analytics' => true,
                ],
            ],
            [
                'name' => 'Dominic Sterling',
                'email' => 'blockmgr@leathermfg.com',
                'role' => User::ROLE_BLOCK_MANAGER,
                'block_id' => $blockA->id,
                'floor_id' => null,
                'line_id' => null,
                'phone' => '+1 (555) 014-9982',
                'permissions' => [
                    'can_manage_vendors' => false,
                    'can_edit_machines' => true,
                    'can_assign_mechanics' => true,
                    'can_approve_diagnostics' => false,
                    'can_dispatch_spares' => false,
                    'can_adjust_inventory_stock' => false,
                    'can_view_analytics' => true,
                ],
            ],
            [
                'name' => 'Evelyn Hayes',
                'email' => 'floormgr@leathermfg.com',
                'role' => User::ROLE_FLOOR_MANAGER,
                'block_id' => $blockA->id,
                'floor_id' => $floor1->id,
                'line_id' => null,
                'phone' => '+1 (555) 012-7711',
                'permissions' => [
                    'can_manage_vendors' => false,
                    'can_edit_machines' => true,
                    'can_assign_mechanics' => true,
                    'can_approve_diagnostics' => false,
                    'can_dispatch_spares' => false,
                    'can_adjust_inventory_stock' => false,
                    'can_view_analytics' => true,
                ],
            ],
            [
                'name' => 'Carlos Mendez',
                'email' => 'supervisor@leathermfg.com',
                'role' => User::ROLE_LINE_SUPERVISOR,
                'block_id' => $blockA->id,
                'floor_id' => $floor1->id,
                'line_id' => $line1->id,
                'phone' => '+1 (555) 018-3342',
                'permissions' => [
                    'can_manage_vendors' => false,
                    'can_edit_machines' => false,
                    'can_assign_mechanics' => true,
                    'can_approve_diagnostics' => false,
                    'can_dispatch_spares' => false,
                    'can_adjust_inventory_stock' => false,
                    'can_view_analytics' => true,
                ],
            ],
            [
                'name' => 'Mateo Rodriguez',
                'email' => 'mechanic@leathermfg.com',
                'role' => User::ROLE_MECHANIC,
                'block_id' => $blockA->id,
                'floor_id' => $floor1->id,
                'line_id' => $line1->id,
                'phone' => '+1 (555) 017-8890',
                'permissions' => [
                    'can_manage_vendors' => false,
                    'can_edit_machines' => false,
                    'can_assign_mechanics' => false,
                    'can_approve_diagnostics' => false,
                    'can_dispatch_spares' => false,
                    'can_adjust_inventory_stock' => false,
                    'can_view_analytics' => false,
                ],
            ],
            [
                'name' => 'Dr. Henrik Lindqvist',
                'email' => 'techlead@leathermfg.com',
                'role' => User::ROLE_TECH_LEAD,
                'block_id' => $blockA->id,
                'floor_id' => null,
                'line_id' => null,
                'phone' => '+1 (555) 015-4421',
                'permissions' => [
                    'can_manage_vendors' => false,
                    'can_edit_machines' => true,
                    'can_assign_mechanics' => true,
                    'can_approve_diagnostics' => true,
                    'can_dispatch_spares' => false,
                    'can_adjust_inventory_stock' => false,
                    'can_view_analytics' => true,
                ],
            ],
            [
                'name' => 'Garrick Thorne',
                'email' => 'sparehead@leathermfg.com',
                'role' => User::ROLE_SPARE_HEAD,
                'block_id' => $blockA->id,
                'floor_id' => null,
                'line_id' => null,
                'phone' => '+1 (555) 016-5599',
                'permissions' => [
                    'can_manage_vendors' => true,
                    'can_edit_machines' => false,
                    'can_assign_mechanics' => false,
                    'can_approve_diagnostics' => false,
                    'can_dispatch_spares' => true,
                    'can_adjust_inventory_stock' => true,
                    'can_view_analytics' => true,
                ],
            ],
        ];

        $createdUsers = [];
        foreach ($usersData as $uData) {
            $user = User::create([
                'name' => $uData['name'],
                'email' => $uData['email'],
                'password' => Hash::make('password123'),
                'role' => $uData['role'],
                'block_id' => $uData['block_id'],
                'floor_id' => $uData['floor_id'],
                'line_id' => $uData['line_id'],
                'phone' => $uData['phone'],
                'status' => 'active',
            ]);

            UserPermission::create([
                'user_id' => $user->id,
                'can_manage_vendors' => $uData['permissions']['can_manage_vendors'],
                'can_edit_machines' => $uData['permissions']['can_edit_machines'],
                'can_assign_mechanics' => $uData['permissions']['can_assign_mechanics'],
                'can_approve_diagnostics' => $uData['permissions']['can_approve_diagnostics'],
                'can_dispatch_spares' => $uData['permissions']['can_dispatch_spares'],
                'can_adjust_inventory_stock' => $uData['permissions']['can_adjust_inventory_stock'],
                'can_view_analytics' => $uData['permissions']['can_view_analytics'],
            ]);

            $createdUsers[$uData['role']] = $user;
        }

        // Additional mechanic for assignment tests
        $mechanic2 = User::create([
            'name' => 'Julian Brandt',
            'email' => 'mechanic2@leathermfg.com',
            'password' => Hash::make('password123'),
            'role' => User::ROLE_MECHANIC,
            'block_id' => $blockA->id,
            'floor_id' => $floor2->id,
            'line_id' => $line3->id,
            'phone' => '+1 (555) 019-1122',
            'status' => 'active',
        ]);
        UserPermission::create([
            'user_id' => $mechanic2->id,
            'can_manage_vendors' => false,
            'can_edit_machines' => false,
            'can_assign_mechanics' => false,
            'can_approve_diagnostics' => false,
            'can_dispatch_spares' => false,
            'can_adjust_inventory_stock' => false,
            'can_view_analytics' => false,
        ]);

        // 3. Seed Vendors
        $vendor1 = Vendor::create([
            'name' => 'Dürkopp Adler Industrial Automation',
            'contact_name' => 'Klaus Schneider',
            'email' => 'sales@duerkopp-adler.de',
            'phone' => '+49 521 925-00',
            'tax_id' => 'DE-123456789',
            'address' => 'Potsdamer Str. 190, 33719 Bielefeld, Germany',
            'machinery_categories' => ['Heavy Stitching', 'Walking Foot Sewing', 'CNC Automatic Pattern Stitchers'],
            'rating' => 4.95,
        ]);

        $vendor2 = Vendor::create([
            'name' => 'Atom Cutting Systems Italy',
            'contact_name' => 'Marco Rossi',
            'email' => 'support@atom-cutting.it',
            'phone' => '+39 0381 3021',
            'tax_id' => 'IT-987654321',
            'address' => 'Via Morosini 6, 27029 Vigevano PV, Italy',
            'machinery_categories' => ['Hydraulic Clicking Presses', 'CNC FlashCut Knife Systems'],
            'rating' => 4.88,
        ]);

        $vendor3 = Vendor::create([
            'name' => 'Fortuna Spezialmaschinen GmbH',
            'contact_name' => 'Dieter Weber',
            'email' => 'info@fortuna-gmbh.de',
            'phone' => '+49 7054 40-0',
            'tax_id' => 'DE-887766554',
            'address' => 'Eisenbahnstraße 15, 75365 Calw, Germany',
            'machinery_categories' => ['Leather Skiving', 'Bandknife Leather Splitting'],
            'rating' => 4.92,
        ]);

        $vendor4 = Vendor::create([
            'name' => 'Torielli Footwear Machinery',
            'contact_name' => 'Enzo Ferrari',
            'email' => 'contact@torielli.com',
            'phone' => '+39 0381 2921',
            'tax_id' => 'IT-554433221',
            'address' => 'Corso Milano 101, Vigevano, Italy',
            'machinery_categories' => ['Embossing & Hot Stamping', 'Edge Burnishing & Inking'],
            'rating' => 4.75,
        ]);

        // 4. Seed Leather Machinery with JSON Specifications & QR Hashes
        $machines = [
            [
                'code' => 'MAC-DA-867-01',
                'name' => 'Dürkopp Adler 867-M Heavy Leather Stitcher',
                'model' => '867-M-PREMIUM-CLASS',
                'serial' => 'DA-867-2024-001',
                'vendor_id' => $vendor1->id,
                'block_id' => $blockA->id,
                'floor_id' => $floor2->id,
                'line_id' => $line3->id,
                'qr_hash' => 'QR-LM-DA867-001-ALPHA',
                'status' => Machine::STATUS_OPERATIONAL,
                'specs' => [
                    'motor_specs' => '750W Direct-Drive Integrated Servo Motor (230V / 50Hz)',
                    'needle_type' => 'Schmetz 134-35 LR Diamond Leather Point (Gauge 140/22 to 180/24)',
                    'hydraulic_rating' => 'N/A (Pneumatic Foot Lift @ 6.0 Bar)',
                    'operating_voltage' => '220V - 240V Single Phase',
                    'air_pressure_bar' => '6.0 Bar (Pneumatic Thread Trimmer & Backtack)',
                    'max_speed_rpm' => '3,000 SPM (Stitches Per Minute)',
                    'stitch_length_max' => '12.0 mm',
                ],
            ],
            [
                'code' => 'MAC-ATOM-888-01',
                'name' => 'Atom FlashCut 888 Multi-Head CNC Leather Cutter',
                'model' => 'FlashCut 888-L50',
                'serial' => 'ATOM-FC888-2023-019',
                'vendor_id' => $vendor2->id,
                'block_id' => $blockA->id,
                'floor_id' => $floor1->id,
                'line_id' => $line1->id,
                'qr_hash' => 'QR-LM-ATOM888-001-ALPHA',
                'status' => Machine::STATUS_BREAKDOWN,
                'specs' => [
                    'motor_specs' => 'Dual 3.5 kW Brushless Oscillating Blade Servo Drives',
                    'needle_type' => 'N/A (Multi-Tool Oscillating Tungsten Carbide Blades)',
                    'hydraulic_rating' => 'High-Capacity Multi-Zone Vacuum Hold-down System (7.5 kW)',
                    'operating_voltage' => '400V 3-Phase + Neutral (50/60 Hz)',
                    'air_pressure_bar' => '7.0 Bar Continuous',
                    'max_speed_rpm' => 'Cutting Speed up to 80 m/min',
                    'nesting_system' => 'Automated HD Optical Leather Flaw Detection & Auto-Nesting',
                ],
            ],
            [
                'code' => 'MAC-FORT-F50-01',
                'name' => 'Fortuna F50 High-Precision Leather Skiving Machine',
                'model' => 'F50-ELECTRONIC',
                'serial' => 'FORT-F50-2022-108',
                'vendor_id' => $vendor3->id,
                'block_id' => $blockA->id,
                'floor_id' => $floor1->id,
                'line_id' => $line2->id,
                'qr_hash' => 'QR-LM-FORT50-001-ALPHA',
                'status' => Machine::STATUS_UNDER_MAINTENANCE,
                'specs' => [
                    'motor_specs' => '0.75 kW Variable Speed Drive Motor with Electronic Foot Pedal',
                    'needle_type' => 'Bell Knife High-Speed Chromium Coated',
                    'hydraulic_rating' => 'N/A (Pneumatic Waste Scrap Extraction)',
                    'operating_voltage' => '230V Single Phase',
                    'air_pressure_bar' => '5.5 Bar',
                    'max_speed_rpm' => '1,800 RPM',
                    'skiving_width_max' => '50 mm',
                ],
            ],
            [
                'code' => 'MAC-CAM-C420-01',
                'name' => 'Camoga C420 Bandknife Leather Splitting Machine',
                'model' => 'C420-CN',
                'serial' => 'CAM-C420-2023-044',
                'vendor_id' => $vendor3->id,
                'block_id' => $blockA->id,
                'floor_id' => $floor1->id,
                'line_id' => $line1->id,
                'qr_hash' => 'QR-LM-CAMC420-001-ALPHA',
                'status' => Machine::STATUS_OPERATIONAL,
                'specs' => [
                    'motor_specs' => '2.2 kW High-Torque Main Spindle Motor',
                    'needle_type' => 'Endless Bandknife Blade (3500 x 50 x 0.8 mm)',
                    'hydraulic_rating' => 'Integrated Digital Thickness Micrometer Feeder (0.1mm tolerance)',
                    'operating_voltage' => '380V 3-Phase',
                    'air_pressure_bar' => '6.0 Bar',
                    'max_speed_rpm' => 'Splitting feed 0-35 m/min',
                    'work_width' => '420 mm',
                ],
            ],
            [
                'code' => 'MAC-TORI-TP40-01',
                'name' => 'Torielli TP-40 40-Ton Hydraulic Leather Embossing Press',
                'model' => 'TP-40-HYDRA-HEAT',
                'serial' => 'TORI-TP40-2024-007',
                'vendor_id' => $vendor4->id,
                'block_id' => $blockA->id,
                'floor_id' => $floor1->id,
                'line_id' => $line2->id,
                'qr_hash' => 'QR-LM-TORITP40-001-ALPHA',
                'status' => Machine::STATUS_OPERATIONAL,
                'specs' => [
                    'motor_specs' => '5.5 kW Hydraulic Pump Motor',
                    'needle_type' => 'Hot Stamping Solid Brass Engraved Die Plates',
                    'hydraulic_rating' => '40 Metric Tons Pressure (Operating Pressure 210 Bar)',
                    'operating_voltage' => '400V 3-Phase',
                    'air_pressure_bar' => '6.0 Bar (Pneumatic Safety Dual-Hand Release)',
                    'max_speed_rpm' => 'Heating Temp up to 250°C (PID Digital Thermostat)',
                    'platen_size' => '600 x 500 mm',
                ],
            ],
            [
                'code' => 'MAC-DA-669-01',
                'name' => 'Dürkopp Adler 669 Cylinder Arm Luxury Leather Stitcher',
                'model' => '669-180010-ECO',
                'serial' => 'DA-669-2024-055',
                'vendor_id' => $vendor1->id,
                'block_id' => $blockA->id,
                'floor_id' => $floor2->id,
                'line_id' => $line4->id,
                'qr_hash' => 'QR-LM-DA669-001-ALPHA',
                'status' => Machine::STATUS_OPERATIONAL,
                'specs' => [
                    'motor_specs' => '550W Mini-Stop Energy Saving DC Servo Motor',
                    'needle_type' => 'Schmetz 134-35 S Narrow Leather Wedge (Gauge 110/18 to 160/23)',
                    'hydraulic_rating' => 'N/A',
                    'operating_voltage' => '220V Single Phase',
                    'air_pressure_bar' => '6.0 Bar',
                    'max_speed_rpm' => '2,600 SPM',
                    'cylinder_diameter' => '50 mm Slim Profile Arm',
                ],
            ],
        ];

        $createdMachines = [];
        foreach ($machines as $m) {
            $createdMachines[$m['code']] = Machine::create([
                'machine_code' => $m['code'],
                'name' => $m['name'],
                'model_number' => $m['model'],
                'serial_number' => $m['serial'],
                'vendor_id' => $m['vendor_id'],
                'block_id' => $m['block_id'],
                'floor_id' => $m['floor_id'],
                'line_id' => $m['line_id'],
                'qr_code_hash' => $m['qr_hash'],
                'specifications' => $m['specs'],
                'status' => $m['status'],
                'installed_at' => now()->subMonths(6),
            ]);
        }

        // 5. Seed Frequent Service Catalog
        $services = [
            [
                'category' => 'Sewing',
                'title' => 'Needle Bar Timing & Rotary Hook Calibration',
                'description' => 'Complete precision alignment of needle rise, rotary hook tip distance (0.05mm), timing belt lash check, and bobbin tension verification.',
                'duration' => 45,
                'frequency' => 30,
                'procedures' => [
                    'Check needle bar height gauge mark alignment',
                    'Calibrate rotary hook point clearance to 0.05mm gap',
                    'Inspect needle guard deflection',
                    'Lubricate bevel gear box with synthetic grease',
                ],
            ],
            [
                'category' => 'Hydraulic Press',
                'title' => 'Hydraulic Fluid Flushing & Proportional Valve Calibration',
                'description' => 'Drain ISO VG 46 hydraulic oil, replace 10-micron return filter cartridge, inspect cylinder piston seals for leakage, and test emergency pressure dump.',
                'duration' => 120,
                'frequency' => 90,
                'procedures' => [
                    'Drain reservoir into hazardous waste container',
                    'Install new high-pressure spin-on filter cartridge',
                    'Refill 45L Shell Tellus S2 MX 46 fluid',
                    'Calibrate system pressure relief valve to 210 Bar',
                    'Verify dual-hand optoelectronic safety interlocks',
                ],
            ],
            [
                'category' => 'Splitting & Skiving',
                'title' => 'Bandknife Blade Dressing & Micrometer Zero-Point Calibration',
                'description' => 'Dress grinding wheels, sharpen continuous bandknife edge, inspect copper guides for wear, and zero digital micrometer feed roller.',
                'duration' => 60,
                'frequency' => 14,
                'procedures' => [
                    'Dress CBN grinding stones with diamond dresser',
                    'Verify symmetrical bevel on endless blade edge',
                    'Inspect scrap exhaust vacuum suction flow',
                    'Calibrate feed thickness digital display with feeler gauges',
                ],
            ],
            [
                'category' => 'Embossing',
                'title' => 'Thermal Platen PID Thermostat & Safety Sensor Check',
                'description' => 'Verify multi-zone heating element resistance, replace thermocouple probe if drifting > 2°C, and test mechanical platen anti-drop brake.',
                'duration' => 50,
                'frequency' => 45,
                'procedures' => [
                    'Measure element resistance with digital multimeter',
                    'Thermal camera scan of platen to verify uniform heat map',
                    'Test automatic foil feed indexing stepper motor',
                ],
            ],
        ];

        foreach ($services as $srv) {
            ServiceCatalog::create([
                'machine_category' => $srv['category'],
                'title' => $srv['title'],
                'description' => $srv['description'],
                'estimated_duration_minutes' => $srv['duration'],
                'recommended_frequency_days' => $srv['frequency'],
                'standard_procedures' => $srv['procedures'],
            ]);
        }

        // 6. Seed Spare Parts Inventory Catalog
        $parts = [
            [
                'part_number' => 'SCHMETZ-134-35-140',
                'name' => 'Schmetz 134-35 LR Diamond Point Needles (140/22)',
                'category' => 'Needles & Hooks',
                'stock' => 240,
                'min_threshold' => 50,
                'cost' => 1.75,
                'bin' => 'BIN-A01-01',
                'types' => ['Heavy Stitching', 'Walking Foot Sewing'],
            ],
            [
                'part_number' => 'ROTARY-HOOK-DA-867',
                'name' => 'Titanium-DLC Large Rotary Hook Assembly',
                'category' => 'Needles & Hooks',
                'stock' => 14,
                'min_threshold' => 4,
                'cost' => 195.00,
                'bin' => 'BIN-A02-04',
                'types' => ['Heavy Stitching'],
            ],
            [
                'part_number' => 'ATOM-HYD-SEAL-KIT',
                'name' => 'High-Pressure Viton Hydraulic Seal & O-Ring Kit',
                'category' => 'Hydraulic Valves',
                'stock' => 22,
                'min_threshold' => 5,
                'cost' => 110.00,
                'bin' => 'BIN-B01-02',
                'types' => ['Hydraulic Clicking Presses', 'Hydraulic Embossing'],
            ],
            [
                'part_number' => 'REXROTH-PROP-VALVE',
                'name' => 'Bosch Rexroth 24V Proportional Pressure Control Valve',
                'category' => 'Hydraulic Valves',
                'stock' => 7,
                'min_threshold' => 2,
                'cost' => 430.00,
                'bin' => 'BIN-B02-01',
                'types' => ['Hydraulic Clicking Presses', 'Hydraulic Embossing'],
            ],
            [
                'part_number' => 'CAMOGA-BLADE-3500',
                'name' => 'German High-Carbon Bandknife Endless Blade (3500mm)',
                'category' => 'Blades & Knives',
                'stock' => 10,
                'min_threshold' => 3,
                'cost' => 225.00,
                'bin' => 'BIN-C01-01',
                'types' => ['Bandknife Leather Splitting'],
            ],
            [
                'part_number' => 'FORTUNA-FEED-ROLLER',
                'name' => 'Diamond-Grit Precision Feed Roller for Skiver',
                'category' => 'Rollers & Guides',
                'stock' => 18,
                'min_threshold' => 6,
                'cost' => 85.00,
                'bin' => 'BIN-C02-03',
                'types' => ['Leather Skiving'],
            ],
            [
                'part_number' => 'CERAMIC-HEAT-2000W',
                'name' => '2000W / 230V High-Density Platen Heating Cartridge',
                'category' => 'Heating Elements',
                'stock' => 15,
                'min_threshold' => 4,
                'cost' => 125.00,
                'bin' => 'BIN-D01-05',
                'types' => ['Embossing & Hot Stamping'],
            ],
            [
                'part_number' => 'OPTIBELT-SYNCHRO-50',
                'name' => 'Optibelt Synchroforce High-Torque Timing Belt',
                'category' => 'Drive Belts',
                'stock' => 3, // LOW STOCK TRIGGER FOR DEMO
                'min_threshold' => 8,
                'cost' => 48.50,
                'bin' => 'BIN-A03-02',
                'types' => ['Heavy Stitching', 'Leather Skiving'],
            ],
            [
                'part_number' => 'SERVO-DRIVE-750W',
                'name' => '750W Direct Drive Brushless AC Servo Motor',
                'category' => 'Motors & Sensors',
                'stock' => 5,
                'min_threshold' => 2,
                'cost' => 395.00,
                'bin' => 'BIN-E01-01',
                'types' => ['Heavy Stitching', 'CNC Automatic Pattern Stitchers'],
            ],
            [
                'part_number' => 'ATOM-CUT-PAD-HDPE',
                'name' => 'High-Density Polypropylene 500x1000mm Cutting Pad',
                'category' => 'Wear Plates',
                'stock' => 28,
                'min_threshold' => 10,
                'cost' => 70.00,
                'bin' => 'BIN-B03-04',
                'types' => ['Hydraulic Clicking Presses'],
            ],
        ];

        $createdParts = [];
        foreach ($parts as $p) {
            $part = Part::create([
                'part_number' => $p['part_number'],
                'name' => $p['name'],
                'category' => $p['category'],
                'stock_quantity' => $p['stock'],
                'min_threshold' => $p['min_threshold'],
                'unit_cost' => $p['cost'],
                'location_bin' => $p['bin'],
                'compatible_machine_types' => $p['types'],
            ]);

            $createdParts[$p['part_number']] = $part;

            // Seed initial restock audit log
            InventoryAuditLog::create([
                'part_id' => $part->id,
                'repair_log_id' => null,
                'user_id' => $createdUsers[User::ROLE_SPARE_HEAD]->id,
                'change_type' => InventoryAuditLog::TYPE_RESTOCK,
                'quantity_delta' => $part->stock_quantity,
                'balance_before' => 0,
                'balance_after' => $part->stock_quantity,
                'remarks' => "Initial warehouse bin provisioning in {$part->location_bin}",
                'timestamp' => now()->subDays(15),
            ]);
        }

        // 7. Seed Active Multi-Tier Pipeline Repair Tickets
        // Ticket 1: In Tech Lead Approval Queue (Waiting for Tech Lead to approve BOM)
        $ticket1 = RepairLog::create([
            'ticket_number' => 'TKT-202608-001',
            'machine_id' => $createdMachines['MAC-ATOM-888-01']->id,
            'line_id' => $line1->id,
            'reporter_id' => $createdUsers[User::ROLE_LINE_SUPERVISOR]->id,
            'mechanic_id' => $createdUsers[User::ROLE_MECHANIC]->id,
            'ticket_type' => RepairLog::TYPE_BREAKDOWN_REPAIR,
            'priority' => RepairLog::PRIORITY_CRITICAL,
            'status' => RepairLog::STATUS_PENDING_TECH_APPROVAL,
            'reported_issue' => 'Severe hydraulic pressure loss during multi-ply chrome-tanned leather cutting cycle. Machine halted mid-nesting.',
            'diagnosis_notes' => 'Mechanic inspection confirmed hydraulic cylinder main seal blowout and proportional control valve sticking under 180 bar pressure.',
            'breakdown_start_time' => now()->subHours(3),
        ]);

        RepairSpareRequest::create([
            'repair_log_id' => $ticket1->id,
            'part_id' => $createdParts['ATOM-HYD-SEAL-KIT']->id,
            'requested_quantity' => 2,
            'status' => RepairSpareRequest::STATUS_REQUESTED,
        ]);

        RepairSpareRequest::create([
            'repair_log_id' => $ticket1->id,
            'part_id' => $createdParts['REXROTH-PROP-VALVE']->id,
            'requested_quantity' => 1,
            'status' => RepairSpareRequest::STATUS_REQUESTED,
        ]);

        // Ticket 2: In Spare Head Dispatch Queue (Tech Lead approved, ready for warehouse dispatch)
        $ticket2 = RepairLog::create([
            'ticket_number' => 'TKT-202608-002',
            'machine_id' => $createdMachines['MAC-FORT-F50-01']->id,
            'line_id' => $line2->id,
            'reporter_id' => $createdUsers[User::ROLE_LINE_SUPERVISOR]->id,
            'mechanic_id' => $createdUsers[User::ROLE_MECHANIC]->id,
            'tech_lead_id' => $createdUsers[User::ROLE_TECH_LEAD]->id,
            'ticket_type' => RepairLog::TYPE_ROUTINE_SERVICE,
            'priority' => RepairLog::PRIORITY_HIGH,
            'status' => RepairLog::STATUS_PENDING_SPARE_DISPATCH,
            'reported_issue' => 'Uneven edge skiving bevel on veg-tan strap production. Frequent leather jamming.',
            'diagnosis_notes' => 'Mechanic diagnosed worn diamond feed roller and slipping drive timing belt. Tech Lead reviewed and verified replacement requirement.',
            'breakdown_start_time' => now()->subHours(5),
        ]);

        RepairSpareRequest::create([
            'repair_log_id' => $ticket2->id,
            'part_id' => $createdParts['FORTUNA-FEED-ROLLER']->id,
            'requested_quantity' => 1,
            'approved_quantity' => 1,
            'status' => RepairSpareRequest::STATUS_APPROVED,
            'tech_lead_notes' => 'Approved. Roller shows extensive diamond grit degradation.',
        ]);

        RepairSpareRequest::create([
            'repair_log_id' => $ticket2->id,
            'part_id' => $createdParts['OPTIBELT-SYNCHRO-50']->id,
            'requested_quantity' => 1,
            'approved_quantity' => 1,
            'status' => RepairSpareRequest::STATUS_APPROVED,
            'tech_lead_notes' => 'Approved. Timing belt teeth worn beyond tolerance.',
        ]);

        // Ticket 3: Completed Repair (Historical demonstration with calculated downtime)
        $ticket3 = RepairLog::create([
            'ticket_number' => 'TKT-202608-003',
            'machine_id' => $createdMachines['MAC-DA-867-01']->id,
            'line_id' => $line3->id,
            'reporter_id' => $createdUsers[User::ROLE_LINE_SUPERVISOR]->id,
            'mechanic_id' => $createdUsers[User::ROLE_MECHANIC]->id,
            'tech_lead_id' => $createdUsers[User::ROLE_TECH_LEAD]->id,
            'spare_head_id' => $createdUsers[User::ROLE_SPARE_HEAD]->id,
            'ticket_type' => RepairLog::TYPE_ROUTINE_SERVICE,
            'priority' => RepairLog::PRIORITY_MEDIUM,
            'status' => RepairLog::STATUS_OPERATIONAL,
            'reported_issue' => 'Scheduled 30-day needle bar timing and hook clearance calibration.',
            'diagnosis_notes' => 'Rotary hook worn with micro-burrs causing thread fraying on 1.2mm bonded nylon thread. Replaced rotary hook assembly and diamond needles.',
            'breakdown_start_time' => now()->subDays(2)->subHours(4),
            'breakdown_end_time' => now()->subDays(2)->subHours(2),
            'total_downtime_minutes' => 120,
        ]);

        $reqHook = RepairSpareRequest::create([
            'repair_log_id' => $ticket3->id,
            'part_id' => $createdParts['ROTARY-HOOK-DA-867']->id,
            'requested_quantity' => 1,
            'approved_quantity' => 1,
            'dispatched_quantity' => 1,
            'unit_cost_at_dispatch' => 195.00,
            'status' => RepairSpareRequest::STATUS_DISPATCHED,
            'tech_lead_notes' => 'Approved replacement for high-precision stitching.',
        ]);

        $reqNeedles = RepairSpareRequest::create([
            'repair_log_id' => $ticket3->id,
            'part_id' => $createdParts['SCHMETZ-134-35-140']->id,
            'requested_quantity' => 10,
            'approved_quantity' => 10,
            'dispatched_quantity' => 10,
            'unit_cost_at_dispatch' => 1.75,
            'status' => RepairSpareRequest::STATUS_DISPATCHED,
            'tech_lead_notes' => 'Pack of 10 approved.',
        ]);

        InventoryAuditLog::create([
            'part_id' => $createdParts['ROTARY-HOOK-DA-867']->id,
            'repair_log_id' => $ticket3->id,
            'user_id' => $createdUsers[User::ROLE_SPARE_HEAD]->id,
            'change_type' => InventoryAuditLog::TYPE_DISPATCH,
            'quantity_delta' => -1,
            'balance_before' => 15,
            'balance_after' => 14,
            'remarks' => "Dispatch from bin BIN-A02-04 for ticket {$ticket3->ticket_number}",
            'timestamp' => now()->subDays(2)->subHours(3),
        ]);

        InventoryAuditLog::create([
            'part_id' => $createdParts['SCHMETZ-134-35-140']->id,
            'repair_log_id' => $ticket3->id,
            'user_id' => $createdUsers[User::ROLE_SPARE_HEAD]->id,
            'change_type' => InventoryAuditLog::TYPE_DISPATCH,
            'quantity_delta' => -10,
            'balance_before' => 250,
            'balance_after' => 240,
            'remarks' => "Dispatch from bin BIN-A01-01 for ticket {$ticket3->ticket_number}",
            'timestamp' => now()->subDays(2)->subHours(3),
        ]);
    }
}
