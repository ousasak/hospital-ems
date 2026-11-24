<?php

namespace App\Http\Requests\Organization;

use Illuminate\Foundation\Http\FormRequest;

class StoreDepartmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:150',
            'code' => 'nullable|string|max:50',
            'parent_id' => 'nullable|exists:departments,id',
            'manager_id' => 'nullable|exists:employees,id',
            'description' => 'nullable|string',
            'is_active' => 'nullable|boolean',
        ];
    }
}

