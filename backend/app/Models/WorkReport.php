<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkReport extends Model
{
    use HasFactory;

    public const STATUS_SUBMITTED = 'submitted';
    public const STATUS_REVIEWED = 'reviewed';
    public const STATUS_ACKNOWLEDGED = 'acknowledged';

    protected $fillable = [
        'user_id',
        'manager_id',
        'report_type',
        'title',
        'shift',
        'summary',
        'tasks_completed',
        'metrics',
        'blockers_and_delays',
        'recommendations',
        'status',
        'acknowledgement_notes',
        'acknowledged_at',
    ];

    protected $casts = [
        'tasks_completed' => 'array',
        'metrics' => 'array',
        'acknowledged_at' => 'datetime',
    ];

    /**
     * The author / subordinate who submitted the work report
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * The higher official / manager who receives & reviews the report
     */
    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manager_id');
    }
}
