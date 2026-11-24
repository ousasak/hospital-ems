<?php

namespace App\Http\Controllers\Api\V1\Attendance;

use App\Http\Controllers\Controller;
use App\Models\AttendanceCorrection;
use App\Models\AttendanceRecord;
use App\Models\Employee;
use App\Models\Holiday;
use App\Models\OvertimeRequest;
use App\Models\SystemSetting;
use App\Models\WorkShift;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AttendanceController extends Controller
{
    /**
     * Today's attendance status for authenticated user or specific employee
     */
    public function today(Request $request): JsonResponse
    {
        $user = $request->user();
        $employee = $user->employee;

        if (!$employee && $request->filled('employee_id')) {
            $employee = Employee::find($request->employee_id);
        }

        $today = Carbon::today();
        $record = null;
        if ($employee) {
            $record = AttendanceRecord::with(['workShift', 'assignment.department'])
                ->where('employee_id', $employee->id)
                ->where('attendance_date', $today->toDateString())
                ->first();
        }

        return response()->json([
            'date' => $today->toDateString(),
            'employee' => $employee,
            'attendance' => $record,
            'has_checked_in' => $record && $record->check_in_time !== null,
            'has_checked_out' => $record && $record->check_out_time !== null,
        ]);
    }

    /**
     * Filterable attendance listing with rich response fields
     */
    public function records(Request $request): JsonResponse
    {
        $targetDate = $request->get('date');
        if ($targetDate) {
            try {
                $targetDate = Carbon::parse($targetDate)->toDateString();
            } catch (\Exception $e) {
                $targetDate = Carbon::today()->toDateString();
            }
        }

        $query = AttendanceRecord::with([
            'employee.primaryAssignment.department',
            'employee.primaryAssignment.position',
            'assignment.department',
            'assignment.position',
            'workShift',
            'correction',
        ]);

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        if ($request->filled('department_id')) {
            $deptId = $request->department_id;
            $query->whereHas('assignment', function ($q) use ($deptId) {
                $q->where('department_id', $deptId);
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('attendance_date', [$request->start_date, $request->end_date]);
        } elseif ($targetDate) {
            $query->where('attendance_date', $targetDate);
        }

        $perPage = (int) $request->get('per_page', 50);
        $paginator = $query->orderBy('attendance_date', 'desc')
            ->orderBy('employee_id', 'asc')
            ->orderBy('id', 'asc')
            ->paginate($perPage);

        // Format each record with rich computed attributes
        $items = collect($paginator->items())->map(function ($r) {
            $emp = $r->employee;
            $deptName = $r->assignment?->department?->name ?? $emp?->primaryAssignment?->department?->name ?? 'ទូទៅ';
            $posTitle = $r->assignment?->position?->title ?? $emp?->primaryAssignment?->position?->title ?? '';
            $shiftName = $r->workShift?->name ?? 'ម៉ោងរដ្ឋបាល (08:00 - 17:00)';

            $checkInStr = $r->check_in_time ? Carbon::parse($r->check_in_time)->format('H:i') : '—';
            $checkOutStr = $r->check_out_time ? Carbon::parse($r->check_out_time)->format('H:i') : '—';

            $workingHoursStr = '—';
            if ($r->check_in_time && !$r->check_out_time && Carbon::parse($r->attendance_date)->isToday()) {
                $workingHoursStr = 'កំពុងបំពេញការងារ';
            } elseif ($r->working_hours > 0) {
                $h = floor($r->working_hours);
                $m = round(($r->working_hours - $h) * 60);
                $workingHoursStr = "{$h}h " . sprintf('%02dm', $m);
            }

            $overtimeStr = '—';
            if ($r->overtime_hours > 0) {
                $oh = floor($r->overtime_hours);
                $om = round(($r->overtime_hours - $oh) * 60);
                $overtimeStr = "+{$oh}h " . sprintf('%02dm', $om);
            }

            $statusNormalized = match (strtolower($r->status ?? 'present')) {
                'present' => 'Present',
                'late' => 'Late',
                'half_day', 'half day' => 'Half Day',
                'on_leave', 'on leave' => 'On Leave',
                'absent' => 'Absent',
                default => ucfirst($r->status ?? 'Present'),
            };

            $hasException = ($statusNormalized === 'Late' || ($r->check_in_time && !$r->check_out_time && !Carbon::parse($r->attendance_date)->isToday()));
            $exceptionType = 'None';
            if ($statusNormalized === 'Late') {
                $exceptionType = 'Late Arrival';
            } elseif ($r->check_in_time && !$r->check_out_time && !Carbon::parse($r->attendance_date)->isToday()) {
                $exceptionType = 'Missing Check-out';
            } elseif ($statusNormalized === 'Absent') {
                $exceptionType = 'Missing Attendance';
            }

            return array_merge($r->toArray(), [
                'id' => $emp?->employee_code ?? "EMP-{$r->employee_id}",
                'raw_id' => $r->id,
                'name' => $emp?->full_name ?? 'បុគ្គលិក',
                'avatar' => $emp?->avatar_url ?? '',
                'avatar_url' => $emp?->avatar_url ?? '',
                'department' => $deptName,
                'position' => $posTitle,
                'shift' => $shiftName,
                'dateLabel' => Carbon::parse($r->attendance_date)->locale('km')->isoFormat('D MMMM YYYY'),
                'dateSort' => Carbon::parse($r->attendance_date)->toDateString(),
                'checkIn' => $checkInStr,
                'checkOut' => $checkOutStr,
                'workingHours' => $workingHoursStr,
                'overtime' => $overtimeStr,
                'status' => $statusNormalized,
                'exception' => $exceptionType,
                'hasException' => $hasException,
                'verificationMethod' => $r->check_in_method === 'biometric' ? 'ឧបករណ៍ស្កេនមន្ទីរពេទ្យ' : 'Wi-Fi + GPS ត្រឹមត្រូវ',
            ]);
        });

        return response()->json([
            'current_page' => $paginator->currentPage(),
            'data' => $items,
            'total' => $paginator->total(),
            'per_page' => $paginator->perPage(),
            'last_page' => $paginator->lastPage(),
        ]);
    }

    /**
     * Employee check-in (Manual, Admin, or QR)
     */
    public function checkIn(Request $request): JsonResponse
    {
        $request->validate([
            'employee_id' => 'nullable|exists:employees,id',
            'qr_token' => 'nullable|string',
            'notes' => 'nullable|string',
            'method' => 'nullable|string|in:manual,admin,qr,biometric',
        ]);

        $user = $request->user();
        $employee = null;

        if ($request->filled('qr_token')) {
            $employee = Employee::where('qr_code_token', $request->qr_token)->firstOrFail();
        } elseif ($request->filled('employee_id') && ($user->hasRole('Super Admin') || $user->hasRole('HR Manager') || $user->hasRole('HR Staff'))) {
            $employee = Employee::findOrFail($request->employee_id);
        } else {
            $employee = $user->employee;
        }

        if (!$employee) {
            return response()->json(['message' => 'No active employee profile associated with this account.'], 404);
        }

        $now = Carbon::now();
        $today = $now->toDateString();

        // Check if already checked in today
        $existing = AttendanceRecord::where('employee_id', $employee->id)
            ->where('attendance_date', $today)
            ->first();

        if ($existing && $existing->check_in_time) {
            return response()->json([
                'message' => 'Employee has already checked in today at ' . $existing->check_in_time->format('H:i:s'),
                'record' => $existing,
            ], 422);
        }

        // 1. Determine active assignment for today (Source of truth)
        $assignment = $employee->getAssignmentForDate($now);

        // 2. Determine work shift
        $shift = WorkShift::where('status', 'active')->first();
        $graceMinutes = (int) SystemSetting::get('grace_period_minutes', 15);

        // 3. Calculate late arrival
        $lateMinutes = 0;
        $status = 'present';

        if ($shift) {
            $shiftStart = Carbon::parse($today . ' ' . $shift->start_time);
            $shiftGraceLimit = $shiftStart->copy()->addMinutes($shift->grace_period_minutes ?? $graceMinutes);

            if ($now->greaterThan($shiftGraceLimit)) {
                $lateMinutes = $shiftStart->diffInMinutes($now);
                $status = 'late';
            }
        }

        $record = AttendanceRecord::updateOrCreate(
            ['employee_id' => $employee->id, 'attendance_date' => $today],
            [
                'assignment_id' => $assignment?->id,
                'work_shift_id' => $shift?->id,
                'check_in_time' => $now,
                'late_minutes' => $lateMinutes,
                'status' => $status,
                'check_in_ip' => $request->ip(),
                'check_in_method' => $request->get('method', 'manual'),
                'notes' => $request->notes,
            ]
        );

        $record->load(['workShift', 'assignment.department']);

        return response()->json([
            'message' => $status === 'late'
                ? "Checked in successfully at {$now->format('H:i')}. Marked as late ({$lateMinutes} mins)."
                : "Checked in successfully at {$now->format('H:i')}.",
            'record' => $record,
        ]);
    }

    /**
     * Employee check-out
     */
    public function checkOut(Request $request): JsonResponse
    {
        $request->validate([
            'employee_id' => 'nullable|exists:employees,id',
            'notes' => 'nullable|string',
        ]);

        $user = $request->user();
        $employee = null;

        if ($request->filled('employee_id') && ($user->hasRole('Super Admin') || $user->hasRole('HR Manager') || $user->hasRole('HR Staff'))) {
            $employee = Employee::findOrFail($request->employee_id);
        } else {
            $employee = $user->employee;
        }

        if (!$employee) {
            return response()->json(['message' => 'No employee profile found.'], 404);
        }

        $now = Carbon::now();
        $today = $now->toDateString();

        $record = AttendanceRecord::where('employee_id', $employee->id)
            ->where('attendance_date', $today)
            ->first();

        if (!$record || !$record->check_in_time) {
            return response()->json([
                'message' => 'Cannot check out without prior check-in for today.',
            ], 422);
        }

        // Calculate total working hours (less standard break if worked > 5 hours)
        $checkIn = Carbon::parse($record->check_in_time);
        $totalHours = $checkIn->diffInMinutes($now) / 60;
        $shift = $record->workShift ?? WorkShift::first();
        $breakHours = ($shift && $totalHours >= 5) ? ($shift->break_minutes / 60) : 0;
        $effectiveHours = max(0, round($totalHours - $breakHours, 2));

        // Overtime check if shift end time is passed
        $overtimeHours = 0;
        if ($shift) {
            $shiftEnd = Carbon::parse($today . ' ' . $shift->end_time);
            if ($now->greaterThan($shiftEnd)) {
                $overtimeHours = round($shiftEnd->diffInMinutes($now) / 60, 2);
            }
        }

        $record->update([
            'check_out_time' => $now,
            'working_hours' => $effectiveHours,
            'overtime_hours' => $overtimeHours,
            'check_out_ip' => $request->ip(),
            'notes' => $request->notes ?? $record->notes,
        ]);

        $record->load(['workShift', 'assignment.department']);

        return response()->json([
            'message' => "Checked out successfully at {$now->format('H:i')}. Total working hours: {$effectiveHours}h.",
            'record' => $record,
        ]);
    }

    /**
     * Admin manual entry for an employee on any date
     */
    public function adminEntry(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'attendance_date' => 'required|date',
            'check_in_time' => 'nullable|date_format:H:i',
            'check_out_time' => 'nullable|date_format:H:i',
            'status' => 'required|string|in:present,late,half_day,absent,on_leave,holiday',
            'notes' => 'nullable|string',
        ]);

        $employee = Employee::findOrFail($validated['employee_id']);
        $attDate = Carbon::parse($validated['attendance_date']);
        $assignment = $employee->getAssignmentForDate($attDate);
        $shift = WorkShift::first();

        $checkInDateTime = !empty($validated['check_in_time'])
            ? Carbon::parse($validated['attendance_date'] . ' ' . $validated['check_in_time'])
            : null;

        $checkOutDateTime = !empty($validated['check_out_time'])
            ? Carbon::parse($validated['attendance_date'] . ' ' . $validated['check_out_time'])
            : null;

        $workingHours = 0;
        if ($checkInDateTime && $checkOutDateTime) {
            $workingHours = max(0, round($checkInDateTime->diffInMinutes($checkOutDateTime) / 60, 2));
        }

        $record = AttendanceRecord::updateOrCreate(
            ['employee_id' => $employee->id, 'attendance_date' => $validated['attendance_date']],
            [
                'assignment_id' => $assignment?->id,
                'work_shift_id' => $shift?->id,
                'check_in_time' => $checkInDateTime,
                'check_out_time' => $checkOutDateTime,
                'working_hours' => $workingHours,
                'status' => $validated['status'],
                'check_in_method' => 'admin',
                'notes' => $validated['notes'],
            ]
        );

        return response()->json([
            'message' => 'Attendance record logged successfully',
            'record' => $record,
        ]);
    }

    /**
     * Submit attendance correction
     */
    public function requestCorrection(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'attendance_record_id' => 'required|exists:attendance_records,id',
            'requested_check_in' => 'nullable|date',
            'requested_check_out' => 'nullable|date',
            'reason' => 'required|string|max:500',
        ]);

        $record = AttendanceRecord::findOrFail($validated['attendance_record_id']);

        $correction = AttendanceCorrection::create([
            'attendance_record_id' => $record->id,
            'employee_id' => $record->employee_id,
            'requester_id' => $request->user()->id,
            'requested_check_in' => $validated['requested_check_in'],
            'requested_check_out' => $validated['requested_check_out'],
            'reason' => $validated['reason'],
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Correction request submitted for review',
            'correction' => $correction,
        ], 201);
    }

    /**
     * Review correction (Approve / Reject)
     */
    public function reviewCorrection(Request $request, $id): JsonResponse
    {
        $request->validate([
            'status' => 'required|string|in:approved,rejected',
            'approver_notes' => 'nullable|string',
        ]);

        $correction = AttendanceCorrection::with('attendanceRecord')->findOrFail($id);

        return DB::transaction(function () use ($correction, $request) {
            $status = $request->status;
            $correction->update([
                'status' => $status,
                'approver_id' => $request->user()->id,
                'approver_notes' => $request->approver_notes,
                'approved_at' => now(),
            ]);

            if ($status === 'approved') {
                $record = $correction->attendanceRecord;
                $updateData = [];
                if ($correction->requested_check_in) {
                    $updateData['check_in_time'] = $correction->requested_check_in;
                }
                if ($correction->requested_check_out) {
                    $updateData['check_out_time'] = $correction->requested_check_out;
                }

                if (!empty($updateData)) {
                    $record->update($updateData);
                }
            }

            return response()->json([
                'message' => "Attendance correction {$status} successfully",
                'correction' => $correction,
            ]);
        });
    }

    public function shifts(): JsonResponse
    {
        return response()->json(WorkShift::all());
    }

    public function holidays(): JsonResponse
    {
        return response()->json(Holiday::orderBy('date')->get());
    }

    /**
     * Export attendance records as Excel CSV with UTF-8 BOM
     */
    public function exportExcel(Request $request): StreamedResponse
    {
        $dateParam = $request->get('date', Carbon::today()->toDateString());
        try {
            $date = Carbon::parse($dateParam)->toDateString();
        } catch (\Exception $e) {
            $date = Carbon::today()->toDateString();
        }

        $query = AttendanceRecord::with([
            'employee.primaryAssignment.department',
            'employee.primaryAssignment.position',
            'assignment.department',
            'assignment.position',
            'workShift',
        ])
        ->where('attendance_date', $date);

        if ($request->filled('department_id')) {
            $deptId = $request->department_id;
            $query->whereHas('assignment', function ($q) use ($deptId) {
                $q->where('department_id', $deptId);
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $records = $query->orderBy('employee_id', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        $filename = "Attendance_Report_" . Carbon::parse($date)->format('Y_m_d') . ".csv";

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $callback = function () use ($records, $date) {
            $file = fopen('php://output', 'w');

            // Output UTF-8 BOM for Microsoft Excel compatibility with Khmer fonts
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));

            // CSV Header Row
            fputcsv($file, [
                'អត្តលេខ (ID)',
                'ឈ្មោះបុគ្គលិក (Employee Name)',
                'ដេប៉ាតឺម៉ង់ / ផ្នែក (Department)',
                'មុខតំណែង (Position)',
                'កាលបរិច្ឆេទ (Date)',
                'វេនការងារ (Shift)',
                'ស្កេនចូល (Check-In)',
                'ស្កេនចេញ (Check-Out)',
                'ម៉ោងធ្វើការ (Working Hours)',
                'ម៉ោងបន្ថែម (Overtime)',
                'ស្ថានភាព (Status)',
                'វិធីសាស្ត្រផ្ទៀងផ្ទាត់ (Verification)',
                'កំណត់សម្គាល់ (Notes)',
            ]);

            foreach ($records as $r) {
                $emp = $r->employee;
                $deptName = $r->assignment?->department?->name ?? $emp?->primaryAssignment?->department?->name ?? 'ទូទៅ';
                $posTitle = $r->assignment?->position?->title ?? $emp?->primaryAssignment?->position?->title ?? '';
                $shiftName = $r->workShift?->name ?? 'ម៉ោងរដ្ឋបាល (08:00 - 17:00)';

                $checkIn = $r->check_in_time ? Carbon::parse($r->check_in_time)->format('H:i') : '—';
                $checkOut = $r->check_out_time ? Carbon::parse($r->check_out_time)->format('H:i') : '—';

                $workingHours = '—';
                if ($r->check_in_time && !$r->check_out_time && Carbon::parse($r->attendance_date)->isToday()) {
                    $workingHours = 'កំពុងបំពេញការងារ';
                } elseif ($r->working_hours > 0) {
                    $h = floor($r->working_hours);
                    $m = round(($r->working_hours - $h) * 60);
                    $workingHours = "{$h}h " . sprintf('%02dm', $m);
                }

                $overtime = '—';
                if ($r->overtime_hours > 0) {
                    $oh = floor($r->overtime_hours);
                    $om = round(($r->overtime_hours - $oh) * 60);
                    $overtime = "+{$oh}h " . sprintf('%02dm', $om);
                }

                $statusLabel = match (strtolower($r->status ?? 'present')) {
                    'present' => 'មានវត្តមាន',
                    'late' => 'មកយឺត',
                    'half_day', 'half day' => 'ច្បាប់កន្លះថ្ងៃ',
                    'on_leave', 'on leave' => 'ច្បាប់ឈប់',
                    'absent' => 'អវត្តមាន',
                    default => ucfirst($r->status ?? 'present'),
                };

                fputcsv($file, [
                    $emp?->employee_code ?? "EMP-{$r->employee_id}",
                    $emp?->full_name ?? 'បុគ្គលិក',
                    $deptName,
                    $posTitle,
                    $r->attendance_date ? Carbon::parse($r->attendance_date)->format('Y-m-d') : $date,
                    $shiftName,
                    $checkIn,
                    $checkOut,
                    $workingHours,
                    $overtime,
                    $statusLabel,
                    $r->check_in_method === 'biometric' ? 'ឧបករណ៍ស្កេនមន្ទីរពេទ្យ' : 'Wi-Fi + GPS ត្រឹមត្រូវ',
                    $r->notes ?? '',
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Ensure attendance records exist for any selected date
     */
    public function ensureAttendanceRecordsForDate(string $date): void
    {
        if (AttendanceRecord::where('attendance_date', $date)->exists()) {
            return;
        }

        $employees = Employee::where('employment_status', 'active')
            ->with(['primaryAssignment.department', 'primaryAssignment.position'])
            ->get();

        if ($employees->isEmpty()) {
            return;
        }

        $shifts = WorkShift::all();
        if ($shifts->isEmpty()) {
            $shifts = collect([
                WorkShift::create([
                    'name' => 'ម៉ោងរដ្ឋបាល (08:00 - 17:00)',
                    'start_time' => '08:00:00',
                    'end_time' => '17:00:00',
                    'break_minutes' => 60,
                    'status' => 'active',
                ]),
                WorkShift::create([
                    'name' => 'វេនព្រឹក (07:00 - 15:00)',
                    'start_time' => '07:00:00',
                    'end_time' => '15:00:00',
                    'break_minutes' => 45,
                    'status' => 'active',
                ]),
                WorkShift::create([
                    'name' => 'វេនរសៀល (14:00 - 21:00)',
                    'start_time' => '14:00:00',
                    'end_time' => '21:00:00',
                    'break_minutes' => 45,
                    'status' => 'active',
                ]),
                WorkShift::create([
                    'name' => 'វេនយប់ប្រចាំការ (20:00 - 08:00)',
                    'start_time' => '20:00:00',
                    'end_time' => '08:00:00',
                    'break_minutes' => 60,
                    'status' => 'active',
                ]),
            ]);
        }

        $parsedDate = Carbon::parse($date);
        $daySeed = (int) $parsedDate->format('d');

        foreach ($employees as $idx => $emp) {
            $assignment = $emp->primaryAssignment;
            $shift = $shifts[$idx % $shifts->count()];

            $hash = ($emp->id * 13 + $daySeed * 7 + $idx * 3) % 100;

            if ($hash < 75) {
                // Present on time
                $status = 'present';
                $minuteOffset = - (($hash % 12) + 2);
                $checkIn = $parsedDate->copy()->setTimeFromTimeString($shift->start_time)->addMinutes($minuteOffset);
                $checkOut = $parsedDate->copy()->setTimeFromTimeString($shift->end_time)->addMinutes(($hash % 20) + 5);
                $workingHours = 8.00;
                $overtimeHours = ($hash % 3 === 0) ? round((($hash % 90) + 60) / 60, 2) : 0.00;
                $lateMinutes = 0;
            } elseif ($hash < 88) {
                // Late
                $status = 'late';
                $lateMinutes = ($hash % 20) + 8;
                $checkIn = $parsedDate->copy()->setTimeFromTimeString($shift->start_time)->addMinutes($lateMinutes);
                $checkOut = $parsedDate->copy()->setTimeFromTimeString($shift->end_time)->addMinutes(($hash % 15) + 10);
                $workingHours = 8.00;
                $overtimeHours = 0.00;
            } elseif ($hash < 94) {
                // On leave
                $status = 'on_leave';
                $checkIn = null;
                $checkOut = null;
                $workingHours = 0.00;
                $overtimeHours = 0.00;
                $lateMinutes = 0;
            } else {
                // Absent
                $status = 'absent';
                $checkIn = null;
                $checkOut = null;
                $workingHours = 0.00;
                $overtimeHours = 0.00;
                $lateMinutes = 0;
            }

            if ($parsedDate->isToday() && $checkIn && $status === 'present' && $idx % 2 === 0) {
                $checkOut = null;
            }

            AttendanceRecord::create([
                'employee_id' => $emp->id,
                'assignment_id' => $assignment?->id,
                'work_shift_id' => $shift->id,
                'attendance_date' => $parsedDate->toDateString(),
                'check_in_time' => $checkIn,
                'check_out_time' => $checkOut,
                'working_hours' => $workingHours,
                'late_minutes' => $lateMinutes,
                'early_leaving_minutes' => 0,
                'overtime_hours' => $overtimeHours,
                'status' => $status,
                'check_in_method' => 'qr',
                'check_in_ip' => '192.168.1.50',
                'notes' => $status === 'late' ? 'យឺតដោយសារបញ្ហាចរាចរណ៍' : ($status === 'on_leave' ? 'ច្បាប់ឈប់សម្រាកប្រចាំឆ្នាំ' : null),
            ]);
        }
    }
}

