<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCrewPermissionsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'role' => 'nullable|string|in:admin,block_manager,floor_manager,line_supervisor,mechanic,tech_lead,spare_head',
            'manager_id' => 'nullable|exists:users,id',
            'block_id' => 'nullable|exists:blocks,id',
            'floor_id' => 'nullable|exists:floors,id',
            'line_id' => 'nullable|exists:lines,id',
            'phone' => 'nullable|string|max:50',
            'status' => 'nullable|string|in:active,inactive',


            'permissions' => 'nullable|array',
            'permissions.can_manage_vendors' => 'nullable|boolean',
            'permissions.can_edit_machines' => 'nullable|boolean',
            'permissions.can_assign_mechanics' => 'nullable|boolean',
            'permissions.can_approve_diagnostics' => 'nullable|boolean',
            'permissions.can_dispatch_spares' => 'nullable|boolean',
            'permissions.can_adjust_inventory_stock' => 'nullable|boolean',
            'permissions.can_view_analytics' => 'nullable|boolean',
        ];
    }
}
