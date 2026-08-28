<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    public const ROLE_ADMIN = 'admin';
    public const ROLE_BLOCK_MANAGER = 'block_manager';
    public const ROLE_FLOOR_MANAGER = 'floor_manager';
    public const ROLE_LINE_SUPERVISOR = 'line_supervisor';
    public const ROLE_MECHANIC = 'mechanic';
    public const ROLE_TECH_LEAD = 'tech_lead';
    public const ROLE_SPARE_HEAD = 'spare_head';

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'block_id',
        'floor_id',
        'line_id',
        'phone',
        'status',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
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

    public function permission(): HasOne
    {
        return $this->hasOne(UserPermission::class);
    }

    public function reportedRepairs(): HasMany
    {
        return $this->hasMany(RepairLog::class, 'reporter_id');
    }

    public function assignedRepairs(): HasMany
    {
        return $this->hasMany(RepairLog::class, 'mechanic_id');
    }

    public function approvedRepairs(): HasMany
    {
        return $this->hasMany(RepairLog::class, 'tech_lead_id');
    }

    public function dispatchedRepairs(): HasMany
    {
        return $this->hasMany(RepairLog::class, 'spare_head_id');
    }

    public function hasRole(string|array $roles): bool
    {
        if (is_array($roles)) {
            return in_array($this->role, $roles, true);
        }

        return $this->role === $roles;
    }

    public function hasPermission(string $permissionKey): bool
    {
        if ($this->role === self::ROLE_ADMIN) {
            return true;
        }

        if (!$this->relationLoaded('permission')) {
            $this->load('permission');
        }

        return (bool) ($this->permission?->{$permissionKey} ?? false);
    }
}
