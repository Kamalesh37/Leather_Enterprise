<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Part extends Model
{
    use HasFactory;

    protected $fillable = [
        'part_number',
        'name',
        'category',
        'stock_quantity',
        'min_threshold',
        'unit_cost',
        'location_bin',
        'compatible_machine_types',
    ];

    protected $casts = [
        'stock_quantity' => 'integer',
        'min_threshold' => 'integer',
        'unit_cost' => 'decimal:2',
        'compatible_machine_types' => 'array',
    ];

    protected $appends = [
        'is_low_stock',
    ];

    public function getIsLowStockAttribute(): bool
    {
        return $this->stock_quantity <= $this->min_threshold;
    }

    public function spareRequests(): HasMany
    {
        return $this->hasMany(RepairSpareRequest::class);
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(InventoryAuditLog::class);
    }
}
