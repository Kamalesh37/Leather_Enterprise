<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMachineRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $quantity = (int) $this->input('quantity', 1);

        return [
            'machine_code' => $quantity > 1 ? 'required|string|max:50' : 'required|string|max:50|unique:machines,machine_code',
            'name' => 'required|string|max:255',
            'model_number' => 'required|string|max:100',
            'serial_number' => $quantity > 1 ? 'required|string|max:100' : 'required|string|max:100|unique:machines,serial_number',
            'quantity' => 'nullable|integer|min:1|max:100',
            'vendor_id' => 'nullable|exists:vendors,id',
            'block_id' => 'nullable|exists:blocks,id',
            'floor_id' => 'nullable|exists:floors,id',
            'line_id' => 'nullable|exists:lines,id',
            'specifications' => 'nullable|array',
            'specifications.*' => 'nullable',
            'image' => 'nullable|image|max:5120',
            'image_url' => 'nullable|string|url',
            'status' => 'nullable|string|in:OPERATIONAL,UNDER_MAINTENANCE,BREAKDOWN,DECOMMISSIONED',
            'installed_at' => 'nullable|date',
        ];
    }

}
