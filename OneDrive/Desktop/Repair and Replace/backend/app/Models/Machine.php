<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Machine extends Model
{
    use HasFactory;

    public const STATUS_OPERATIONAL = 'OPERATIONAL';
    public const STATUS_UNDER_MAINTENANCE = 'UNDER_MAINTENANCE';
    public const STATUS_BREAKDOWN = 'BREAKDOWN';
    public const STATUS_DECOMMISSIONED = 'DECOMMISSIONED';

    protected $fillable = [
        'machine_code',
        'name',
        'model_number',
        'serial_number',
        'vendor_id',
        'block_id',
        'floor_id',
        'line_id',
        'qr_code_hash',
        'specifications',
        'image_url',
        'status',
        'installed_at',
    ];

    protected $casts = [
        'specifications' => 'array',
        'installed_at' => 'datetime',
    ];

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function block(): BelongsTo
    {
        return $this->belongsTo(Block::class);
    }

    public function floor(): BelongsTo
    {
        return $this->belongsTo(Floor::class);
    }

    public function line(): BelongsTo
    {
        return $this->belongsTo(Line::class);
    }

    public function repairLogs(): HasMany
    {
        return $this->hasMany(RepairLog::class);
    }

    public function latestRepairLog()
    {
        return $this->hasOne(RepairLog::class)->latestOfMany();
    }
}
