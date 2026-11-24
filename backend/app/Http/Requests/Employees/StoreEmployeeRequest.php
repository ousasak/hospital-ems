<?php

namespace App\Http\Requests\Employees;

use Illuminate\Foundation\Http\FormRequest;

class StoreEmployeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'email' => 'required|email|max:255|unique:employees,email',
            'phone' => 'nullable|string|max:50',
            'gender' => 'required|in:male,female,other',
            'dob' => 'nullable|date',
            'join_date' => 'required|date',
            'employment_status' => 'nullable|string',
            'department_id' => 'required',
            'position_id' => 'required',
            'work_location_id' => 'nullable',
            'employment_type_id' => 'nullable',
            'basic_salary' => 'nullable|numeric|min:0',
        ];
    }
}

