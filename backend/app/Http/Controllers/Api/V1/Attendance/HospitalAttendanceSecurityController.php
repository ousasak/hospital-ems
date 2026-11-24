<?php

namespace App\Http\Controllers\Api\V1\Attendance;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Models\AttendanceScanLog;
use App\Models\Employee;
use App\Models\HospitalGeofence;
use App\Models\HospitalNetwork;
use App\Models\LeaveRequest;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HospitalAttendanceSecurityController extends Controller
{
    // ==================== HOSPITAL NETWORKS ====================

    public function getNetworks(): JsonResponse
    {
        $networks = HospitalNetwork::orderBy('created_at', 'desc')->get();
        return response()->json($networks);
    }

    public function storeNetwork(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'branch_name' => 'nullable|string|max:100',
            'network_name' => 'required|string|max:100',
            'allowed_ip' => 'nullable|string|max:45',
            'allowed_cidr' => 'nullable|string|max:50',
            'description' => 'nullable|string',
            'status' => 'required|string|in:active,inactive',
        ]);

        if (empty($validated['allowed_ip']) && empty($validated['allowed_cidr'])) {
            return response()->json([
                'message' => 'You must provide at least an Allowed IP or an Allowed CIDR range.',
            ], 422);
        }

        $network = HospitalNetwork::create($validated);

        return response()->json([
            'message' => 'Hospital Wi-Fi Network added successfully.',
            'network' => $network,
        ], 201);
    }

    public function updateNetwork(Request $request, int $id): JsonResponse
    {
        $network = HospitalNetwork::findOrFail($id);

        $validated = $request->validate([
            'branch_name' => 'nullable|string|max:100',
            'network_name' => 'required|string|max:100',
            'allowed_ip' => 'nullable|string|max:45',
            'allowed_cidr' => 'nullable|string|max:50',
            'description' => 'nullable|string',
            'status' => 'required|string|in:active,inactive',
        ]);

        if (empty($validated['allowed_ip']) && empty($validated['allowed_cidr'])) {
            return response()->json([
                'message' => 'You must provide at least an Allowed IP or an Allowed CIDR range.',
            ], 422);
        }

        $network->update($validated);

        return response()->json([
            'message' => 'Hospital Network updated successfully.',
            'network' => $network,
        ]);
    }

    public function destroyNetwork(int $id): JsonResponse
    {
        $network = HospitalNetwork::findOrFail($id);
        $network->delete();

        return response()->json([
            'message' => 'Hospital Network removed successfully.',
        ]);
    }

    // ==================== HOSPITAL GEOFENCES ====================

    public function getGeofences(): JsonResponse
    {
        $geofences = HospitalGeofence::orderBy('created_at', 'desc')->get();
        return response()->json($geofences);
    }

    public function storeGeofence(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'branch_name' => 'nullable|string|max:100',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'radius_meters' => 'required|integer|min:10|max:5000',
            'max_accuracy_meters' => 'required|integer|min:5|max:500',
            'description' => 'nullable|string',
            'status' => 'required|string|in:active,inactive',
        ]);

        $geofence = HospitalGeofence::create($validated);

        return response()->json([
            'message' => 'Hospital Geofence location created successfully.',
            'geofence' => $geofence,
        ], 201);
    }

    public function updateGeofence(Request $request, int $id): JsonResponse
    {
        $geofence = HospitalGeofence::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'branch_name' => 'nullable|string|max:100',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'radius_meters' => 'required|integer|min:10|max:5000',
            'max_accuracy_meters' => 'required|integer|min:5|max:500',
            'description' => 'nullable|string',
            'status' => 'required|string|in:active,inactive',
        ]);

        $geofence->update($validated);

        return response()->json([
            'message' => 'Hospital Geofence location updated successfully.',
            'geofence' => $geofence,
        ]);
    }

    public function destroyGeofence(int $id): JsonResponse
    {
        $geofence = HospitalGeofence::findOrFail($id);
        $geofence->delete();

        return response()->json([
            'message' => 'Hospital Geofence deleted successfully.',
        ]);
    }

    // ==================== SCAN LOGS & SECURITY AUDIT ====================

    public function scanLogs(Request $request): JsonResponse
    {
        $query = AttendanceScanLog::with(['employee.primaryAssignment.department', 'user'])
            ->orderBy('created_at', 'desc');

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        if ($request->filled('status')) {
            $query->where('overall_status', $request->status);
        }

        if ($request->filled('event_type')) {
            $query->where('event_type', $request->event_type);
        }

        if ($request->filled('date')) {
            $query->whereDate('created_at', $request->date);
        }

        $logs = $query->paginate($request->get('per_page', 20));

        return response()->json($logs);
    }

    // ==================== ATTENDANCE KPI STATS ====================

    public function attendanceStats(Request $request): JsonResponse
    {
        $date = $request->get('date', Carbon::today()->toDateString());

        $totalEmployees = Employee::where('employment_status', 'active')->count();

        $records = AttendanceRecord::where('attendance_date', $date)->get();

        $presentToday = $records->whereNotNull('check_in_time')->count();
        $onTime = $records->where('status', 'present')->where('late_minutes', 0)->count();
        $late = $records->where('late_minutes', '>', 0)->count();
        $earlyLeave = $records->where('early_leaving_minutes', '>', 0)->count();

        // Check approved leaves for date
        $onLeave = LeaveRequest::where('status', 'approved')
            ->where('start_date', '<=', $date)
            ->where('end_date', '>=', $date)
            ->count();

        $absent = max(0, $totalEmployees - $presentToday - $onLeave);

        $pendingReview = AttendanceRecord::where('attendance_date', $date)
            ->whereHas('correction', function ($q) {
                $q->where('status', 'pending');
            })->count();

        return response()->json([
            'date' => $date,
            'total_employees' => $totalEmployees,
            'present_today' => $presentToday,
            'on_time' => $onTime,
            'late' => $late,
            'early_leave' => $earlyLeave,
            'on_leave' => $onLeave,
            'absent' => $absent,
            'pending_review' => $pendingReview,
        ]);
    }
}

