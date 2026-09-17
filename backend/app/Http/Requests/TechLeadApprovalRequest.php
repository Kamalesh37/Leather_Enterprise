<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TechLeadApprovalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tech_lead_notes' => 'nullable|string',
            'parts_approval' => 'required|array',
            'parts_approval.*.request_id' => 'required|exists:repair_spare_requests,id',
            'parts_approval.*.approved_quantity' => 'required|integer|min:0',
            'parts_approval.*.status' => 'required|string|in:APPROVED,REJECTED',
            'parts_approval.*.notes' => 'nullable|string',
        ];
    }
}
