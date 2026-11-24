<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeaveResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'employee_id' => $this->employee_id,
            'employee' => $this->employee ? [
                'id' => $this->employee->id,
                'name' => trim(($this->employee->first_name ?? '') . ' ' . ($this->employee->last_name ?? '')),
                'employee_code' => $this->employee->employee_code,
            ] : null,
            'leave_type_id' => $this->leave_type_id,
            'leave_type' => $this->leaveType ? [
                'id' => $this->leaveType->id,
                'name' => $this->leaveType->name,
                'color' => $this->leaveType->color,
            ] : null,
            'start_date' => $this->start_date?->toDateString(),
            'end_date' => $this->end_date?->toDateString(),
            'days_count' => $this->days_count,
            'reason' => $this->reason,
            'status' => $this->status,
            'supervisor_approved_at' => $this->supervisor_approved_at?->toIso8601String(),
            'hr_approved_at' => $this->hr_approved_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}

