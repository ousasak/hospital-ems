<?php

namespace App\Http\Controllers\Api\V1\Leave;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\LeaveBalance;
use App\Models\LeaveBalanceTransaction;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class LeaveController extends Controller
{
    public function types(): JsonResponse
    {
        return response()->json(LeaveType::orderBy('name')->get());
    }

    public function storeType(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'code' => 'required|string|max:50|unique:leave_types,code',
            'default_days_per_year' => 'required|integer|min:0',
            'is_paid' => 'boolean',
            'requires_attachment' => 'boolean',
            'carry_forward_days' => 'required|integer|min:0',
            'status' => 'required|string|in:active,inactive',
        ]);

        $type = LeaveType::create($validated);
        return response()->json(['message' => 'Leave type created', 'leave_type' => $type], 201);
    }

    public function balances(Request $request): JsonResponse
    {
        $query = LeaveBalance::with(['employee', 'leaveType']);

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        } else {
            $user = $request->user();
            // If normal employee, default to their own balances
            if (!$user->hasRole(['Super Admin', 'HR Manager', 'HR Staff', 'Department Manager']) && $user->employee) {
                $query->where('employee_id', $user->employee->id);
            }
        }

        $year = $request->get('year', Carbon::now()->year);
        $query->where('year', $year);

        return response()->json($query->get());
    }

    public function requests(Request $request): JsonResponse
    {
        $query = LeaveRequest::with(['employee', 'leaveType', 'supervisor', 'hr']);

        $user = $request->user();

        // Role-based visibility
        if ($user->hasRole('Employee') && !$user->hasRole(['Super Admin', 'HR Manager', 'HR Staff', 'Department Manager'])) {
            $empId = $user->employee?->id ?? 0;
            $query->where('employee_id', $empId);
        } elseif ($user->hasRole('Department Manager') && !$user->hasRole(['Super Admin', 'HR Manager', 'HR Staff'])) {
            $mgrEmp = $user->employee;
            if ($mgrEmp) {
                // View requests where manager is the supervisor or within their department
                $query->where(function ($q) use ($mgrEmp) {
                    $q->where('supervisor_id', $mgrEmp->id)
                        ->orWhere('employee_id', $mgrEmp->id);
                });
            }
        }

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('leave_type_id')) {
            $query->where('leave_type_id', $request->leave_type_id);
        }

        $requests = $query->orderBy('created_at', 'desc')->paginate($request->get('per_page', 15));

        return response()->json($requests);
    }

    public function storeRequest(Request $request): JsonResponse
    {
        $user = $request->user();
        $employee = $user->employee;

        if ($request->filled('employee_id') && ($user->hasRole('Super Admin') || $user->hasRole('HR Manager') || $user->hasRole('HR Staff'))) {
            $employee = Employee::findOrFail($request->employee_id);
        }

        if (!$employee) {
            return response()->json(['message' => 'No employee profile associated.'], 404);
        }

        $validated = $request->validate([
            'leave_type_id' => 'required|exists:leave_types,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'is_half_day' => 'boolean',
            'half_day_type' => 'nullable|string|in:morning,afternoon',
            'reason' => 'required|string|max:1000',
            'attachment' => 'nullable|file|max:5120',
        ]);

        $startDate = Carbon::parse($validated['start_date']);
        $endDate = Carbon::parse($validated['end_date']);

        // Check for overlapping approved or pending requests
        $overlap = LeaveRequest::where('employee_id', $employee->id)
            ->whereIn('status', ['pending_supervisor', 'pending_hr', 'approved'])
            ->where(function ($q) use ($startDate, $endDate) {
                $q->whereBetween('start_date', [$startDate->toDateString(), $endDate->toDateString()])
                    ->orWhereBetween('end_date', [$startDate->toDateString(), $endDate->toDateString()])
                    ->orWhere(function ($sub) use ($startDate, $endDate) {
                        $sub->where('start_date', '<=', $startDate->toDateString())
                            ->where('end_date', '>=', $endDate->toDateString());
                    });
            })
            ->exists();

        if ($overlap) {
            throw ValidationException::withMessages([
                'start_date' => ['You already have an active or pending leave request overlapping these dates.'],
            ]);
        }

        // Calculate business days
        $days = 0;
        if ($request->boolean('is_half_day')) {
            $days = 0.50;
        } else {
            $period = CarbonPeriod::create($startDate, $endDate);
            foreach ($period as $date) {
                if (!$date->isWeekend()) {
                    $days += 1.0;
                }
            }
            if ($days == 0) $days = 1.0;
        }

        // Verify balance
        $currentYear = $startDate->year;
        $balance = LeaveBalance::where('employee_id', $employee->id)
            ->where('leave_type_id', $validated['leave_type_id'])
            ->where('year', $currentYear)
            ->first();

        $leaveType = LeaveType::find($validated['leave_type_id']);
        if ($leaveType->is_paid && $balance && $balance->remaining_days < $days) {
            throw ValidationException::withMessages([
                'leave_type_id' => ["Insufficient leave balance. You requested {$days} days but only have {$balance->remaining_days} days remaining."],
            ]);
        }

        // Attachment upload
        $attachmentPath = null;
        if ($request->hasFile('attachment')) {
            $attachmentPath = $request->file('attachment')->store("leave_attachments/{$employee->id}", 'public');
        }

        // Find primary supervisor
        $supervisorId = $employee->primaryAssignment?->supervisor_id;

        return DB::transaction(function () use ($employee, $validated, $days, $attachmentPath, $supervisorId, $balance) {
            $leaveReq = LeaveRequest::create([
                'employee_id' => $employee->id,
                'leave_type_id' => $validated['leave_type_id'],
                'start_date' => $validated['start_date'],
                'end_date' => $validated['end_date'],
                'is_half_day' => $validated['is_half_day'] ?? false,
                'half_day_type' => $validated['half_day_type'] ?? null,
                'total_days' => $days,
                'reason' => $validated['reason'],
                'attachment_path' => $attachmentPath,
                'status' => $supervisorId ? 'pending_supervisor' : 'pending_hr',
                'supervisor_id' => $supervisorId,
            ]);

            // Update pending days on balance
            if ($balance) {
                $balance->increment('pending_days', $days);
                $balance->decrement('remaining_days', $days);
            }

            $leaveReq->load(['employee', 'leaveType', 'supervisor']);

            return response()->json([
                'message' => 'Leave request submitted successfully',
                'leave_request' => $leaveReq,
            ], 201);
        });
    }

    /**
     * Level 1: Supervisor Review
     */
    public function supervisorReview(Request $request, $id): JsonResponse
    {
        $request->validate([
            'status' => 'required|string|in:approved,rejected',
            'notes' => 'nullable|string',
        ]);

        $leaveReq = LeaveRequest::findOrFail($id);
        if ($leaveReq->status !== 'pending_supervisor') {
            return response()->json(['message' => 'Request is not in pending supervisor stage.'], 422);
        }

        return DB::transaction(function () use ($leaveReq, $request) {
            $isApproved = $request->status === 'approved';

            $leaveReq->update([
                'supervisor_status' => $request->status,
                'supervisor_approved_at' => now(),
                'supervisor_notes' => $request->notes,
                'status' => $isApproved ? 'pending_hr' : 'rejected',
            ]);

            // If rejected by supervisor, restore balance
            if (!$isApproved) {
                $balance = LeaveBalance::where('employee_id', $leaveReq->employee_id)
                    ->where('leave_type_id', $leaveReq->leave_type_id)
                    ->where('year', Carbon::parse($leaveReq->start_date)->year)
                    ->first();

                if ($balance) {
                    $balance->decrement('pending_days', $leaveReq->total_days);
                    $balance->increment('remaining_days', $leaveReq->total_days);
                }
            }

            return response()->json([
                'message' => $isApproved ? 'Leave approved by supervisor and routed to HR' : 'Leave request rejected',
                'leave_request' => $leaveReq,
            ]);
        });
    }

    /**
     * Level 2: HR Final Review
     */
    public function hrReview(Request $request, $id): JsonResponse
    {
        $request->validate([
            'status' => 'required|string|in:approved,rejected',
            'notes' => 'nullable|string',
        ]);

        $leaveReq = LeaveRequest::findOrFail($id);
        if (!in_array($leaveReq->status, ['pending_hr', 'pending_supervisor'])) {
            return response()->json(['message' => 'Request is not pending approval.'], 422);
        }

        return DB::transaction(function () use ($leaveReq, $request) {
            $isApproved = $request->status === 'approved';

            $leaveReq->update([
                'hr_id' => $request->user()->id,
                'hr_status' => $request->status,
                'hr_approved_at' => now(),
                'hr_notes' => $request->notes,
                'status' => $isApproved ? 'approved' : 'rejected',
            ]);

            $balance = LeaveBalance::where('employee_id', $leaveReq->employee_id)
                ->where('leave_type_id', $leaveReq->leave_type_id)
                ->where('year', Carbon::parse($leaveReq->start_date)->year)
                ->first();

            if ($balance) {
                $balance->decrement('pending_days', $leaveReq->total_days);

                if ($isApproved) {
                    $balance->increment('used_days', $leaveReq->total_days);

                    // Record balance transaction audit if table exists
                    if (\Illuminate\Support\Facades\Schema::hasTable('leave_balance_transactions')) {
                        LeaveBalanceTransaction::create([
                            'leave_balance_id' => $balance->id,
                            'leave_request_id' => $leaveReq->id,
                            'transaction_type' => 'deducted',
                            'days' => $leaveReq->total_days,
                            'balance_after' => $balance->remaining_days,
                            'notes' => "Approved leave from {$leaveReq->start_date} to {$leaveReq->end_date}",
                        ]);
                    }
                } else {
                    // Restored back to remaining
                    $balance->increment('remaining_days', $leaveReq->total_days);
                }
            }

            return response()->json([
                'message' => $isApproved ? 'Leave request officially approved by HR' : 'Leave request rejected by HR',
                'leave_request' => $leaveReq,
            ]);
        });
    }

    public function cancel(Request $request, $id): JsonResponse
    {
        $leaveReq = LeaveRequest::findOrFail($id);

        if (!in_array($leaveReq->status, ['pending_supervisor', 'pending_hr'])) {
            return response()->json(['message' => 'Only pending leave requests can be cancelled.'], 422);
        }

        return DB::transaction(function () use ($leaveReq) {
            $leaveReq->update(['status' => 'cancelled']);

            $balance = LeaveBalance::where('employee_id', $leaveReq->employee_id)
                ->where('leave_type_id', $leaveReq->leave_type_id)
                ->where('year', Carbon::parse($leaveReq->start_date)->year)
                ->first();

            if ($balance) {
                $balance->decrement('pending_days', $leaveReq->total_days);
                $balance->increment('remaining_days', $leaveReq->total_days);
            }

            return response()->json(['message' => 'Leave request cancelled successfully']);
        });
    }
}

