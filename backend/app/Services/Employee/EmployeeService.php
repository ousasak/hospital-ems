<?php

namespace App\Services\Employee;

use App\Models\Employee;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class EmployeeService
{
    public function getEmployees(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Employee::with([
            'primaryAssignment.department',
            'primaryAssignment.position',
            'primaryAssignment.workLocation',
            'user',
        ]);

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('employee_code', 'like', "%{$search}%");
            });
        }

        if (!empty($filters['department_id'])) {
            $query->whereHas('primaryAssignment', function ($q) use ($filters) {
                $q->where('department_id', $filters['department_id']);
            });
        }

        if (!empty($filters['status'])) {
            $query->where('employment_status', $filters['status']);
        }

        return $query->latest()->paginate($perPage);
    }

    public function getEmployeeById(int|string $id, array $relations = []): ?Employee
    {
        return Employee::with($relations)->find($id);
    }

    public function createEmployee(array $data): Employee
    {
        return Employee::create($data);
    }

    public function updateEmployee(Employee $employee, array $data): bool
    {
        return $employee->update($data);
    }

    public function deleteEmployee(Employee $employee): bool
    {
        return $employee->delete();
    }

    public function restoreEmployee(int|string $id): bool
    {
        $employee = Employee::onlyTrashed()->find($id);
        return $employee ? (bool) $employee->restore() : false;
    }
}
