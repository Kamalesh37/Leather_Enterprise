<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WarehouseStorageZone extends Model
{
    use HasFactory;

    protected $table = 'warehouse_storage_zones';

    protected $fillable = [
        'zone_code',
        'name',
        'location_type',
        'aisle_bay',
        'capacity_bins',
        'description',
        'color',
        'is_active',
    ];

    protected $casts = [
        'capacity_bins' => 'integer',
        'is_active' => 'boolean',
    ];
}
