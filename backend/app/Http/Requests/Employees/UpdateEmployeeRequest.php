<?php

namespace App\Http\Requests\Employees;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEmployeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('id');

        return [
            'first_name' => 'sometimes|required|string|max:100',
            'last_name' => 'sometimes|required|string|max:100',
            'email' => "sometimes|required|email|max:255|unique:employees,email,{$id}",
            'phone' => 'nullable|string|max:50',
            'gender' => 'nullable|in:male,female,other',
            'dob' => 'nullable|date',
            'join_date' => 'nullable|date',
            'employment_status' => 'nullable|string',
            'department_id' => 'nullable',
            'position_id' => 'nullable',
            'work_location_id' => 'nullable',
            'employment_type_id' => 'nullable',
            'basic_salary' => 'nullable|numeric|min:0',
        ];
    }
}

