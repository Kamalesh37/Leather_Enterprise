<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SpareDispatchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'request_ids' => 'nullable|array',
            'request_ids.*' => 'exists:repair_spare_requests,id',
            'remarks' => 'nullable|string|max:255',
        ];
    }
}
