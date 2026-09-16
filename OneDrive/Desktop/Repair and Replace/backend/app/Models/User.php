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
        'manager_id',
        'block_id',
        'floor_id',
        'line_id',
        'phone',
        'status',
    ];

    protected $appends = [
        'reporting_chain',
        'higher_official',
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

    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    public function subordinates(): HasMany
    {
        return $this->hasMany(User::class, 'manager_id');
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

    /**
     * Compute full chain of higher officials reporting up to Plant Director / Admin
     */
    public function getReportingChainAttribute(): array
    {
        $chain = [];
        $visited = [$this->id];

        // 1. Direct explicit manager link
        $current = $this->manager;
        while ($current && !in_array($current->id, $visited, true)) {
            $visited[] = $current->id;
            $chain[] = [
                'id' => $current->id,
                'name' => $current->name,
                'role' => $current->role,
                'email' => $current->email,
                'phone' => $current->phone,
                'designation' => $this->getRoleTitle($current->role),
                'block' => $current->block?->name,
                'floor' => $current->floor?->name,
                'line' => $current->line?->name,
            ];
            $current = $current->manager;
        }

        // 2. If chain is empty (no explicit manager_id), resolve hierarchically
        if (empty($chain)) {
            $hierarchyOfficials = $this->resolveHierarchyOfficials();
            foreach ($hierarchyOfficials as $official) {
                if ($official && !in_array($official->id, $visited, true)) {
                    $visited[] = $official->id;
                    $chain[] = [
                        'id' => $official->id,
                        'name' => $official->name,
                        'role' => $official->role,
                        'email' => $official->email,
                        'phone' => $official->phone,
                        'designation' => $this->getRoleTitle($official->role),
                        'block' => $official->block?->name,
                        'floor' => $official->floor?->name,
                        'line' => $official->line?->name,
                    ];
                }
            }
        }

        return $chain;
    }

    /**
     * Immediate Higher Official
     */
    public function getHigherOfficialAttribute(): ?array
    {
        $chain = $this->reporting_chain;
        return !empty($chain) ? $chain[0] : null;
    }

    /**
     * Resolve higher officials based on hierarchy nodes
     */
    protected function resolveHierarchyOfficials(): array
    {
        $officials = [];

        switch ($this->role) {
            case self::ROLE_MECHANIC:
                // Reports to Line Supervisor
                if ($this->line_id) {
                    $sup = User::where('role', self::ROLE_LINE_SUPERVISOR)
                        ->where('line_id', $this->line_id)
                        ->first();
                    if ($sup) $officials[] = $sup;
                }
                // Then to Floor Manager
                if ($this->floor_id) {
                    $fm = User::where('role', self::ROLE_FLOOR_MANAGER)
                        ->where('floor_id', $this->floor_id)
                        ->first();
                    if ($fm) $officials[] = $fm;
                }
                // Then to Block Manager
                if ($this->block_id) {
                    $bm = User::where('role', self::ROLE_BLOCK_MANAGER)
                        ->where('block_id', $this->block_id)
                        ->first();
                    if ($bm) $officials[] = $bm;
                }
                // Finally Admin
                $admin = User::where('role', self::ROLE_ADMIN)->first();
                if ($admin) $officials[] = $admin;
                break;

            case self::ROLE_LINE_SUPERVISOR:
                // Reports to Floor Manager
                if ($this->floor_id) {
                    $fm = User::where('role', self::ROLE_FLOOR_MANAGER)
                        ->where('floor_id', $this->floor_id)
                        ->first();
                    if ($fm) $officials[] = $fm;
                }
                // Then to Block Manager
                if ($this->block_id) {
                    $bm = User::where('role', self::ROLE_BLOCK_MANAGER)
                        ->where('block_id', $this->block_id)
                        ->first();
                    if ($bm) $officials[] = $bm;
                }
                // Finally Admin
                $admin = User::where('role', self::ROLE_ADMIN)->first();
                if ($admin) $officials[] = $admin;
                break;

            case self::ROLE_FLOOR_MANAGER:
                // Reports to Block Manager
                if ($this->block_id) {
                    $bm = User::where('role', self::ROLE_BLOCK_MANAGER)
                        ->where('block_id', $this->block_id)
                        ->first();
                    if ($bm) $officials[] = $bm;
                }
                // Finally Admin
                $admin = User::where('role', self::ROLE_ADMIN)->first();
                if ($admin) $officials[] = $admin;
                break;

            case self::ROLE_BLOCK_MANAGER:
            case self::ROLE_TECH_LEAD:
            case self::ROLE_SPARE_HEAD:
                // Reports directly to General Admin / Plant Director
                $admin = User::where('role', self::ROLE_ADMIN)->first();
                if ($admin) $officials[] = $admin;
                break;

            default:
                break;
        }

        return $officials;
    }

    public static function getRoleTitle(string $role): string
    {
        return match ($role) {
            self::ROLE_ADMIN => 'Plant Director / Executive Admin',
            self::ROLE_BLOCK_MANAGER => 'Complex Block Manager',
            self::ROLE_FLOOR_MANAGER => 'Floor Operations Manager',
            self::ROLE_LINE_SUPERVISOR => 'Line Production Supervisor',
            self::ROLE_MECHANIC => 'Shopfloor Maintenance Technician',
            self::ROLE_TECH_LEAD => 'Chief Diagnostics & Tech Lead',
            self::ROLE_SPARE_HEAD => 'Spare Parts & Warehouse Lead',
            default => ucfirst(str_replace('_', ' ', $role)),
        };
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

    public function submittedWorkReports(): HasMany
    {
        return $this->hasMany(WorkReport::class, 'user_id');
    }

    public function subordinateWorkReports(): HasMany
    {
        return $this->hasMany(WorkReport::class, 'manager_id');
    }

    /**
     * Compute all direct and hierarchical subordinate IDs within this official's scope
     */
    public function getSubordinateUserIds(): array
    {
        // 1. Direct explicit subordinates
        $ids = User::where('manager_id', $this->id)->pluck('id')->toArray();

        // 2. Hierarchical scope subordinates
        switch ($this->role) {
            case self::ROLE_ADMIN:
                $all = User::where('id', '!=', $this->id)->pluck('id')->toArray();
                $ids = array_unique(array_merge($ids, $all));
                break;

            case self::ROLE_BLOCK_MANAGER:
                if ($this->block_id) {
                    $blockSubordinates = User::where('block_id', $this->block_id)
                        ->whereIn('role', [self::ROLE_FLOOR_MANAGER, self::ROLE_LINE_SUPERVISOR, self::ROLE_MECHANIC])
                        ->where('id', '!=', $this->id)
                        ->pluck('id')->toArray();
                    $ids = array_unique(array_merge($ids, $blockSubordinates));
                }
                break;

            case self::ROLE_FLOOR_MANAGER:
                if ($this->floor_id) {
                    $floorSubordinates = User::where('floor_id', $this->floor_id)
                        ->whereIn('role', [self::ROLE_LINE_SUPERVISOR, self::ROLE_MECHANIC])
                        ->where('id', '!=', $this->id)
                        ->pluck('id')->toArray();
                    $ids = array_unique(array_merge($ids, $floorSubordinates));
                }
                break;

            case self::ROLE_LINE_SUPERVISOR:
                if ($this->line_id) {
                    $lineSubordinates = User::where('line_id', $this->line_id)
                        ->where('role', self::ROLE_MECHANIC)
                        ->where('id', '!=', $this->id)
                        ->pluck('id')->toArray();
                    $ids = array_unique(array_merge($ids, $lineSubordinates));
                }
                break;

            case self::ROLE_TECH_LEAD:
                // Tech lead oversees mechanics' technical repair submissions
                $mechanicIds = User::where('role', self::ROLE_MECHANIC)->pluck('id')->toArray();
                $ids = array_unique(array_merge($ids, $mechanicIds));
                break;

            case self::ROLE_SPARE_HEAD:
                // Spare head manages warehouse team & parts requests
                break;

            default:
                // Mechanics and operators have no subordinates
                break;
        }

        return array_values(array_filter($ids));
    }

    /**
     * Check if this user is a designated higher official of another user
     */
    public function isHigherOfficialOf(User $subordinate): bool
    {
        if ($this->role === self::ROLE_ADMIN) {
            return true;
        }

        $subordinateIds = $this->getSubordinateUserIds();
        return in_array($subordinate->id, $subordinateIds, true);
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

