<?php

namespace App\Services\Attendance;

use App\Models\AttendanceRecord;
use App\Models\AttendanceScanLog;
use App\Models\Employee;
use App\Models\EmployeeQrCode;
use App\Models\SystemSetting;
use App\Models\User;
use App\Models\WorkShift;
use App\Models\WorkShiftAssignment;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PersonalQrAttendanceService
{
    public function __construct(
        protected NetworkValidationService $networkValidator,
        protected GeofenceValidationService $geofenceValidator
    ) {}

    /**
     * Validate an employee's personal QR token before attendance submission
     */
    public function validateTokenForEmployee(string $token, User $user, string $clientIp): array
    {
        $tokenHash = hash('sha256', trim($token));

        $qrCode = EmployeeQrCode::with('employee.primaryAssignment.department', 'employee.primaryAssignment.position')
            ->where('token_hash', $tokenHash)
            ->first();

        if (!$qrCode) {
            $this->logSecurityEvent(
                null,
                $user,
                null,
                'qr_validate',
                $clientIp,
                null,
                null,
                null,
                null,
                'failed',
                'skipped',
                'rejected',
                'Invalid QR Code: Token does not exist.',
                null
            );

            throw ValidationException::withMessages([
                'token' => ['Invalid or unrecognised Employee QR Code.'],
            ]);
        }

        if ($qrCode->status !== 'active') {
            $this->logSecurityEvent(
                $qrCode->employee,
                $user,
                $qrCode,
                'qr_validate',
                $clientIp,
                null,
                null,
                null,
                null,
                'failed',
                'skipped',
                'rejected',
                "QR Code is {$qrCode->status} (revoked or expired).",
                null
            );

            throw ValidationException::withMessages([
                'token' => ["This QR Code has been {$qrCode->status} and can no longer be used."],
            ]);
        }

        $employee = $user->employee;
        if (!$employee) {
            $this->logSecurityEvent(
                $qrCode->employee,
                $user,
                $qrCode,
                'qr_validate',
                $clientIp,
                null,
                null,
                null,
                null,
                'failed',
                'skipped',
                'rejected',
                'Authenticated user has no associated employee profile.',
                null
            );

            throw ValidationException::withMessages([
                'employee' => ['Your user account is not associated with an active employee profile.'],
            ]);
        }

        // Strict ownership check
        if ($qrCode->employee_id !== $employee->id) {
            $this->logSecurityEvent(
                $employee,
                $user,
                $qrCode,
                'qr_validate',
                $clientIp,
                null,
                null,
                null,
                null,
                'failed',
                'skipped',
                'rejected',
                "Security Alert: QR Code belongs to employee {$qrCode->employee->employee_code}, but scanned by user {$user->name} (Employee {$employee->employee_code}).",
                null
            );

            throw ValidationException::withMessages([
                'ownership' => ['Security Alert: This Personal QR Code belongs to another employee. You can only scan your own ID Card QR Code.'],
            ]);
        }

        if (in_array($employee->employment_status, ['inactive', 'resigned', 'terminated'])) {
            throw ValidationException::withMessages([
                'status' => ['Your employee status is currently inactive. Please contact HR.'],
            ]);
        }

        // Check active shift & today's attendance state
        $today = Carbon::today()->toDateString();
        $record = AttendanceRecord::with('workShift')
            ->where('employee_id', $employee->id)
            ->whereDate('attendance_date', $today)
            ->first();

        $activeShift = $this->resolveShiftForEmployee($employee, Carbon::now());

        // Preliminary network check result for UX display
        $networkCheck = $this->networkValidator->validateIp($clientIp);

        return [
            'valid' => true,
            'employee' => [
                'id' => $employee->id,
                'employee_code' => $employee->employee_code,
                'first_name' => $employee->first_name,
                'last_name' => $employee->last_name,
                'full_name' => $employee->full_name,
                'avatar_url' => $employee->avatar_url,
                'department' => $employee->primaryAssignment?->department?->name ?? 'Hospital Staff',
                'position' => $employee->primaryAssignment?->position?->title ?? 'Medical Personnel',
            ],
            'qr_code' => [
                'id' => $qrCode->id,
                'status' => $qrCode->status,
                'generated_at' => $qrCode->generated_at->toIso8601String(),
            ],
            'shift' => $activeShift ? [
                'id' => $activeShift->id,
                'name' => $activeShift->name,
                'code' => $activeShift->code,
                'start_time' => $activeShift->start_time,
                'end_time' => $activeShift->end_time,
                'grace_period_minutes' => $activeShift->grace_period_minutes,
                'is_overnight' => $activeShift->is_overnight,
            ] : null,
            'today_record' => $record ? [
                'id' => $record->id,
                'attendance_date' => $record->attendance_date->toDateString(),
                'check_in_time' => $record->check_in_time?->toIso8601String(),
                'check_out_time' => $record->check_out_time?->toIso8601String(),
                'working_hours' => $record->working_hours,
                'status' => $record->status,
                'has_checked_in' => $record->check_in_time !== null,
                'has_checked_out' => $record->check_out_time !== null,
            ] : [
                'has_checked_in' => false,
                'has_checked_out' => false,
            ],
            'suggested_action' => (!$record || !$record->check_in_time) ? 'check_in' : (($record && !$record->check_out_time) ? 'check_out' : 'completed'),
            'network_precheck' => [
                'client_ip' => $clientIp,
                'is_authorized_hospital_wifi' => $networkCheck['valid'],
                'message' => $networkCheck['message'],
            ],
        ];
    }

    /**
     * Submit QR attendance with mandatory dual validation (Hospital Wi-Fi IP + GPS Geofence)
     */
    public function submitAttendance(
        User $user,
        string $token,
        string $clientIp,
        mixed $latitude,
        mixed $longitude,
        mixed $accuracy,
        ?string $deviceMetadata = null
    ): array {
        $tokenHash = hash('sha256', trim($token));

        $qrCode = EmployeeQrCode::where('token_hash', $tokenHash)->first();

        if (!$qrCode || $qrCode->status !== 'active') {
            $this->logSecurityEvent(
                $user->employee,
                $user,
                $qrCode,
                'rejected',
                $clientIp,
                $latitude,
                $longitude,
                $accuracy,
                null,
                'failed',
                'skipped',
                'rejected',
                'Invalid or revoked QR Code token.',
                $deviceMetadata
            );

            throw ValidationException::withMessages([
                'token' => ['Invalid, revoked, or expired QR Code.'],
            ]);
        }

        $employee = $user->employee;
        if (!$employee) {
            throw ValidationException::withMessages([
                'employee' => ['No employee profile associated with authenticated user.'],
            ]);
        }

        // QR Ownership verification
        if ($qrCode->employee_id !== $employee->id) {
            $this->logSecurityEvent(
                $employee,
                $user,
                $qrCode,
                'rejected',
                $clientIp,
                $latitude,
                $longitude,
                $accuracy,
                null,
                'failed',
                'skipped',
                'rejected',
                'Identity mismatch: QR code does not belong to authenticated user.',
                $deviceMetadata
            );

            throw ValidationException::withMessages([
                'ownership' => ['Security Alert: This Personal QR Code belongs to another employee.'],
            ]);
        }

        // Step 1: Hospital Wi-Fi Source IP validation (Mandatory hospital security)
        $networkResult = $this->networkValidator->validateIp($clientIp);
        if (!$networkResult['valid']) {
            $this->logSecurityEvent(
                $employee,
                $user,
                $qrCode,
                'rejected',
                $clientIp,
                $latitude,
                $longitude,
                $accuracy,
                null,
                'failed',
                'skipped',
                'rejected',
                $networkResult['message'],
                $deviceMetadata
            );

            throw ValidationException::withMessages([
                'network' => [$networkResult['message']],
            ]);
        }

        // Step 2: GPS Geofence validation (Mandatory hospital security)
        $geoResult = $this->geofenceValidator->validateLocation($latitude, $longitude, $accuracy);
        if (!$geoResult['valid']) {
            $this->logSecurityEvent(
                $employee,
                $user,
                $qrCode,
                'rejected',
                $clientIp,
                $latitude,
                $longitude,
                $accuracy,
                $geoResult['distance_meters'],
                'passed',
                'failed',
                'rejected',
                $geoResult['message'],
                $deviceMetadata
            );

            throw ValidationException::withMessages([
                'location' => [$geoResult['message']],
            ]);
        }

        $now = Carbon::now();
        $today = $now->toDateString();

        // Perform Database Transaction with lock for check-in / check-out
        return DB::transaction(function () use (
            $employee,
            $user,
            $qrCode,
            $clientIp,
            $latitude,
            $longitude,
            $accuracy,
            $deviceMetadata,
            $networkResult,
            $geoResult,
            $now,
            $today
        ) {
            // Lock existing attendance record for today to prevent concurrent double-punch
            $record = AttendanceRecord::where('employee_id', $employee->id)
                ->whereDate('attendance_date', $today)
                ->lockForUpdate()
                ->first();

            $shift = $this->resolveShiftForEmployee($employee, $now);

            // Determine Action (Check-in vs Check-out)
            if (!$record || $record->check_in_time === null) {
                // ==================== CHECK-IN ====================
                $lateMinutes = 0;
                $status = 'present';
                $timingStatus = 'on_time';
                $timingNote = 'ទាន់ម៉ោង (On Time)';

                $allowUnscheduled = filter_var(SystemSetting::get('allow_unscheduled_punch', 'true'), FILTER_VALIDATE_BOOLEAN);
                $earlyWindow = (int) SystemSetting::get('early_checkin_window_minutes', 60);

                if ($shift) {
                    $shiftStart = Carbon::parse($today . ' ' . $shift->start_time);
                    $gracePeriod = $shift->grace_period_minutes ?? (int) SystemSetting::get('grace_period_minutes', 15);
                    $graceLimit = $shiftStart->copy()->addMinutes($gracePeriod);

                    // Check if scanning too early before shift starts
                    if ($earlyWindow > 0 && $now->lessThan($shiftStart->copy()->subMinutes($earlyWindow))) {
                        $diffMins = (int) $now->diffInMinutes($shiftStart);
                        throw ValidationException::withMessages([
                            'shift' => ["មិនទាន់ដល់ម៉ោងចូលវេនទេ។ អ្នកអាចស្កេនចូលមុនវេនបានច្រើនបំផុត {$earlyWindow} នាទី (វេនចាប់ផ្តើមម៉ោង {$shift->start_time})។"],
                        ]);
                    }

                    if ($now->greaterThan($graceLimit)) {
                        $lateMinutes = (int) $shiftStart->diffInMinutes($now);
                        $status = 'late';
                        $timingStatus = 'late';
                        $timingNote = "មកយឺត {$lateMinutes} នាទី";
                    } elseif ($now->lessThan($shiftStart)) {
                        $timingStatus = 'early';
                        $earlyMins = (int) $now->diffInMinutes($shiftStart);
                        $timingNote = "មកមុនម៉ោង {$earlyMins} នាទី";
                    }
                } else {
                    if (!$allowUnscheduled) {
                        throw ValidationException::withMessages([
                            'shift' => ['អ្នកមិនមានកាលវិភាគវេនការងារសម្រាប់ថ្ងៃនេះទេ ហើយប្រព័ន្ធមិនអនុញ្ញាតឱ្យស្កេនក្រៅវេនឡើយ។'],
                        ]);
                    }
                    $timingStatus = 'unscheduled';
                    $timingNote = 'ក្រៅវេនកំណត់ (Unscheduled)';
                }

                if ($record) {
                    $record->update([
                        'assignment_id' => $employee->getAssignmentForDate($now)?->id,
                        'work_shift_id' => $shift?->id,
                        'qr_code_id' => $qrCode->id,
                        'check_in_time' => $now,
                        'late_minutes' => $lateMinutes,
                        'status' => $status,
                        'check_in_ip' => $clientIp,
                        'check_in_method' => 'qr',
                        'check_in_latitude' => $latitude,
                        'check_in_longitude' => $longitude,
                        'check_in_accuracy' => $accuracy,
                        'check_in_distance_meters' => $geoResult['distance_meters'],
                    ]);
                } else {
                    $record = AttendanceRecord::create([
                        'employee_id' => $employee->id,
                        'attendance_date' => $today,
                        'assignment_id' => $employee->getAssignmentForDate($now)?->id,
                        'work_shift_id' => $shift?->id,
                        'qr_code_id' => $qrCode->id,
                        'check_in_time' => $now,
                        'late_minutes' => $lateMinutes,
                        'status' => $status,
                        'check_in_ip' => $clientIp,
                        'check_in_method' => 'qr',
                        'check_in_latitude' => $latitude,
                        'check_in_longitude' => $longitude,
                        'check_in_accuracy' => $accuracy,
                        'check_in_distance_meters' => $geoResult['distance_meters'],
                    ]);
                }

                $record->load(['workShift', 'assignment.department']);

                $this->logSecurityEvent(
                    $employee,
                    $user,
                    $qrCode,
                    'check_in',
                    $clientIp,
                    $latitude,
                    $longitude,
                    $accuracy,
                    $geoResult['distance_meters'],
                    'passed',
                    'passed',
                    'success',
                    null,
                    $deviceMetadata
                );

                return [
                    'action' => 'check_in',
                    'status' => $status,
                    'timing_status' => $timingStatus,
                    'timing_note' => $timingNote,
                    'late_minutes' => $lateMinutes,
                    'time' => $now->format('H:i:s'),
                    'time_formatted' => $now->format('h:i:s A'),
                    'date' => $today,
                    'message' => $status === 'late'
                        ? "Checked in at {$now->format('h:i A')}. Marked as late by {$lateMinutes} minutes."
                        : "Checked in successfully at {$now->format('h:i A')} ({$timingNote}).",
                    'message_kh' => "បានចុះវត្តមានចូលជោគជ័យនៅម៉ោង {$now->format('h:i A')} ({$timingNote})",
                    'employee' => [
                        'id' => $employee->id,
                        'employee_code' => $employee->employee_code,
                        'full_name' => $employee->full_name,
                        'avatar_url' => $employee->avatar_url,
                        'department' => $employee->primaryAssignment?->department?->name ?? 'Hospital Staff',
                        'position' => $employee->primaryAssignment?->position?->title ?? 'Staff',
                    ],
                    'shift' => $shift ? [
                        'name' => $shift->name,
                        'start_time' => $shift->start_time,
                        'end_time' => $shift->end_time,
                    ] : null,
                    'record' => $record,
                    'network' => $networkResult['network']?->network_name,
                    'geofence' => $geoResult['geofence']?->name,
                    'distance_meters' => $geoResult['distance_meters'],
                ];
            }

            if ($record->check_in_time !== null && $record->check_out_time === null) {
                // ==================== CHECK-OUT ====================
                $checkIn = Carbon::parse($record->check_in_time);
                $minInterval = (int) SystemSetting::get('min_punch_interval_minutes', 5);
                $diffMinutes = $checkIn->diffInMinutes($now);

                // Prevent accidental immediate double punch within cooldown interval
                if ($diffMinutes < $minInterval) {
                    $remainingSecs = ($minInterval * 60) - $checkIn->diffInSeconds($now);
                    $remainingMins = max(1, (int) ceil($remainingSecs / 60));
                    throw ValidationException::withMessages([
                        'duplicate' => ["អ្នកបានចុះវត្តមានចូលរួចរាល់ហើយនៅម៉ោង {$checkIn->format('h:i A')}។ សូមរង់ចាំយ៉ាងតិច {$remainingMins} នាទីទៀតមុននឹងចុះវត្តមានចេញ។"],
                    ]);
                }

                $totalHours = $checkIn->diffInMinutes($now) / 60.0;
                $breakHours = ($shift && $totalHours >= 5.0) ? ($shift->break_minutes / 60.0) : 0.0;
                $effectiveHours = max(0.0, round($totalHours - $breakHours, 2));

                $earlyLeaving = 0;
                $overtimeHours = 0.0;
                $timingStatus = 'on_time';
                $timingNote = 'ទាន់ម៉ោង';

                if ($shift) {
                    $shiftEnd = Carbon::parse($today . ' ' . $shift->end_time);
                    if ($now->lessThan($shiftEnd)) {
                        $earlyLeaving = (int) $now->diffInMinutes($shiftEnd);
                        $timingStatus = 'early_leave';
                        $timingNote = "ចេញមុនម៉ោង {$earlyLeaving} នាទី";
                    } elseif ($now->greaterThan($shiftEnd->copy()->addMinutes(15))) {
                        $overtimeHours = round($shiftEnd->diffInMinutes($now) / 60.0, 2);
                        $timingStatus = 'overtime';
                        $timingNote = "ថែមម៉ោង {$overtimeHours} ម៉ោង";
                    }
                }

                $record->update([
                    'check_out_time' => $now,
                    'check_out_ip' => $clientIp,
                    'check_out_latitude' => $latitude,
                    'check_out_longitude' => $longitude,
                    'check_out_accuracy' => $accuracy,
                    'check_out_distance_meters' => $geoResult['distance_meters'],
                    'working_hours' => $effectiveHours,
                    'early_leaving_minutes' => $earlyLeaving,
                    'overtime_hours' => $overtimeHours,
                ]);

                $record->load(['workShift', 'assignment.department']);

                $this->logSecurityEvent(
                    $employee,
                    $user,
                    $qrCode,
                    'check_out',
                    $clientIp,
                    $latitude,
                    $longitude,
                    $accuracy,
                    $geoResult['distance_meters'],
                    'passed',
                    'passed',
                    'success',
                    null,
                    $deviceMetadata
                );

                return [
                    'action' => 'check_out',
                    'status' => 'present',
                    'timing_status' => $timingStatus,
                    'timing_note' => $timingNote,
                    'time' => $now->format('H:i:s'),
                    'time_formatted' => $now->format('h:i:s A'),
                    'date' => $today,
                    'working_hours' => $effectiveHours,
                    'overtime_hours' => $overtimeHours,
                    'early_leaving_minutes' => $earlyLeaving,
                    'message' => "Checked out successfully at {$now->format('h:i A')}. Total working hours: {$effectiveHours}h.",
                    'message_kh' => "បានចុះវត្តមានចេញជោគជ័យនៅម៉ោង {$now->format('h:i A')} ({$timingNote}) — ម៉ោងធ្វើការ: {$effectiveHours} ម៉ោង",
                    'employee' => [
                        'id' => $employee->id,
                        'employee_code' => $employee->employee_code,
                        'full_name' => $employee->full_name,
                        'avatar_url' => $employee->avatar_url,
                        'department' => $employee->primaryAssignment?->department?->name ?? 'Hospital Staff',
                        'position' => $employee->primaryAssignment?->position?->title ?? 'Staff',
                    ],
                    'shift' => $shift ? [
                        'name' => $shift->name,
                        'start_time' => $shift->start_time,
                        'end_time' => $shift->end_time,
                    ] : null,
                    'record' => $record,
                    'network' => $networkResult['network']?->network_name,
                    'geofence' => $geoResult['geofence']?->name,
                    'distance_meters' => $geoResult['distance_meters'],
                ];
            }

            // ==================== BOTH COMPLETED: DUPLICATE REJECT ====================
            $this->logSecurityEvent(
                $employee,
                $user,
                $qrCode,
                'rejected',
                $clientIp,
                $latitude,
                $longitude,
                $accuracy,
                $geoResult['distance_meters'],
                'passed',
                'passed',
                'rejected',
                'Duplicate attendance submission rejected: Both Check-in and Check-out already recorded today.',
                $deviceMetadata
            );

            throw ValidationException::withMessages([
                'duplicate' => [
                    "បានបញ្ចប់ការចុះវត្តមានសម្រាប់ថ្ងៃនេះរួចរាល់ហើយ (ចូលម៉ោង " . 
                    Carbon::parse($record->check_in_time)->format('h:i A') . 
                    " — ចេញម៉ោង " . 
                    Carbon::parse($record->check_out_time)->format('h:i A') . ")"
                ],
            ]);
        });
    }

    /**
     * Resolve employee's shift for a specific date
     */
    public function resolveShiftForEmployee(Employee $employee, Carbon $date): ?WorkShift
    {
        $d = $date->toDateString();

        $assignment = WorkShiftAssignment::where('employee_id', $employee->id)
            ->where('start_date', '<=', $d)
            ->where(function ($q) use ($d) {
                $q->whereNull('end_date')
                    ->orWhere('end_date', '>=', $d);
            })
            ->where('is_active', true)
            ->with('workShift')
            ->first();

        if ($assignment && $assignment->workShift) {
            return $assignment->workShift;
        }

        return WorkShift::where('status', 'active')->first();
    }

    /**
     * Audit log helper
     */
    protected function logSecurityEvent(
        ?Employee $employee,
        ?User $user,
        ?EmployeeQrCode $qrCode,
        string $eventType,
        string $sourceIp,
        mixed $latitude,
        mixed $longitude,
        mixed $accuracy,
        mixed $distance,
        string $networkStatus,
        string $locationStatus,
        string $overallStatus,
        ?string $failureReason,
        ?string $deviceMetadata
    ): AttendanceScanLog {
        return AttendanceScanLog::create([
            'employee_id' => $employee?->id,
            'user_id' => $user?->id,
            'qr_code_id' => $qrCode?->id,
            'event_type' => $eventType,
            'source_ip' => $sourceIp,
            'latitude' => is_numeric($latitude) ? (float) $latitude : null,
            'longitude' => is_numeric($longitude) ? (float) $longitude : null,
            'accuracy' => is_numeric($accuracy) ? (float) $accuracy : null,
            'geofence_distance' => is_numeric($distance) ? (float) $distance : null,
            'network_validation_status' => $networkStatus,
            'location_validation_status' => $locationStatus,
            'overall_status' => $overallStatus,
            'failure_reason' => $failureReason,
            'device_metadata' => $deviceMetadata,
        ]);
    }
}
