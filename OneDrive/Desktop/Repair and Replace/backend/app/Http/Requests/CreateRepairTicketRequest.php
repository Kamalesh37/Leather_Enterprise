<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateRepairTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'machine_id' => 'nullable|exists:machines,id',
            'qr_code_hash' => 'nullable|string|exists:machines,qr_code_hash',
            'ticket_type' => 'required|string|in:ROUTINE_SERVICE,BREAKDOWN_REPAIR',
            'priority' => 'required|string|in:LOW,MEDIUM,HIGH,CRITICAL',
            'reported_issue' => 'required|string',
            'mechanic_id' => 'nullable|exists:users,id',
        ];
    }
}
