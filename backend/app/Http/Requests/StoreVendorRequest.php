<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreVendorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'contact_name' => 'nullable|string|max:255',
            'email' => 'nullable|email',
            'phone' => 'nullable|string|max:50',
            'tax_id' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'machinery_categories' => 'nullable|array',
            'rating' => 'nullable|numeric|between:1.0,5.0',
        ];
    }
}
