<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RepairLog extends Model
{
    use HasFactory;

    public const TYPE_ROUTINE_SERVICE = 'ROUTINE_SERVICE';
    public const TYPE_BREAKDOWN_REPAIR = 'BREAKDOWN_REPAIR';

    public const PRIORITY_LOW = 'LOW';
    public const PRIORITY_MEDIUM = 'MEDIUM';
    public const PRIORITY_HIGH = 'HIGH';
    public const PRIORITY_CRITICAL = 'CRITICAL';

    public const STATUS_REPORTED = 'REPORTED';
    public const STATUS_DIAGNOSING = 'DIAGNOSING';
    public const STATUS_PENDING_TECH_APPROVAL = 'PENDING_TECH_APPROVAL';
    public const STATUS_PENDING_SPARE_DISPATCH = 'PENDING_SPARE_DISPATCH';
    public const STATUS_IN_REPAIR = 'IN_REPAIR';
    public const STATUS_PENDING_SIGN_OFF = 'PENDING_SIGN_OFF';
    public const STATUS_OPERATIONAL = 'OPERATIONAL';
    public const STATUS_CLOSED = 'CLOSED';

    protected $fillable = [
        'ticket_number',
        'machine_id',
        'line_id',
        'reporter_id',
        'mechanic_id',
        'tech_lead_id',
        'spare_head_id',
        'ticket_type',
        'priority',
        'status',
        'reported_issue',
        'diagnosis_notes',
        'breakdown_start_time',
        'breakdown_end_time',
        'total_downtime_minutes',
    ];

    protected $casts = [
        'breakdown_start_time' => 'datetime',
        'breakdown_end_time' => 'datetime',
        'total_downtime_minutes' => 'integer',
    ];

    public function machine(): BelongsTo
    {
        return $this->belongsTo(Machine::class);
    }

    public function line(): BelongsTo
    {
        return $this->belongsTo(Line::class);
    }

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reporter_id');
    }

    public function mechanic(): BelongsTo
    {
        return $this->belongsTo(User::class, 'mechanic_id');
    }

    public function techLead(): BelongsTo
    {
        return $this->belongsTo(User::class, 'tech_lead_id');
    }

    public function spareHead(): BelongsTo
    {
        return $this->belongsTo(User::class, 'spare_head_id');
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
