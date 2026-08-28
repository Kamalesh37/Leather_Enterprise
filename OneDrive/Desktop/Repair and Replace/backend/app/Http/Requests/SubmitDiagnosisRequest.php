<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SubmitDiagnosisRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'diagnosis_notes' => 'required|string',
            'spare_parts' => 'nullable|array',
            'spare_parts.*.part_id' => 'required|exists:parts,id',
            'spare_parts.*.quantity' => 'required|integer|min:1',
        ];
    }
}
