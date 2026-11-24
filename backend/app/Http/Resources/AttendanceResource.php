<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AttendanceResource extends JsonResource
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
            'date' => $this->date?->toDateString(),
            'check_in' => $this->check_in,
            'check_out' => $this->check_out,
            'status' => $this->status,
            'late_minutes' => $this->late_minutes ?? 0,
            'early_leaving_minutes' => $this->early_leaving_minutes ?? 0,
            'overtime_minutes' => $this->overtime_minutes ?? 0,
            'total_hours' => $this->total_hours ?? 0,
        ];
    }
}

