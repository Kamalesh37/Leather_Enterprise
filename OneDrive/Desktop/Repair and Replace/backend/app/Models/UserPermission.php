<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserPermission extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'can_manage_vendors',
        'can_edit_machines',
        'can_assign_mechanics',
        'can_approve_diagnostics',
        'can_dispatch_spares',
        'can_adjust_inventory_stock',
        'can_view_analytics',
    ];

    protected $casts = [
        'can_manage_vendors' => 'boolean',
        'can_edit_machines' => 'boolean',
        'can_assign_mechanics' => 'boolean',
        'can_approve_diagnostics' => 'boolean',
        'can_dispatch_spares' => 'boolean',
        'can_adjust_inventory_stock' => 'boolean',
        'can_view_analytics' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
