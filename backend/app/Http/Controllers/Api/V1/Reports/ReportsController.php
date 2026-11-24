<?php

namespace App\Http\Controllers\Api\V1\Reports;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Services\Reports\ReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportsController extends Controller
{
    protected ReportService $reportService;

    public function __construct(ReportService $reportService)
    {
        $this->reportService = $reportService;
    }

    /**
     * 1. Overview / Executive KPI Summary
     */
    public function summary(Request $request): JsonResponse
    {
        if ($denied = $this->checkReportAccess($request, 'general')) {
            return $denied;
        }

        $scopedDeptIds = $this->getScopedDepartmentIds($request);
        $filters = $request->only(['start_date', 'end_date', 'department_id']);

        $data = $this->reportService->getSummary($filters, $scopedDeptIds, $request->user());

        return response()->json($data);
    }

    /**
     * 2. Workforce Analytics
     */
    public function workforceReport(Request $request): JsonResponse
    {
        if ($denied = $this->checkReportAccess($request, 'general')) {
            return $denied;
        }

        $scopedDeptIds = $this->getScopedDepartmentIds($request);
        $filters = $request->only(['department_id']);

        $data = $this->reportService->getWorkforceAnalytics($filters, $scopedDeptIds);

        return response()->json($data);
    }

    /**
     * 3. Attendance Analytics
     */
    public function attendanceReport(Request $request): JsonResponse
    {
        if ($denied = $this->checkReportAccess($request, 'general')) {
            return $denied;
        }

        $scopedDeptIds = $this->getScopedDepartmentIds($request);
        $filters = $request->only(['start_date', 'end_date', 'department_id', 'status']);

        $data = $this->reportService->getAttendanceAnalytics($filters, $scopedDeptIds);

        return response()->json($data);
    }

    /**
     * 4. Leave Analytics
     */
    public function leaveReport(Request $request): JsonResponse
    {
        if ($denied = $this->checkReportAccess($request, 'general')) {
            return $denied;
        }

        $scopedDeptIds = $this->getScopedDepartmentIds($request);
        $filters = $request->only(['year', 'start_date', 'end_date', 'department_id', 'status']);

        $data = $this->reportService->getLeaveAnalytics($filters, $scopedDeptIds);

        return response()->json($data);
    }

    /**
     * 5. Shift & Scheduling Analytics
     */
    public function shiftReport(Request $request): JsonResponse
    {
        if ($denied = $this->checkReportAccess($request, 'general')) {
            return $denied;
        }

        $scopedDeptIds = $this->getScopedDepartmentIds($request);
        $filters = $request->only(['start_date', 'end_date', 'department_id']);

        $data = $this->reportService->getShiftAnalytics($filters, $scopedDeptIds);

        return response()->json($data);
    }

    /**
     * 6. Payroll Analytics (Strictly role-protected)
     */
    public function payrollReport(Request $request): JsonResponse
    {
        if ($denied = $this->checkReportAccess($request, 'payroll')) {
            return $denied;
        }

        $scopedDeptIds = $this->getScopedDepartmentIds($request);
        $filters = $request->only(['year', 'department_id']);

        $data = $this->reportService->getPayrollAnalytics($filters, $scopedDeptIds, $request->user());

        return response()->json($data);
    }

    /**
     * 7. Detailed Reports & Underlying Records (Backend Paginated)
     */
    public function detailedRecords(Request $request): JsonResponse
    {
        $category = $request->get('category', 'attendance');

        if ($category === 'payroll') {
            if ($denied = $this->checkReportAccess($request, 'payroll')) {
                return $denied;
            }
        } else {
            if ($denied = $this->checkReportAccess($request, 'general')) {
                return $denied;
            }
        }

        $scopedDeptIds = $this->getScopedDepartmentIds($request);
        $filters = $request->only(['start_date', 'end_date', 'date', 'department_id', 'status', 'search']);
        $perPage = (int) $request->get('per_page', 15);
        $page = (int) $request->get('page', 1);
        $sortBy = $request->get('sort_by');
        $sortDir = $request->get('sort_dir', 'desc');

        $data = $this->reportService->getDetailedRecords(
            $category,
            $filters,
            $perPage,
            $page,
            $scopedDeptIds,
            $sortBy,
            $sortDir
        );

        return response()->json($data);
    }

    /**
     * 8. Server-Side Export CSV
     */
    public function exportReport(Request $request): StreamedResponse|JsonResponse
    {
        $category = $request->get('category', 'attendance');

        if ($category === 'payroll') {
            if ($denied = $this->checkReportAccess($request, 'payroll')) {
                return $denied;
            }
        } else {
            if ($denied = $this->checkReportAccess($request, 'general')) {
                return $denied;
            }
        }

        $scopedDeptIds = $this->getScopedDepartmentIds($request);
        $filters = $request->only(['start_date', 'end_date', 'date', 'department_id', 'status', 'search']);
        $lang = $request->get('lang', 'kh');

        return $this->reportService->exportCsv($category, $filters, $scopedDeptIds, $lang);
    }

    /**
     * Access control checker based on user roles and permissions
     */
    protected function checkReportAccess(Request $request, string $category = 'general'): ?JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        if ($user->hasRole('Super Admin')) {
            return null;
        }

        if ($category === 'payroll') {
            if ($user->hasRole('Accountant') || $user->hasPermissionTo('view payroll')) {
                return null;
            }
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: Only authorized financial personnel can view payroll reports.',
            ], 403);
        }

        // General report roles
        $authorizedRoles = ['Super Admin', 'HR Manager', 'HR Staff', 'Department Manager', 'Accountant'];
        if ($user->hasAnyRole($authorizedRoles) || $user->hasPermissionTo('view reports')) {
            return null;
        }

        return response()->json([
            'success' => false,
            'message' => 'Unauthorized: You do not have permission to view enterprise reports.',
        ], 403);
    }

    /**
     * Resolve permitted department scope
     */
    protected function getScopedDepartmentIds(Request $request): ?array
    {
        $user = $request->user();
        if (!$user) {
            return [-1];
        }

        // Super Admin and HR have organization-wide visibility
        if ($user->hasRole('Super Admin') || $user->hasRole(['HR Manager', 'HR Staff']) || $user->hasPermissionTo('manage organization')) {
            if ($request->filled('department_id') && $request->department_id !== 'all') {
                return [(int) $request->department_id];
            }
            return null;
        }

        // Department Manager: Scoped strictly to their managed department(s)
        if ($user->hasRole('Department Manager')) {
            $employee = $user->employee;
            if (!$employee) {
                return [-1];
            }

            $managedDepts = Department::where('manager_id', $employee->id)->pluck('id')->toArray();
            $primaryDeptId = $employee->primaryAssignment?->department_id;
            if ($primaryDeptId && !in_array($primaryDeptId, $managedDepts)) {
                $managedDepts[] = $primaryDeptId;
            }

            if (empty($managedDepts)) {
                return [-1];
            }

            // Ensure requested department is within permitted managed list
            if ($request->filled('department_id') && $request->department_id !== 'all') {
                $reqDeptId = (int) $request->department_id;
                if (in_array($reqDeptId, $managedDepts)) {
                    return [$reqDeptId];
                }
                // IDOR prevention: revert to authorized department IDs
                return $managedDepts;
            }

            return $managedDepts;
        }

        // Accountant
        if ($user->hasRole('Accountant')) {
            if ($request->filled('department_id') && $request->department_id !== 'all') {
                return [(int) $request->department_id];
            }
            return null;
        }

        return [-1];
    }
}
