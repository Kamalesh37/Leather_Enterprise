<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RestockInventoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'part_id' => 'required|exists:parts,id',
            'quantity' => 'required|integer|min:1',
            'remarks' => 'nullable|string|max:255',
        ];
    }
}
