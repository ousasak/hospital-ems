<?php

namespace App\Services\Leave;

use App\Models\LeaveBalance;
use App\Models\LeaveRequest;
use Carbon\Carbon;
use Exception;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class LeaveService
{
    public function getRequests(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = LeaveRequest::with(['employee', 'leaveType']);

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['employee_id'])) {
            $query->where('employee_id', $filters['employee_id']);
        }

        return $query->latest()->paginate($perPage);
    }

    public function submitRequest(array $data): LeaveRequest
    {
        $employeeId = $data['employee_id'];
        $leaveTypeId = $data['leave_type_id'];
        $totalDays = (float) ($data['total_days'] ?? $data['days_count'] ?? 1.0);

        // Balance validation check
        $balance = LeaveBalance::where('employee_id', $employeeId)
            ->where('leave_type_id', $leaveTypeId)
            ->where('year', Carbon::now()->year)
            ->first();

        if ($balance && $balance->remaining_days < $totalDays) {
            $leaveTypeName = $balance->leaveType?->name ?? 'Leave';
            throw new Exception("Insufficient {$leaveTypeName} balance. Requested: {$totalDays}, Available: {$balance->remaining_days}.", 422);
        }

        return LeaveRequest::create(array_merge($data, [
            'total_days' => $totalDays,
            'status' => $data['status'] ?? 'pending_supervisor',
            'reason' => $data['reason'] ?? 'Standard leave request',
        ]));
    }
}
