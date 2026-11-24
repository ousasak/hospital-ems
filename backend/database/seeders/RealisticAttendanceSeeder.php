<?php

namespace Database\Seeders;

use App\Models\AttendanceRecord;
use App\Models\Employee;
use App\Models\WorkShift;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class RealisticAttendanceSeeder extends Seeder
{
    public function run(): void
    {
        $today = Carbon::today();
        $employees = Employee::whereIn('employment_status', ['active', 'probation'])
            ->with('primaryAssignment')
            ->get();

        if ($employees->isEmpty()) {
            return;
        }

        $defaultShift = WorkShift::first() ?? WorkShift::create([
            'name' => 'Standard Office Shift',
            'start_time' => '08:00:00',
            'end_time' => '17:00:00',
        ]);

        // Clean existing attendance records for the last 35 days to prevent duplicates
        $startDate = $today->copy()->subDays(34);
        AttendanceRecord::where('attendance_date', '>=', $startDate->toDateString())->delete();

        // Generate past 30 days up to today
        for ($i = 29; $i >= 0; $i--) {
            $attDate = $today->copy()->subDays($i);
            $isWeekend = $attDate->isWeekend();

            // On weekends, only a subset of hospital staff work (e.g. 10-12 people)
            $workingPool = $isWeekend ? $employees->take(11) : $employees;
            $poolCount = $workingPool->count();

            foreach ($workingPool as $index => $emp) {
                $assignment = $emp->primaryAssignment;

                // Determine attendance status
                // Approx 88% present, 6% late, 4% on_leave, 2% absent
                $rand = ($index * 7 + $i * 13) % 100;

                if ($rand < 88) {
                    $status = 'present';
                    $lateMinutes = 0;
                    $minuteOffset = rand(-15, 0); // checked in 07:45 - 08:00
                    $checkIn = $attDate->copy()->setTime(8, 0, 0)->addMinutes($minuteOffset);
                    $checkOut = $attDate->copy()->setTime(17, rand(0, 30), 0);
                    $workingHours = 8.00 + round(rand(0, 45) / 60, 2);
                } elseif ($rand < 94) {
                    $status = 'late';
                    $lateMinutes = rand(8, 35);
                    $checkIn = $attDate->copy()->setTime(8, $lateMinutes, 0);
                    $checkOut = $attDate->copy()->setTime(17, rand(10, 40), 0);
                    $workingHours = 8.00;
                } elseif ($rand < 98) {
                    $status = 'on_leave';
                    $lateMinutes = 0;
                    $checkIn = null;
                    $checkOut = null;
                    $workingHours = 0.00;
                } else {
                    $status = 'absent';
                    $lateMinutes = 0;
                    $checkIn = null;
                    $checkOut = null;
                    $workingHours = 0.00;
                }

                AttendanceRecord::create([
                    'employee_id' => $emp->id,
                    'assignment_id' => $assignment?->id,
                    'work_shift_id' => $defaultShift->id,
                    'attendance_date' => $attDate->toDateString(),
                    'check_in_time' => $checkIn,
                    'check_out_time' => $checkOut,
                    'working_hours' => $workingHours,
                    'late_minutes' => $lateMinutes,
                    'early_leaving_minutes' => 0,
                    'overtime_hours' => ($workingHours > 8.00) ? round($workingHours - 8.00, 2) : 0.00,
                    'status' => $status,
                    'check_in_method' => 'biometric',
                    'notes' => $status === 'on_leave' ? 'Approved Leave' : ($status === 'late' ? 'Traffic delay' : 'Biometric check-in scan'),
                ]);
            }
        }
    }
}

