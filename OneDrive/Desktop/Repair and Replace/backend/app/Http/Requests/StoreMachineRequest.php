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
        return [
            'machine_code' => 'required|string|max:50|unique:machines,machine_code',
            'name' => 'required|string|max:255',
            'model_number' => 'required|string|max:100',
            'serial_number' => 'required|string|max:100|unique:machines,serial_number',
            'vendor_id' => 'nullable|exists:vendors,id',
            'block_id' => 'nullable|exists:blocks,id',
            'floor_id' => 'nullable|exists:floors,id',
            'line_id' => 'nullable|exists:lines,id',
            'specifications' => 'nullable|array',
            'specifications.motor_specs' => 'nullable|string',
            'specifications.needle_type' => 'nullable|string',
            'specifications.hydraulic_rating' => 'nullable|string',
            'specifications.operating_voltage' => 'nullable|string',
            'specifications.air_pressure_bar' => 'nullable|string',
            'specifications.max_speed_rpm' => 'nullable|string',
            'image' => 'nullable|image|max:5120',
            'image_url' => 'nullable|string|url',
            'status' => 'nullable|string|in:OPERATIONAL,UNDER_MAINTENANCE,BREAKDOWN,DECOMMISSIONED',
            'installed_at' => 'nullable|date',
        ];
    }
}
