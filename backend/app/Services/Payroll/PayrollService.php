<?php

namespace App\Services\Payroll;

use App\Models\Payroll;
use App\Models\Payslip;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class PayrollService
{
    public function getBatches(int $perPage = 15): LengthAwarePaginator
    {
        return Payroll::withCount('payslips')->latest()->paginate($perPage);
    }

    public function getBatchById(int|string $id): ?Payroll
    {
        return Payroll::with(['payslips.employee', 'payslips.items'])->find($id);
    }

    public function getPayslipById(int|string $id): ?Payslip
    {
        return Payslip::with(['employee.primaryAssignment.department', 'employee.primaryAssignment.position', 'items'])->find($id);
    }
}

