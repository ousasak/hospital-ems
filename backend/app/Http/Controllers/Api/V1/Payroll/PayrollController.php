<?php

namespace App\Http\Controllers\Api\V1\Payroll;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\EmployeeSalary;
use App\Models\Payroll;
use App\Models\PayrollItem;
use App\Models\Payslip;
use App\Models\SalaryStructure;
use App\Models\SystemSetting;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class PayrollController extends Controller
{
    public function structures(): JsonResponse
    {
        if (!Schema::hasTable('salary_structures')) {
            return response()->json([]);
        }
        return response()->json(SalaryStructure::all());
    }

    public function storeStructure(Request $request): JsonResponse
    {
        if (!Schema::hasTable('salary_structures')) {
            return response()->json(['message' => 'Salary structures not supported in this deployment.'], 400);
        }
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'code' => 'required|string|max:50|unique:salary_structures,code',
            'description' => 'nullable|string',
            'currency' => 'required|string|in:USD,KHR',
            'is_active' => 'boolean',
        ]);

        $structure = SalaryStructure::create($validated);
        return response()->json(['message' => 'Salary structure created', 'structure' => $structure], 201);
    }

    public function getEmployeeSalaries($employeeId): JsonResponse
    {
        if (!Schema::hasTable('employee_salaries')) {
            return response()->json([]);
        }
        $salaries = EmployeeSalary::with('salaryStructure')
            ->where('employee_id', $employeeId)
            ->orderBy('effective_date', 'desc')
            ->get();

        return response()->json($salaries);
    }

    public function setEmployeeSalary(Request $request): JsonResponse
    {
        if (!Schema::hasTable('employee_salaries')) {
            return response()->json(['message' => 'Employee salaries not supported in this deployment.'], 400);
        }
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'salary_structure_id' => 'nullable|exists:salary_structures,id',
            'base_salary' => 'required|numeric|min:0',
            'currency' => 'required|string|in:USD,KHR',
            'effective_date' => 'required|date',
            'payment_frequency' => 'required|string|in:monthly,semi-monthly',
        ]);

        return DB::transaction(function () use ($validated) {
            // Mark older salaries as past
            EmployeeSalary::where('employee_id', $validated['employee_id'])
                ->where('status', 'active')
                ->update(['status' => 'past']);

            $salary = EmployeeSalary::create(array_merge($validated, ['status' => 'active']));
            return response()->json(['message' => 'Employee salary updated', 'salary' => $salary], 201);
        });
    }

    public function batches(Request $request): JsonResponse
    {
        if (!Schema::hasTable('payrolls')) {
            return response()->json([
                'current_page' => 1,
                'data' => [],
                'total' => 0,
                'last_page' => 1,
                'per_page' => 12,
            ]);
        }

        $query = Payroll::with(['processor', 'approver'])
            ->withCount('items');

        if ($request->filled('year')) {
            $query->where('year', $request->year);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $batches = $query->orderBy('year', 'desc')->orderBy('month', 'desc')->paginate(12);
        return response()->json($batches);
    }

    public function getBatch($id): JsonResponse
    {
        $payroll = Payroll::with([
            'processor',
            'approver',
            'items.employee.primaryAssignment.department',
            'items.employee.primaryAssignment.position',
            'items.payslip',
        ])->findOrFail($id);

        return response()->json($payroll);
    }

    public function processBatch(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'month' => 'required|integer|between:1,12',
            'year' => 'required|integer|between:2020,2050',
            'currency' => 'required|string|in:USD,KHR',
            'payment_date' => 'required|date',
        ]);

        // Check if payroll batch already exists for this period
        $exists = Payroll::where('month', $validated['month'])
            ->where('year', $validated['year'])
            ->where('currency', $validated['currency'])
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => "A payroll batch already exists for {$validated['month']}/{$validated['year']} ({$validated['currency']}).",
            ], 422);
        }

        $startDate = Carbon::create($validated['year'], $validated['month'], 1)->startOfMonth();
        $endDate = $startDate->copy()->endOfMonth();
        $exchangeRate = (float) SystemSetting::get('usd_khr_exchange_rate', 4100);

        return DB::transaction(function () use ($validated, $startDate, $endDate, $exchangeRate, $request) {
            $monthName = $startDate->format('F Y');
            $payroll = Payroll::create([
                'month' => $validated['month'],
                'year' => $validated['year'],
                'title' => "Payroll Period - {$monthName}",
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'payment_date' => $validated['payment_date'],
                'currency' => $validated['currency'],
                'status' => 'draft',
                'processed_by' => $request->user()->id,
            ]);

            $activeEmployees = Employee::with('currentSalary')
                ->where('employment_status', 'active')
                ->get();

            $totalGross = 0;
            $totalDeductions = 0;
            $totalNet = 0;

            foreach ($activeEmployees as $emp) {
                $baseSalary = $emp->currentSalary?->base_salary ?? 1500.00;
                $allowance = 100.00; // Standard transport/meal allowance
                $overtimePay = 0.00;
                $bonus = 0.00;

                // Calculate tax (Progressive Cambodian tax on salary baseline estimation)
                $gross = $baseSalary + $allowance + $overtimePay + $bonus;
                $tax = 0.00;
                if ($gross > 2000) {
                    $tax = round(($gross - 2000) * 0.10 + (1000 * 0.05), 2);
                } elseif ($gross > 1000) {
                    $tax = round(($gross - 1000) * 0.05, 2);
                }

                $net = $gross - $tax;

                $totalGross += $gross;
                $totalDeductions += $tax;
                $totalNet += $net;

                $item = PayrollItem::create([
                    'payroll_id' => $payroll->id,
                    'employee_id' => $emp->id,
                    'base_salary' => $baseSalary,
                    'allowance_total' => $allowance,
                    'bonus_total' => $bonus,
                    'overtime_pay' => $overtimePay,
                    'deduction_total' => 0.00,
                    'tax_amount' => $tax,
                    'net_salary' => $net,
                    'currency' => $validated['currency'],
                    'exchange_rate' => $exchangeRate,
                    'status' => 'pending',
                ]);

                // Create individual Payslip
                Payslip::create([
                    'payroll_item_id' => $item->id,
                    'payslip_number' => 'PS-' . $payroll->year . '-' . sprintf('%02d', $payroll->month) . '-' . $emp->employee_code,
                    'generated_at' => now(),
                    'status' => 'draft',
                ]);
            }

            $payroll->update([
                'total_gross' => $totalGross,
                'total_deductions' => $totalDeductions,
                'total_net' => $totalNet,
            ]);

            $payroll->load('items.employee');

            return response()->json([
                'message' => "Payroll batch processed for {$activeEmployees->count()} employees.",
                'payroll' => $payroll,
            ], 201);
        });
    }

    public function updateBatchStatus(Request $request, $id): JsonResponse
    {
        $request->validate([
            'status' => 'required|string|in:draft,reviewed,approved,paid',
        ]);

        $payroll = Payroll::with('items.payslip')->findOrFail($id);

        $update = ['status' => $request->status];
        if ($request->status === 'approved') {
            $update['approved_by'] = $request->user()->id;
        } elseif ($request->status === 'paid') {
            $update['paid_at'] = now();
            // Update payslips status to sent
            foreach ($payroll->items as $item) {
                $item->update(['status' => 'paid']);
                $item->payslip?->update(['status' => 'sent']);
            }
        }

        $payroll->update($update);

        return response()->json([
            'message' => "Payroll batch marked as {$request->status}",
            'payroll' => $payroll,
        ]);
    }

    public function getPayslip($id): JsonResponse
    {
        $payslip = Payslip::with([
            'payrollItem.payroll',
            'payrollItem.employee.primaryAssignment.department',
            'payrollItem.employee.primaryAssignment.position',
        ])->findOrFail($id);

        return response()->json($payslip);
    }
}

