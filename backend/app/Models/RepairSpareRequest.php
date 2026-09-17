<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RepairSpareRequest extends Model
{
    use HasFactory;

    public const STATUS_REQUESTED = 'REQUESTED';
    public const STATUS_APPROVED = 'APPROVED';
    public const STATUS_REJECTED = 'REJECTED';
    public const STATUS_DISPATCHED = 'DISPATCHED';

    protected $fillable = [
        'repair_log_id',
        'part_id',
        'requested_quantity',
        'approved_quantity',
        'dispatched_quantity',
        'unit_cost_at_dispatch',
        'status',
        'tech_lead_notes',
    ];

    protected $casts = [
        'requested_quantity' => 'integer',
        'approved_quantity' => 'integer',
        'dispatched_quantity' => 'integer',
        'unit_cost_at_dispatch' => 'decimal:2',
    ];

    public function repairLog(): BelongsTo
    {
        return $this->belongsTo(RepairLog::class);
    }

    public function part(): BelongsTo
    {
        return $this->belongsTo(Part::class);
    }
}
