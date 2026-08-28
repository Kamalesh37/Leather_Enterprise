<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryAuditLog extends Model
{
    use HasFactory;

    public $timestamps = false;

    public const TYPE_DISPATCH = 'DISPATCH';
    public const TYPE_RESTOCK = 'RESTOCK';
    public const TYPE_ADJUSTMENT = 'ADJUSTMENT';
    public const TYPE_SCRAP = 'SCRAP';

    protected $fillable = [
        'part_id',
        'repair_log_id',
        'user_id',
        'change_type',
        'quantity_delta',
        'balance_before',
        'balance_after',
        'remarks',
        'timestamp',
    ];

    protected $casts = [
        'quantity_delta' => 'integer',
        'balance_before' => 'integer',
        'balance_after' => 'integer',
        'timestamp' => 'datetime',
    ];

    public function part(): BelongsTo
    {
        return $this->belongsTo(Part::class);
    }

    public function repairLog(): BelongsTo
    {
        return $this->belongsTo(RepairLog::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
