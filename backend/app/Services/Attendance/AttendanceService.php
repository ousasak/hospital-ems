<?php

namespace App\Services\Attendance;

use App\Models\AttendanceRecord;
use Carbon\Carbon;
use Exception;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class AttendanceService
{
    public function getRecords(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = AttendanceRecord::with(['employee']);

        if (!empty($filters['date'])) {
            $query->whereDate('attendance_date', $filters['date']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['employee_id'])) {
            $query->where('employee_id', $filters['employee_id']);
        }

        return $query->latest('attendance_date')->paginate($perPage);
    }

    public function checkIn(int|string $employeeId, ?string $time = null, ?string $note = null): AttendanceRecord
    {
        $existing = AttendanceRecord::where('employee_id', $employeeId)
            ->whereDate('attendance_date', Carbon::today())
            ->first();

        if ($existing && $existing->check_in_time) {
            throw new Exception("Employee has already checked in today.", 422);
        }

        $now = $time ? Carbon::parse($time) : Carbon::now();

        return AttendanceRecord::create([
            'employee_id' => $employeeId,
            'attendance_date' => Carbon::today(),
            'check_in_time' => $now->format('H:i:s'),
            'status' => 'present',
            'notes' => $note,
        ]);
    }

    public function checkOut(int|string $employeeId, ?string $time = null, ?string $note = null): AttendanceRecord
    {
        $existing = AttendanceRecord::where('employee_id', $employeeId)
            ->whereDate('attendance_date', Carbon::today())
            ->first();

        if (!$existing || !$existing->check_in_time) {
            throw new Exception("Cannot check out without an active check-in record.", 422);
        }

        $now = $time ? Carbon::parse($time) : Carbon::now();
        $checkInTime = Carbon::parse($existing->attendance_date . ' ' . $existing->check_in_time);
        $totalHours = round($now->diffInMinutes($checkInTime) / 60, 2);

        $existing->update([
            'check_out_time' => $now->format('H:i:s'),
            'working_hours' => $totalHours,
            'notes' => $note ? ($existing->notes . ' | ' . $note) : $existing->notes,
        ]);

        return $existing->fresh();
    }
}
