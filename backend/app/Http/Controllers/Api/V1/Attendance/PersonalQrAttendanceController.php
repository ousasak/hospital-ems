<?php

namespace App\Http\Controllers\Api\V1\Attendance;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Services\Attendance\PersonalQrAttendanceService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PersonalQrAttendanceController extends Controller
{
    public function __construct(
        protected PersonalQrAttendanceService $attendanceService
    ) {}

    /**
     * Pre-validate employee's personal QR token when opened on smartphone
     */
    public function validateQr(string $token, Request $request): JsonResponse
    {
        $user = $request->user();
        $clientIp = $request->ip();

        $result = $this->attendanceService->validateTokenForEmployee($token, $user, $clientIp);

        return response()->json(array_merge([
            'success' => true,
            'data' => $result,
        ], $result));
    }

    /**
     * Submit personal QR attendance with dual validation (Hospital Wi-Fi IP + GPS Geofence)
     */
    public function submit(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required|string',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'accuracy' => 'nullable|numeric',
            'device_metadata' => 'nullable|string',
        ]);

        $user = $request->user();
        $clientIp = $request->ip();

        $result = $this->attendanceService->submitAttendance(
            $user,
            $request->input('token'),
            $clientIp,
            $request->input('latitude'),
            $request->input('longitude'),
            $request->input('accuracy'),
            $request->input('device_metadata', $request->userAgent())
        );

        return response()->json(array_merge([
            'success' => true,
            'data' => $result,
        ], $result));
    }

    /**
     * Get employee's own today's attendance status
     */
    public function today(Request $request): JsonResponse
    {
        $user = $request->user();
        $employee = $user->employee;

        if (!$employee) {
            return response()->json([
                'success' => false,
                'message' => 'No active employee profile associated with this account.',
                'data' => null,
            ], 404);
        }

        $today = Carbon::today()->toDateString();
        $record = AttendanceRecord::with(['workShift', 'assignment.department'])
            ->where('employee_id', $employee->id)
            ->where('attendance_date', $today)
            ->first();

        $activeShift = $this->attendanceService->resolveShiftForEmployee($employee, Carbon::now());

        $payload = [
            'date' => $today,
            'employee' => [
                'id' => $employee->id,
                'employee_code' => $employee->employee_code,
                'full_name' => $employee->full_name,
                'avatar_url' => $employee->avatar_url,
            ],
            'shift' => $activeShift ? [
                'name' => $activeShift->name,
                'start_time' => $activeShift->start_time,
                'end_time' => $activeShift->end_time,
                'grace_period_minutes' => $activeShift->grace_period_minutes,
            ] : null,
            'attendance' => $record,
            'has_checked_in' => $record && $record->check_in_time !== null,
            'has_checked_out' => $record && $record->check_out_time !== null,
        ];

        return response()->json(array_merge([
            'success' => true,
            'data' => $payload,
        ], $payload));
    }

    /**
     * Get employee's own recent attendance history
     */
    public function history(Request $request): JsonResponse
    {
        $user = $request->user();
        $employee = $user->employee;

        if (!$employee) {
            return response()->json([
                'message' => 'No active employee profile associated with this account.',
            ], 404);
        }

        $records = AttendanceRecord::with('workShift')
            ->where('employee_id', $employee->id)
            ->orderBy('attendance_date', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json($records);
    }
}

