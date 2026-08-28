<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Line extends Model
{
    use HasFactory;

    protected $fillable = [
        'floor_id',
        'name',
        'line_code',
    ];

    public function floor(): BelongsTo
    {
        return $this->belongsTo(Floor::class);
    }

    public function machines(): HasMany
    {
        return $this->hasMany(Machine::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function repairLogs(): HasMany
    {
        return $this->hasMany(RepairLog::class);
    }
}
