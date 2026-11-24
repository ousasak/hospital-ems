<?php

namespace App\Services\Reports;

use App\Models\AttendanceRecord;
use App\Models\Department;
use App\Models\Employee;
use App\Models\EmployeeAssignment;
use App\Models\EmploymentType;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\Payroll;
use App\Models\Position;
use App\Models\User;
use App\Models\WorkShift;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportService
{
    /**
     * 1. Overview / Executive KPI Summary
     */
    public function getSummary(array $filters = [], ?array $scopedDepartmentIds = null, ?User $user = null): array
    {
        $today = Carbon::today();
        $startDate = !empty($filters['start_date'])
            ? Carbon::parse($filters['start_date'])->startOfDay()
            : $today->copy()->startOfMonth();
        $endDate = !empty($filters['end_date'])
            ? Carbon::parse($filters['end_date'])->endOfDay()
            : $today->copy()->endOfDay();

        // 1. Employee Counts within scope using single SQL aggregation
        $empQuery = Employee::query();
        if ($scopedDepartmentIds !== null) {
            $empQuery->whereHas('assignments', function ($q) use ($scopedDepartmentIds) {
                $q->whereIn('department_id', $scopedDepartmentIds)
                    ->where('is_primary', true)
                    ->where('status', 'active');
            });
        }

        $empStatusCounts = (clone $empQuery)
            ->selectRaw("
                COUNT(*) as total_count,
                SUM(CASE WHEN employment_status = 'active' THEN 1 ELSE 0 END) as active_count,
                SUM(CASE WHEN employment_status = 'probation' THEN 1 ELSE 0 END) as probation_count,
                SUM(CASE WHEN employment_status IN ('suspended', 'terminated', 'resigned') THEN 1 ELSE 0 END) as inactive_count
            ")
            ->first();

        $totalEmployees = (int) ($empStatusCounts->total_count ?? 0);
        $activeEmployees = (int) ($empStatusCounts->active_count ?? 0);
        $probationEmployees = (int) ($empStatusCounts->probation_count ?? 0);
        $inactiveEmployees = (int) ($empStatusCounts->inactive_count ?? 0);

        // 2. Department count within scope
        $deptCount = $scopedDepartmentIds !== null
            ? count($scopedDepartmentIds)
            : Department::count();

        // 3. Today's Attendance in scope using direct SQL aggregation
        $todayAttQuery = AttendanceRecord::where('attendance_date', $today->toDateString());
        if ($scopedDepartmentIds !== null) {
            $todayAttQuery->whereHas('assignment', function ($q) use ($scopedDepartmentIds) {
                $q->whereIn('department_id', $scopedDepartmentIds);
            });
        }
        $todayStats = (clone $todayAttQuery)
            ->selectRaw("
                COUNT(*) as total_count,
                SUM(CASE WHEN status IN ('present', 'late') THEN 1 ELSE 0 END) as present_count,
                SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_count,
                SUM(CASE WHEN status = 'on_leave' THEN 1 ELSE 0 END) as on_leave_count,
                SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_count
            ")
            ->first();

        $todayTotalRecords = (int) ($todayStats->total_count ?? 0);
        $todayPresent = (int) ($todayStats->present_count ?? 0);
        $todayLate = (int) ($todayStats->late_count ?? 0);
        $todayOnLeave = (int) ($todayStats->on_leave_count ?? 0);
        $todayAbsent = max(0, $activeEmployees - ($todayPresent + $todayOnLeave));
        $todayAttendanceRate = $activeEmployees > 0
            ? round(($todayPresent / $activeEmployees) * 100, 1)
            : 0;

        // 4. Period Attendance in scope using single SQL aggregation (No memory bloat, No double counting)
        $periodAttQuery = AttendanceRecord::whereBetween('attendance_date', [
            $startDate->toDateString(),
            $endDate->toDateString(),
        ]);
        if ($scopedDepartmentIds !== null) {
            $periodAttQuery->whereHas('assignment', function ($q) use ($scopedDepartmentIds) {
                $q->whereIn('department_id', $scopedDepartmentIds);
            });
        }

        $periodStats = (clone $periodAttQuery)
            ->selectRaw("
                COUNT(*) as total_records,
                SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_only,
                SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_count,
                SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_count,
                SUM(CASE WHEN status = 'on_leave' THEN 1 ELSE 0 END) as on_leave_count,
                SUM(CASE WHEN status = 'half_day' THEN 1 ELSE 0 END) as half_day_count,
                SUM(CASE WHEN status IN ('present', 'late') THEN 1 ELSE 0 END) as present_total,
                COALESCE(SUM(working_hours), 0) as total_working_hours,
                COALESCE(SUM(overtime_hours), 0) as total_overtime_hours,
                COALESCE(SUM(late_minutes), 0) as total_late_minutes
            ")
            ->first();

        $periodPresent = (int) ($periodStats->present_total ?? 0);
        $periodLate = (int) ($periodStats->late_count ?? 0);
        $periodAbsent = (int) ($periodStats->absent_count ?? 0);
        $periodOnLeave = (int) ($periodStats->on_leave_count ?? 0);
        $periodHalfDay = (int) ($periodStats->half_day_count ?? 0);
        $periodTotalWorkingHours = round((float) ($periodStats->total_working_hours ?? 0), 2);
        $periodTotalOvertimeHours = round((float) ($periodStats->total_overtime_hours ?? 0), 2);
        $periodTotalLateMinutes = (int) ($periodStats->total_late_minutes ?? 0);
        $totalExpectedRecords = (int) ($periodStats->total_records ?? 0);

        // Accurate attendance rate calculation: (present + late) / total actual records
        $periodAttendanceRate = $totalExpectedRecords > 0
            ? round(($periodPresent / $totalExpectedRecords) * 100, 1)
            : $todayAttendanceRate;

        // 5. Compare with Previous Period of same duration
        $periodDays = max(1, (int) round($startDate->diffInDays($endDate)) + 1);
        $prevStartDate = $startDate->copy()->subDays($periodDays);
        $prevEndDate = $startDate->copy()->subDay();

        $prevAttQuery = AttendanceRecord::whereBetween('attendance_date', [
            $prevStartDate->toDateString(),
            $prevEndDate->toDateString(),
        ]);
        if ($scopedDepartmentIds !== null) {
            $prevAttQuery->whereHas('assignment', function ($q) use ($scopedDepartmentIds) {
                $q->whereIn('department_id', $scopedDepartmentIds);
            });
        }
        $prevStats = (clone $prevAttQuery)
            ->selectRaw("
                COUNT(*) as total_records,
                SUM(CASE WHEN status IN ('present', 'late') THEN 1 ELSE 0 END) as present_total
            ")
            ->first();

        $prevTotal = (int) ($prevStats->total_records ?? 0);
        $prevPresent = (int) ($prevStats->present_total ?? 0);
        $prevAttendanceRate = $prevTotal > 0 ? round(($prevPresent / $prevTotal) * 100, 1) : null;
        $attendanceRateChange = $prevAttendanceRate !== null
            ? round($periodAttendanceRate - $prevAttendanceRate, 1)
            : null;
        $attendanceGrowthPct = ($prevAttendanceRate !== null && $prevAttendanceRate > 0)
            ? round((($periodAttendanceRate - $prevAttendanceRate) / $prevAttendanceRate) * 100, 1)
            : null;

        // 6. Leave Requests in scope using SQL aggregation
        $leaveQuery = LeaveRequest::query();
        if ($scopedDepartmentIds !== null) {
            $leaveQuery->whereHas('employee.assignments', function ($q) use ($scopedDepartmentIds) {
                $q->whereIn('department_id', $scopedDepartmentIds)
                    ->where('is_primary', true)
                    ->where('status', 'active');
            });
        }

        $leaveStats = (clone $leaveQuery)
            ->selectRaw("
                SUM(CASE WHEN status IN ('pending_supervisor', 'pending_hr') THEN 1 ELSE 0 END) as pending_count,
                SUM(CASE WHEN start_date BETWEEN ? AND ? THEN 1 ELSE 0 END) as period_leaves_count
            ", [$startDate->toDateString(), $endDate->toDateString()])
            ->first();

        $pendingLeavesCount = (int) ($leaveStats->pending_count ?? 0);
        $leavesThisMonth = (int) ($leaveStats->period_leaves_count ?? 0);

        // 7. Check if current user is authorized for Payroll and if Payroll exists
        $payrollSummary = null;
        $canViewPayroll = $user && ($user->hasRole(['Super Admin', 'Accountant']) || $user->hasPermissionTo('view payroll'));
        if ($canViewPayroll && Schema::hasTable('payrolls')) {
            $latestPayroll = Payroll::orderBy('year', 'desc')->orderBy('month', 'desc')->first();
            if ($latestPayroll) {
                $payrollSummary = [
                    'latest_period' => Carbon::create($latestPayroll->year, $latestPayroll->month, 1)->format('M Y'),
                    'total_gross' => (float) $latestPayroll->total_gross,
                    'total_deductions' => (float) $latestPayroll->total_deductions,
                    'total_net' => (float) $latestPayroll->total_net,
                    'currency' => $latestPayroll->currency ?? 'USD',
                    'status' => $latestPayroll->status,
                ];
            }
        }

        // Scope information for UI display (Strictly clean without mixed parenthetical English strings)
        $scopeInfo = [
            'is_department_scoped' => $scopedDepartmentIds !== null,
            'department_ids' => $scopedDepartmentIds,
            'department_names' => $scopedDepartmentIds !== null
                ? Department::whereIn('id', $scopedDepartmentIds)->pluck('name')->toArray()
                : [],
        ];

        return [
            'period' => [
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'days' => $periodDays,
            ],
            'scope' => $scopeInfo,
            'metrics' => [
                'total_employees' => $totalEmployees,
                'active_employees' => $activeEmployees,
                'probation_employees' => $probationEmployees,
                'inactive_employees' => $inactiveEmployees,
                'department_count' => $deptCount,
                'today_attendance_count' => $todayTotalRecords,
                'today_present_count' => $todayPresent,
                'today_late_count' => $todayLate,
                'today_absent_count' => $todayAbsent,
                'today_on_leave_count' => $todayOnLeave,
                'today_attendance_rate' => $todayAttendanceRate,
                'period_attendance_rate' => $periodAttendanceRate,
                'attendance_rate_change' => $attendanceRateChange,
                'attendance_growth_pct' => $attendanceGrowthPct,
                'period_present_count' => $periodPresent,
                'period_late_count' => $periodLate,
                'period_absent_count' => $periodAbsent,
                'period_on_leave_count' => $periodOnLeave,
                'period_half_day_count' => $periodHalfDay,
                'total_working_hours' => $periodTotalWorkingHours,
                'total_overtime_hours' => $periodTotalOvertimeHours,
                'total_late_minutes' => $periodTotalLateMinutes,
                'pending_leaves_count' => $pendingLeavesCount,
                'leaves_this_month' => $leavesThisMonth,
            ],
            'payroll_summary' => $payrollSummary,
            // Retain legacy top-level attributes for backwards compatibility
            'employee_count' => $totalEmployees,
            'active_employee_count' => $activeEmployees,
            'department_count' => $deptCount,
            'today_attendance_count' => $todayTotalRecords,
        ];
    }

    /**
     * 2. Workforce Analytics
     */
    public function getWorkforceAnalytics(array $filters = [], ?array $scopedDepartmentIds = null): array
    {
        // 1. Department Distribution
        $deptQuery = Department::query();
        if ($scopedDepartmentIds !== null) {
            $deptQuery->whereIn('id', $scopedDepartmentIds);
        }

        $departments = $deptQuery->withCount(['activeAssignments as employee_count' => function ($q) {
            $q->where('status', 'active')->where('is_primary', true);
        }])
        ->orderBy('employee_count', 'desc')
        ->get()
        ->map(function ($dept) {
            return [
                'id' => $dept->id,
                'name' => $dept->name,
                'code' => $dept->code,
                'count' => (int) $dept->employee_count,
            ];
        });

        $totalWorkforce = $departments->sum('count');
        $departments = $departments->map(function ($d) use ($totalWorkforce) {
            $d['percentage'] = $totalWorkforce > 0 ? round(($d['count'] / $totalWorkforce) * 100, 1) : 0;
            return $d;
        });

        // 2. Employment Status Distribution
        $empStatusQuery = Employee::query();
        if ($scopedDepartmentIds !== null) {
            $empStatusQuery->whereHas('assignments', function ($q) use ($scopedDepartmentIds) {
                $q->whereIn('department_id', $scopedDepartmentIds)
                    ->where('is_primary', true)
                    ->where('status', 'active');
            });
        }

        $byStatus = (clone $empStatusQuery)
            ->select('employment_status', DB::raw('count(*) as count'))
            ->groupBy('employment_status')
            ->get()
            ->map(function ($item) {
                return [
                    'status' => $item->employment_status,
                    'label' => match (strtolower($item->employment_status)) {
                        'active' => 'Active',
                        'probation' => 'Probation',
                        'suspended' => 'Suspended',
                        'terminated' => 'Terminated',
                        'resigned' => 'Resigned',
                        default => ucfirst($item->employment_status),
                    },
                    'count' => (int) $item->count,
                ];
            });

        // 3. Gender Distribution
        $byGender = (clone $empStatusQuery)
            ->select('gender', DB::raw('count(*) as count'))
            ->groupBy('gender')
            ->get()
            ->map(function ($item) {
                $g = strtolower($item->gender ?? 'unknown');
                return [
                    'gender' => $g,
                    'label' => match ($g) {
                        'male' => 'Male',
                        'female' => 'Female',
                        default => 'Other',
                    },
                    'count' => (int) $item->count,
                ];
            });

        // 4. Position / Job Title Distribution (Top 8)
        $positionQuery = Position::withCount(['assignments as employee_count' => function ($q) use ($scopedDepartmentIds) {
            $q->where('is_primary', true)->where('status', 'active');
            if ($scopedDepartmentIds !== null) {
                $q->whereIn('department_id', $scopedDepartmentIds);
            }
        }]);

        if ($scopedDepartmentIds !== null) {
            $positionQuery->whereIn('department_id', $scopedDepartmentIds);
        }

        $byPosition = $positionQuery->get(['id', 'title', 'code', 'department_id'])
            ->filter(fn ($pos) => (int) $pos->employee_count > 0)
            ->sortByDesc('employee_count')
            ->take(8)
            ->values()
            ->map(function ($pos) {
                return [
                    'id' => $pos->id,
                    'title' => $pos->title,
                    'code' => $pos->code,
                    'count' => (int) $pos->employee_count,
                ];
            });

        // 5. Hiring Trends (Monthly Join Dates over past 12 months using SQL aggregation)
        $twelveMonthsAgo = Carbon::today()->subMonths(11)->startOfMonth();
        $driver = DB::getDriverName();
        $monthFormat = match ($driver) {
            'sqlite' => "strftime('%Y-%m', join_date)",
            'pgsql' => "to_char(join_date, 'YYYY-MM')",
            default => "DATE_FORMAT(join_date, '%Y-%m')",
        };

        $monthlyHiring = (clone $empStatusQuery)
            ->whereNotNull('join_date')
            ->where('join_date', '>=', $twelveMonthsAgo->toDateString())
            ->selectRaw("{$monthFormat} as join_month, COUNT(*) as count")
            ->groupBy(DB::raw($monthFormat))
            ->pluck('count', 'join_month')
            ->toArray();

        $hiringTrends = [];
        for ($i = 11; $i >= 0; $i--) {
            $mDate = Carbon::today()->subMonths($i);
            $mKey = $mDate->format('Y-m');
            $count = (int) ($monthlyHiring[$mKey] ?? 0);

            $hiringTrends[] = [
                'month' => $mDate->format('M Y'),
                'short_month' => $mDate->format('M'),
                'count' => $count,
            ];
        }

        // 6. Employment Type Distribution (Full time, Part time, Contract)
        $byEmploymentType = EmploymentType::withCount(['assignments as employee_count' => function ($q) use ($scopedDepartmentIds) {
            $q->where('is_primary', true)->where('status', 'active');
            if ($scopedDepartmentIds !== null) {
                $q->whereIn('department_id', $scopedDepartmentIds);
            }
        }])
        ->get()
        ->filter(fn ($type) => (int) $type->employee_count > 0)
        ->values()
        ->map(fn ($type) => [
            'id' => $type->id,
            'name' => $type->name,
            'count' => (int) $type->employee_count,
        ]);

        return [
            'total_headcount' => $totalWorkforce,
            'by_department' => $departments,
            'by_status' => $byStatus,
            'by_gender' => $byGender,
            'by_position' => $byPosition,
            'hiring_trends' => $hiringTrends,
            'by_employment_type' => $byEmploymentType,
        ];
    }

    /**
     * 3. Attendance Analytics (Optimized with Direct SQL Aggregation)
     */
    public function getAttendanceAnalytics(array $filters = [], ?array $scopedDepartmentIds = null): array
    {
        $today = Carbon::today();
        $startDate = !empty($filters['start_date'])
            ? Carbon::parse($filters['start_date'])->startOfDay()
            : $today->copy()->subDays(29)->startOfDay();
        $endDate = !empty($filters['end_date'])
            ? Carbon::parse($filters['end_date'])->endOfDay()
            : $today->copy()->endOfDay();

        $baseQuery = AttendanceRecord::whereBetween('attendance_date', [$startDate->toDateString(), $endDate->toDateString()]);

        if ($scopedDepartmentIds !== null) {
            $baseQuery->whereHas('assignment', function ($q) use ($scopedDepartmentIds) {
                $q->whereIn('department_id', $scopedDepartmentIds);
            });
        } elseif (!empty($filters['department_id'])) {
            $deptId = (int) $filters['department_id'];
            $baseQuery->whereHas('assignment', function ($q) use ($deptId) {
                $q->where('department_id', $deptId);
            });
        }

        if (!empty($filters['status'])) {
            $baseQuery->where('status', $filters['status']);
        }

        // 1. Core aggregates in a single SQL query
        $aggregates = (clone $baseQuery)
            ->selectRaw("
                SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_count,
                SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_count,
                SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_count,
                SUM(CASE WHEN status = 'on_leave' THEN 1 ELSE 0 END) as on_leave_count,
                SUM(CASE WHEN status = 'half_day' THEN 1 ELSE 0 END) as half_day_count,
                COALESCE(SUM(working_hours), 0) as total_working_hours,
                COALESCE(SUM(overtime_hours), 0) as total_overtime_hours,
                COALESCE(SUM(late_minutes), 0) as total_late_minutes,
                COUNT(*) as total_records
            ")
            ->first();

        $statusCounts = [
            'present' => (int) ($aggregates->present_count ?? 0),
            'late' => (int) ($aggregates->late_count ?? 0),
            'absent' => (int) ($aggregates->absent_count ?? 0),
            'on_leave' => (int) ($aggregates->on_leave_count ?? 0),
            'half_day' => (int) ($aggregates->half_day_count ?? 0),
        ];

        $totalRecorded = (int) ($aggregates->total_records ?? 0);
        $totalPresentAndLate = $statusCounts['present'] + $statusCounts['late'];
        $attendanceRate = $totalRecorded > 0 ? round(($totalPresentAndLate / $totalRecorded) * 100, 1) : 0;

        $totalWorkingHours = round((float) ($aggregates->total_working_hours ?? 0), 2);
        $totalOvertimeHours = round((float) ($aggregates->total_overtime_hours ?? 0), 2);
        $totalLateMinutes = (int) ($aggregates->total_late_minutes ?? 0);

        // 2. Daily Trends across period via SQL Group By
        $dailyAggregates = (clone $baseQuery)
            ->selectRaw("
                attendance_date,
                SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
                SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late,
                SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent,
                SUM(CASE WHEN status = 'on_leave' THEN 1 ELSE 0 END) as on_leave,
                SUM(CASE WHEN status = 'half_day' THEN 1 ELSE 0 END) as half_day,
                COUNT(*) as total
            ")
            ->groupBy('attendance_date')
            ->orderBy('attendance_date', 'asc')
            ->get()
            ->keyBy('attendance_date');

        $daysCount = $startDate->diffInDays($endDate) + 1;
        $dailyTrends = [];

        // If span <= 31 days, group by day; if longer, group by week
        if ($daysCount <= 31) {
            $currentDay = $startDate->copy();
            while ($currentDay->lte($endDate)) {
                $dayStr = $currentDay->toDateString();
                $dayRow = $dailyAggregates[$dayStr] ?? null;

                $pres = (int) ($dayRow->present ?? 0);
                $late = (int) ($dayRow->late ?? 0);
                $abs = (int) ($dayRow->absent ?? 0);
                $leave = (int) ($dayRow->on_leave ?? 0);
                $dayTotal = (int) ($dayRow->total ?? 0);
                $rate = $dayTotal > 0 ? round((($pres + $late) / $dayTotal) * 100, 1) : 0;

                $dailyTrends[] = [
                    'date' => $dayStr,
                    'label' => $currentDay->format('M d'),
                    'day_name' => $currentDay->format('D'),
                    'present' => $pres,
                    'late' => $late,
                    'absent' => $abs,
                    'on_leave' => $leave,
                    'rate' => $rate,
                ];

                $currentDay->addDay();
            }
        } else {
            // Group by Week for longer spans
            $currentDay = $startDate->copy();
            while ($currentDay->lte($endDate)) {
                $wStart = $currentDay->copy()->startOfWeek();
                $wEnd = $currentDay->copy()->endOfWeek()->min($endDate);

                $wPres = 0; $wLate = 0; $wAbs = 0; $wLeave = 0; $wTotal = 0;
                $scanDay = $wStart->copy();
                while ($scanDay->lte($wEnd)) {
                    $scanStr = $scanDay->toDateString();
                    if (isset($dailyAggregates[$scanStr])) {
                        $row = $dailyAggregates[$scanStr];
                        $wPres += (int) $row->present;
                        $wLate += (int) $row->late;
                        $wAbs += (int) $row->absent;
                        $wLeave += (int) $row->on_leave;
                        $wTotal += (int) $row->total;
                    }
                    $scanDay->addDay();
                }

                $rate = $wTotal > 0 ? round((($wPres + $wLate) / $wTotal) * 100, 1) : 0;

                $dailyTrends[] = [
                    'date' => $wStart->toDateString(),
                    'label' => $wStart->format('M d') . ' - ' . $wEnd->format('M d'),
                    'day_name' => 'Week',
                    'present' => $wPres,
                    'late' => $wLate,
                    'absent' => $wAbs,
                    'on_leave' => $wLeave,
                    'rate' => $rate,
                ];

                $currentDay->addWeek();
            }
        }

        // 3. Attendance Rate by Department (Top 8) via SQL Group By
        $departmentRates = (clone $baseQuery)
            ->join('employee_assignments', 'attendance_records.assignment_id', '=', 'employee_assignments.id')
            ->join('departments', 'employee_assignments.department_id', '=', 'departments.id')
            ->selectRaw("
                departments.name as department,
                SUM(CASE WHEN attendance_records.status IN ('present', 'late') THEN 1 ELSE 0 END) as present,
                COUNT(attendance_records.id) as total
            ")
            ->groupBy('departments.id', 'departments.name')
            ->orderByDesc('total')
            ->take(8)
            ->get()
            ->map(function ($row) {
                $tot = (int) $row->total;
                $p = (int) $row->present;
                return [
                    'department' => $row->department,
                    'present' => $p,
                    'total' => $tot,
                    'rate' => $tot > 0 ? round(($p / $tot) * 100, 1) : 0,
                ];
            });

        // 4. Late Arrival Trends (Grouped by late minutes bucket in SQL)
        $lateBucketsRow = (clone $baseQuery)
            ->where('status', 'late')
            ->selectRaw("
                SUM(CASE WHEN late_minutes BETWEEN 1 AND 15 THEN 1 ELSE 0 END) as bucket_1_15,
                SUM(CASE WHEN late_minutes BETWEEN 16 AND 30 THEN 1 ELSE 0 END) as bucket_16_30,
                SUM(CASE WHEN late_minutes BETWEEN 31 AND 60 THEN 1 ELSE 0 END) as bucket_31_60,
                SUM(CASE WHEN late_minutes > 60 THEN 1 ELSE 0 END) as bucket_over_60
            ")
            ->first();

        $lateArrivalBuckets = [
            '1_to_15_mins' => (int) ($lateBucketsRow->bucket_1_15 ?? 0),
            '16_to_30_mins' => (int) ($lateBucketsRow->bucket_16_30 ?? 0),
            '31_to_60_mins' => (int) ($lateBucketsRow->bucket_31_60 ?? 0),
            'over_60_mins' => (int) ($lateBucketsRow->bucket_over_60 ?? 0),
        ];

        // Sample records limited for backward compatibility
        $sampleRecords = (clone $baseQuery)
            ->with(['employee', 'assignment.department', 'workShift'])
            ->orderBy('attendance_date', 'desc')
            ->take(50)
            ->get();

        return [
            'period' => [
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
            ],
            'status_counts' => $statusCounts,
            'attendance_rate' => $attendanceRate,
            'total_working_hours' => $totalWorkingHours,
            'total_overtime_hours' => $totalOvertimeHours,
            'total_late_minutes' => $totalLateMinutes,
            'daily_trends' => $dailyTrends,
            'department_rates' => $departmentRates,
            'late_arrival_buckets' => $lateArrivalBuckets,
            'total_records' => $totalRecorded,
            // Retain legacy structure for backward compatibility
            'records' => $sampleRecords,
        ];
    }

    /**
     * 4. Leave Analytics (Optimized with Direct SQL Aggregation)
     */
    public function getLeaveAnalytics(array $filters = [], ?array $scopedDepartmentIds = null): array
    {
        $year = (int) ($filters['year'] ?? Carbon::now()->year);

        $baseQuery = LeaveRequest::whereYear('leave_requests.start_date', $year);

        if ($scopedDepartmentIds !== null) {
            $baseQuery->whereHas('employee.assignments', function ($q) use ($scopedDepartmentIds) {
                $q->whereIn('department_id', $scopedDepartmentIds)
                    ->where('is_primary', true)
                    ->where('status', 'active');
            });
        } elseif (!empty($filters['department_id'])) {
            $deptId = (int) $filters['department_id'];
            $baseQuery->whereHas('employee.assignments', function ($q) use ($deptId) {
                $q->where('department_id', $deptId)
                    ->where('is_primary', true)
                    ->where('status', 'active');
            });
        }

        // 1. By Status via SQL Aggregation
        $statusCountsRow = (clone $baseQuery)
            ->selectRaw("
                SUM(CASE WHEN leave_requests.status = 'approved' THEN 1 ELSE 0 END) as approved_count,
                SUM(CASE WHEN leave_requests.status = 'pending_supervisor' THEN 1 ELSE 0 END) as pending_supervisor_count,
                SUM(CASE WHEN leave_requests.status = 'pending_hr' THEN 1 ELSE 0 END) as pending_hr_count,
                SUM(CASE WHEN leave_requests.status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
                SUM(CASE WHEN leave_requests.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_count,
                COUNT(*) as total_count
            ")
            ->first();

        $byStatus = [
            'approved' => (int) ($statusCountsRow->approved_count ?? 0),
            'pending_supervisor' => (int) ($statusCountsRow->pending_supervisor_count ?? 0),
            'pending_hr' => (int) ($statusCountsRow->pending_hr_count ?? 0),
            'rejected' => (int) ($statusCountsRow->rejected_count ?? 0),
            'cancelled' => (int) ($statusCountsRow->cancelled_count ?? 0),
        ];
        $totalRequests = (int) ($statusCountsRow->total_count ?? 0);

        // 2. By Leave Type (Approved leaves days and count)
        $byType = LeaveType::withCount(['requests as count' => function ($q) use ($year, $scopedDepartmentIds, $filters) {
            $q->whereYear('leave_requests.start_date', $year)->where('leave_requests.status', 'approved');
            if ($scopedDepartmentIds !== null) {
                $q->whereHas('employee.assignments', function ($sq) use ($scopedDepartmentIds) {
                    $sq->whereIn('department_id', $scopedDepartmentIds)->where('is_primary', true)->where('status', 'active');
                });
            } elseif (!empty($filters['department_id'])) {
                $deptId = (int) $filters['department_id'];
                $q->whereHas('employee.assignments', function ($sq) use ($deptId) {
                    $sq->where('department_id', $deptId)->where('is_primary', true)->where('status', 'active');
                });
            }
        }])
        ->withSum(['requests as total_days' => function ($q) use ($year, $scopedDepartmentIds, $filters) {
            $q->whereYear('leave_requests.start_date', $year)->where('leave_requests.status', 'approved');
            if ($scopedDepartmentIds !== null) {
                $q->whereHas('employee.assignments', function ($sq) use ($scopedDepartmentIds) {
                    $sq->whereIn('department_id', $scopedDepartmentIds)->where('is_primary', true)->where('status', 'active');
                });
            } elseif (!empty($filters['department_id'])) {
                $deptId = (int) $filters['department_id'];
                $q->whereHas('employee.assignments', function ($sq) use ($deptId) {
                    $sq->where('department_id', $deptId)->where('is_primary', true)->where('status', 'active');
                });
            }
        }], 'total_days')
        ->get()
        ->filter(fn ($item) => (int) $item->count > 0)
        ->values()
        ->map(fn ($lt) => [
            'id' => $lt->id,
            'name' => $lt->name,
            'code' => $lt->code,
            'total_days' => (float) ($lt->total_days ?? 0),
            'count' => (int) $lt->count,
        ]);

        // 3. Leaves by Month (Jan - Dec) via Database-Portable SQL
        $driver = DB::getDriverName();
        $monthExpr = match ($driver) {
            'sqlite' => "CAST(strftime('%m', leave_requests.start_date) AS INTEGER)",
            'pgsql' => "CAST(EXTRACT(MONTH FROM leave_requests.start_date) AS INTEGER)",
            default => "MONTH(leave_requests.start_date)",
        };

        $monthlyLeavesRaw = (clone $baseQuery)
            ->where('leave_requests.status', 'approved')
            ->selectRaw("
                {$monthExpr} as month_num,
                COUNT(*) as requests_count,
                COALESCE(SUM(leave_requests.total_days), 0) as days
            ")
            ->groupBy(DB::raw($monthExpr))
            ->get()
            ->keyBy('month_num');

        $leavesByMonth = [];
        for ($m = 1; $m <= 12; $m++) {
            $mRow = $monthlyLeavesRaw[$m] ?? null;
            $leavesByMonth[] = [
                'month' => Carbon::create($year, $m, 1)->format('M'),
                'full_month' => Carbon::create($year, $m, 1)->format('F'),
                'days' => (float) ($mRow->days ?? 0),
                'requests_count' => (int) ($mRow->requests_count ?? 0),
            ];
        }

        // 4. By Department via SQL JOINs & Aggregation
        $byDepartment = (clone $baseQuery)
            ->where('leave_requests.status', 'approved')
            ->join('employees', 'leave_requests.employee_id', '=', 'employees.id')
            ->join('employee_assignments', function ($join) {
                $join->on('employees.id', '=', 'employee_assignments.employee_id')
                    ->where('employee_assignments.is_primary', '=', true)
                    ->where('employee_assignments.status', '=', 'active');
            })
            ->join('departments', 'employee_assignments.department_id', '=', 'departments.id')
            ->selectRaw("
                departments.name as department,
                COALESCE(SUM(leave_requests.total_days), 0) as days,
                COUNT(leave_requests.id) as count
            ")
            ->groupBy('departments.id', 'departments.name')
            ->orderByDesc('days')
            ->take(8)
            ->get()
            ->map(fn ($r) => [
                'department' => $r->department,
                'days' => (float) $r->days,
                'count' => (int) $r->count,
            ]);

        // 5. Employees Currently on Leave Today
        $todayStr = Carbon::today()->toDateString();
        $currentlyOnLeave = LeaveRequest::with(['employee', 'leaveType'])
            ->where('status', 'approved')
            ->where('start_date', '<=', $todayStr)
            ->where('end_date', '>=', $todayStr);

        if ($scopedDepartmentIds !== null) {
            $currentlyOnLeave->whereHas('employee.assignments', function ($q) use ($scopedDepartmentIds) {
                $q->whereIn('department_id', $scopedDepartmentIds)
                    ->where('is_primary', true)
                    ->where('status', 'active');
            });
        }

        $currentlyOnLeaveList = $currentlyOnLeave->take(20)->get()->map(function ($r) {
            return [
                'id' => $r->id,
                'employee_id' => $r->employee?->employee_code ?? "EMP-{$r->employee_id}",
                'name' => $r->employee?->full_name ?? 'Employee',
                'avatar_url' => $r->employee?->avatar_url,
                'leave_type' => $r->leaveType?->name ?? 'Leave',
                'start_date' => Carbon::parse($r->start_date)->format('M d, Y'),
                'end_date' => Carbon::parse($r->end_date)->format('M d, Y'),
                'total_days' => (float) $r->total_days,
            ];
        });

        return [
            'year' => $year,
            'by_status' => $byStatus,
            'by_type' => $byType,
            'leaves_by_month' => $leavesByMonth,
            'by_department' => $byDepartment,
            'currently_on_leave' => $currentlyOnLeaveList,
            'total_requests' => $totalRequests,
            // Retain legacy names
            'leaves_by_type' => $byType,
        ];
    }

    /**
     * 5. Shift & Workforce Scheduling Analytics (Optimized with Direct SQL Aggregation)
     */
    public function getShiftAnalytics(array $filters = [], ?array $scopedDepartmentIds = null): array
    {
        $today = Carbon::today();
        $startDate = !empty($filters['start_date'])
            ? Carbon::parse($filters['start_date'])->startOfDay()
            : $today->copy()->subDays(29)->startOfDay();
        $endDate = !empty($filters['end_date'])
            ? Carbon::parse($filters['end_date'])->endOfDay()
            : $today->copy()->endOfDay();

        // Total active employees in scope
        $empQuery = Employee::where('employment_status', 'active');
        if ($scopedDepartmentIds !== null) {
            $empQuery->whereHas('assignments', function ($q) use ($scopedDepartmentIds) {
                $q->whereIn('department_id', $scopedDepartmentIds)
                    ->where('is_primary', true)
                    ->where('status', 'active');
            });
        }
        $totalActiveEmployees = $empQuery->count();

        // Shift distribution query
        $attQuery = AttendanceRecord::whereBetween('attendance_date', [$startDate->toDateString(), $endDate->toDateString()]);

        if ($scopedDepartmentIds !== null) {
            $attQuery->whereHas('assignment', function ($q) use ($scopedDepartmentIds) {
                $q->whereIn('department_id', $scopedDepartmentIds);
            });
        } elseif (!empty($filters['department_id'])) {
            $deptId = (int) $filters['department_id'];
            $attQuery->whereHas('assignment', function ($q) use ($deptId) {
                $q->where('department_id', $deptId);
            });
        }

        $totalShiftRecords = (clone $attQuery)->count();

        // Aggregate counts per shift in SQL
        $shiftStats = (clone $attQuery)
            ->selectRaw("
                work_shift_id,
                COUNT(*) as records_count,
                COUNT(DISTINCT employee_id) as unique_employees
            ")
            ->groupBy('work_shift_id')
            ->get()
            ->keyBy('work_shift_id');

        $shifts = WorkShift::all()->map(function ($shift) use ($shiftStats, $totalShiftRecords) {
            $stat = $shiftStats[$shift->id] ?? null;
            $count = (int) ($stat->records_count ?? 0);
            $uniqueEmployees = (int) ($stat->unique_employees ?? 0);

            // Timing category
            $startTime = $shift->start_time;
            $startHour = (int) explode(':', $startTime)[0];
            $category = match (true) {
                $shift->is_overnight || $startHour >= 19 || $startHour < 6 => 'night',
                $startHour >= 12 && $startHour < 19 => 'afternoon',
                $startHour >= 6 && $startHour < 12 => 'morning',
                default => 'office',
            };

            return [
                'id' => $shift->id,
                'name' => $shift->name,
                'code' => $shift->code,
                'start_time' => Carbon::parse($shift->start_time)->format('H:i'),
                'end_time' => Carbon::parse($shift->end_time)->format('H:i'),
                'is_overnight' => (bool) $shift->is_overnight,
                'category' => $category,
                'records_count' => $count,
                'unique_employees' => $uniqueEmployees,
                'percentage' => $totalShiftRecords > 0 ? round(($count / $totalShiftRecords) * 100, 1) : 0,
            ];
        });

        // Timing Category Breakdown (Clean standard categories)
        $categoriesBreakdown = [
            'morning' => [
                'label' => 'Morning Shift',
                'count' => $shifts->where('category', 'morning')->sum('records_count'),
            ],
            'afternoon' => [
                'label' => 'Afternoon Shift',
                'count' => $shifts->where('category', 'afternoon')->sum('records_count'),
            ],
            'night' => [
                'label' => 'Night Shift',
                'count' => $shifts->where('category', 'night')->sum('records_count'),
            ],
            'office' => [
                'label' => 'Standard Office',
                'count' => $shifts->where('category', 'office')->sum('records_count'),
            ],
        ];

        // Shift Coverage by Department via SQL Aggregation
        $driver = DB::getDriverName();
        $overnightExpr = $driver === 'pgsql' ? 'work_shifts.is_overnight IS TRUE' : 'work_shifts.is_overnight = 1';

        $byDepartment = (clone $attQuery)
            ->join('employee_assignments', 'attendance_records.assignment_id', '=', 'employee_assignments.id')
            ->join('departments', 'employee_assignments.department_id', '=', 'departments.id')
            ->join('work_shifts', 'attendance_records.work_shift_id', '=', 'work_shifts.id')
            ->selectRaw("
                departments.name as department,
                SUM(CASE WHEN LOWER(work_shifts.name) LIKE '%ព្រឹក%' OR LOWER(work_shifts.name) LIKE '%morning%' THEN 1 ELSE 0 END) as morning,
                SUM(CASE WHEN LOWER(work_shifts.name) LIKE '%រសៀល%' OR LOWER(work_shifts.name) LIKE '%afternoon%' THEN 1 ELSE 0 END) as afternoon,
                SUM(CASE WHEN LOWER(work_shifts.name) LIKE '%យប់%' OR LOWER(work_shifts.name) LIKE '%night%' OR {$overnightExpr} THEN 1 ELSE 0 END) as night,
                SUM(CASE WHEN LOWER(work_shifts.name) LIKE '%រដ្ឋបាល%' OR LOWER(work_shifts.name) LIKE '%office%' THEN 1 ELSE 0 END) as office,
                COUNT(attendance_records.id) as total
            ")
            ->groupBy('departments.id', 'departments.name')
            ->orderByDesc('total')
            ->take(8)
            ->get()
            ->map(fn ($r) => [
                'department' => $r->department,
                'morning' => (int) $r->morning,
                'afternoon' => (int) $r->afternoon,
                'night' => (int) $r->night,
                'office' => (int) $r->office,
                'total' => (int) $r->total,
            ]);

        // Unassigned employees count via SQL distinct query
        $assignedCount = (clone $attQuery)->distinct('employee_id')->count('employee_id');
        $unassignedCount = max(0, $totalActiveEmployees - $assignedCount);

        return [
            'period' => [
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
            ],
            'total_active_employees' => $totalActiveEmployees,
            'total_shift_records' => $totalShiftRecords,
            'unassigned_employees_count' => $unassignedCount,
            'by_shift' => $shifts,
            'categories_breakdown' => $categoriesBreakdown,
            'by_department' => $byDepartment,
        ];
    }

    /**
     * 6. Payroll Analytics (Strictly guarded by permission)
     */
    public function getPayrollAnalytics(array $filters = [], ?array $scopedDepartmentIds = null, ?User $user = null): array
    {
        $canView = $user && ($user->hasRole(['Super Admin', 'Accountant']) || $user->hasPermissionTo('view payroll'));
        if (!$canView) {
            return [
                'available' => false,
                'reason' => 'Unauthorized: Missing permission to view payroll statistics.',
            ];
        }

        if (!Schema::hasTable('payrolls')) {
            return [
                'available' => false,
                'reason' => 'Payroll module is not enabled in the current hospital EMS database schema.',
            ];
        }

        $year = (int) ($filters['year'] ?? Carbon::now()->year);

        $payrolls = Payroll::where('year', $year)
            ->orderBy('month')
            ->get(['month', 'year', 'total_gross', 'total_deductions', 'total_net', 'currency', 'status'])
            ->map(fn ($p) => [
                'month' => Carbon::create($p->year, $p->month, 1)->format('M'),
                'gross' => (float) $p->total_gross,
                'deductions' => (float) $p->total_deductions,
                'net' => (float) $p->total_net,
                'status' => $p->status,
            ]);

        $totalDisbursedYear = $payrolls->sum('net');

        return [
            'available' => true,
            'year' => $year,
            'total_disbursed_year' => $totalDisbursedYear,
            'payrolls' => $payrolls,
        ];
    }

    /**
     * 7. Detailed Reports & Underlying Records (Backend Paginated)
     */
    public function getDetailedRecords(
        string $category,
        array $filters = [],
        int $perPage = 15,
        int $page = 1,
        ?array $scopedDepartmentIds = null,
        ?string $sortBy = null,
        ?string $sortDir = 'desc'
    ): array {
        $perPage = min(max($perPage, 5), 100);

        return match ($category) {
            'attendance' => $this->getDetailedAttendanceRecords($filters, $perPage, $page, $scopedDepartmentIds, $sortBy, $sortDir),
            'leave' => $this->getDetailedLeaveRecords($filters, $perPage, $page, $scopedDepartmentIds, $sortBy, $sortDir),
            'employee' => $this->getDetailedEmployeeRecords($filters, $perPage, $page, $scopedDepartmentIds, $sortBy, $sortDir),
            'shift' => $this->getDetailedShiftRecords($filters, $perPage, $page, $scopedDepartmentIds, $sortBy, $sortDir),
            'department' => $this->getDetailedDepartmentRecords($filters, $perPage, $page, $scopedDepartmentIds, $sortBy, $sortDir),
            'payroll' => $this->getDetailedPayrollRecords($filters, $perPage, $page, $scopedDepartmentIds, $sortBy, $sortDir),
            default => $this->getDetailedAttendanceRecords($filters, $perPage, $page, $scopedDepartmentIds, $sortBy, $sortDir),
        };
    }

    protected function getDetailedAttendanceRecords(array $filters, int $perPage, int $page, ?array $scopedDepartmentIds, ?string $sortBy, ?string $sortDir): array
    {
        $query = AttendanceRecord::with([
            'employee.primaryAssignment.department',
            'employee.primaryAssignment.position',
            'assignment.department',
            'assignment.position',
            'workShift',
        ]);

        if ($scopedDepartmentIds !== null) {
            $query->whereHas('assignment', function ($q) use ($scopedDepartmentIds) {
                $q->whereIn('department_id', $scopedDepartmentIds);
            });
        } elseif (!empty($filters['department_id'])) {
            $deptId = (int) $filters['department_id'];
            $query->whereHas('assignment', function ($q) use ($deptId) {
                $q->where('department_id', $deptId);
            });
        }

        if (!empty($filters['start_date']) && !empty($filters['end_date'])) {
            $query->whereBetween('attendance_date', [$filters['start_date'], $filters['end_date']]);
        } elseif (!empty($filters['date'])) {
            $query->where('attendance_date', $filters['date']);
        }

        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['search'])) {
            $s = trim($filters['search']);
            $query->where(function ($q) use ($s) {
                $q->whereHas('employee', function ($eq) use ($s) {
                    $eq->where('first_name', 'like', "%{$s}%")
                        ->orWhere('last_name', 'like', "%{$s}%")
                        ->orWhere('employee_code', 'like', "%{$s}%");
                });
            });
        }

        $sortField = match ($sortBy) {
            'date', 'attendance_date' => 'attendance_date',
            'check_in' => 'check_in_time',
            'working_hours' => 'working_hours',
            'status' => 'status',
            default => 'attendance_date',
        };
        $sortDirection = strtolower($sortDir) === 'asc' ? 'asc' : 'desc';

        $paginator = $query->orderBy($sortField, $sortDirection)
            ->orderBy('id', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);

        $items = collect($paginator->items())->map(function ($r) {
            $emp = $r->employee;
            $deptName = $r->assignment?->department?->name ?? $emp?->primaryAssignment?->department?->name ?? 'ទូទៅ';
            $posTitle = $r->assignment?->position?->title ?? $emp?->primaryAssignment?->position?->title ?? '';

            return [
                'id' => $r->id,
                'employee_code' => $emp?->employee_code ?? "EMP-{$r->employee_id}",
                'employee_name' => $emp?->full_name ?? 'បុគ្គលិក',
                'avatar_url' => $emp?->avatar_url,
                'department' => $deptName,
                'position' => $posTitle,
                'date' => $r->attendance_date ? Carbon::parse($r->attendance_date)->format('Y-m-d') : '—',
                'shift_name' => $r->workShift?->name ?? 'ម៉ោងរដ្ឋបាល',
                'check_in' => $r->check_in_time ? Carbon::parse($r->check_in_time)->format('H:i') : '—',
                'check_out' => $r->check_out_time ? Carbon::parse($r->check_out_time)->format('H:i') : '—',
                'working_hours' => $r->working_hours > 0 ? "{$r->working_hours}h" : '—',
                'overtime_hours' => $r->overtime_hours > 0 ? "+{$r->overtime_hours}h" : '—',
                'late_minutes' => $r->late_minutes > 0 ? "{$r->late_minutes}m" : '0m',
                'status' => $r->status ?? 'present',
                'notes' => $r->notes ?? '',
            ];
        });

        return [
            'data' => $items,
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
        ];
    }

    protected function getDetailedLeaveRecords(array $filters, int $perPage, int $page, ?array $scopedDepartmentIds, ?string $sortBy, ?string $sortDir): array
    {
        $query = LeaveRequest::with(['employee.primaryAssignment.department', 'leaveType', 'supervisor']);

        if ($scopedDepartmentIds !== null) {
            $query->whereHas('employee.assignments', function ($q) use ($scopedDepartmentIds) {
                $q->whereIn('department_id', $scopedDepartmentIds)
                    ->where('is_primary', true)
                    ->where('status', 'active');
            });
        } elseif (!empty($filters['department_id'])) {
            $deptId = (int) $filters['department_id'];
            $query->whereHas('employee.assignments', function ($q) use ($deptId) {
                $q->where('department_id', $deptId)
                    ->where('is_primary', true)
                    ->where('status', 'active');
            });
        }

        if (!empty($filters['start_date']) && !empty($filters['end_date'])) {
            $query->where(function ($q) use ($filters) {
                $q->whereBetween('start_date', [$filters['start_date'], $filters['end_date']])
                    ->orWhereBetween('end_date', [$filters['start_date'], $filters['end_date']]);
            });
        }

        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['search'])) {
            $s = trim($filters['search']);
            $query->where(function ($q) use ($s) {
                $q->whereHas('employee', function ($eq) use ($s) {
                    $eq->where('first_name', 'like', "%{$s}%")
                        ->orWhere('last_name', 'like', "%{$s}%")
                        ->orWhere('employee_code', 'like', "%{$s}%");
                });
            });
        }

        $sortField = match ($sortBy) {
            'start_date' => 'start_date',
            'end_date' => 'end_date',
            'total_days' => 'total_days',
            'status' => 'status',
            default => 'created_at',
        };
        $sortDirection = strtolower($sortDir) === 'asc' ? 'asc' : 'desc';

        $paginator = $query->orderBy($sortField, $sortDirection)
            ->paginate($perPage, ['*'], 'page', $page);

        $items = collect($paginator->items())->map(function ($r) {
            $emp = $r->employee;
            $deptName = $emp?->primaryAssignment?->department?->name ?? 'ទូទៅ';

            return [
                'id' => $r->id,
                'employee_code' => $emp?->employee_code ?? "EMP-{$r->employee_id}",
                'employee_name' => $emp?->full_name ?? 'បុគ្គលិក',
                'avatar_url' => $emp?->avatar_url,
                'department' => $deptName,
                'leave_type' => $r->leaveType?->name ?? 'ច្បាប់ឈប់សម្រាក',
                'start_date' => Carbon::parse($r->start_date)->format('Y-m-d'),
                'end_date' => Carbon::parse($r->end_date)->format('Y-m-d'),
                'total_days' => (float) $r->total_days,
                'reason' => $r->reason ?? '',
                'status' => $r->status,
                'supervisor_name' => $r->supervisor?->full_name ?? '—',
            ];
        });

        return [
            'data' => $items,
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
        ];
    }

    protected function getDetailedEmployeeRecords(array $filters, int $perPage, int $page, ?array $scopedDepartmentIds, ?string $sortBy, ?string $sortDir): array
    {
        $query = Employee::with([
            'primaryAssignment.department',
            'primaryAssignment.position',
            'primaryAssignment.employmentType',
        ]);

        if ($scopedDepartmentIds !== null) {
            $query->whereHas('assignments', function ($q) use ($scopedDepartmentIds) {
                $q->whereIn('department_id', $scopedDepartmentIds)
                    ->where('is_primary', true)
                    ->where('status', 'active');
            });
        } elseif (!empty($filters['department_id'])) {
            $deptId = (int) $filters['department_id'];
            $query->whereHas('assignments', function ($q) use ($deptId) {
                $q->where('department_id', $deptId)
                    ->where('is_primary', true)
                    ->where('status', 'active');
            });
        }

        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $query->where('employment_status', $filters['status']);
        }

        if (!empty($filters['search'])) {
            $s = trim($filters['search']);
            $query->where(function ($q) use ($s) {
                $q->where('first_name', 'like', "%{$s}%")
                    ->orWhere('last_name', 'like', "%{$s}%")
                    ->orWhere('employee_code', 'like', "%{$s}%")
                    ->orWhere('email', 'like', "%{$s}%")
                    ->orWhere('phone', 'like', "%{$s}%");
            });
        }

        $sortField = match ($sortBy) {
            'employee_code' => 'employee_code',
            'name' => 'first_name',
            'join_date' => 'join_date',
            'status' => 'employment_status',
            default => 'id',
        };
        $sortDirection = strtolower($sortDir) === 'asc' ? 'asc' : 'desc';

        $paginator = $query->orderBy($sortField, $sortDirection)
            ->paginate($perPage, ['*'], 'page', $page);

        $items = collect($paginator->items())->map(function ($emp) {
            $deptName = $emp->primaryAssignment?->department?->name ?? 'ទូទៅ';
            $posTitle = $emp->primaryAssignment?->position?->title ?? '';
            $empType = $emp->primaryAssignment?->employmentType?->name ?? 'ពេញម៉ោង';

            return [
                'id' => $emp->id,
                'employee_code' => $emp->employee_code,
                'employee_name' => $emp->full_name,
                'avatar_url' => $emp->avatar_url,
                'gender' => $emp->gender,
                'email' => $emp->email,
                'phone' => $emp->phone ?? '—',
                'department' => $deptName,
                'position' => $posTitle,
                'employment_type' => $empType,
                'join_date' => $emp->join_date ? Carbon::parse($emp->join_date)->format('Y-m-d') : '—',
                'status' => $emp->employment_status,
            ];
        });

        return [
            'data' => $items,
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
        ];
    }

    protected function getDetailedShiftRecords(array $filters, int $perPage, int $page, ?array $scopedDepartmentIds, ?string $sortBy, ?string $sortDir): array
    {
        $shifts = WorkShift::all()->map(function ($s) {
            $assignedCount = AttendanceRecord::where('work_shift_id', $s->id)->count();

            return [
                'id' => $s->id,
                'name' => $s->name,
                'code' => $s->code,
                'start_time' => Carbon::parse($s->start_time)->format('H:i'),
                'end_time' => Carbon::parse($s->end_time)->format('H:i'),
                'break_minutes' => (int) $s->break_minutes,
                'is_overnight' => (bool) $s->is_overnight,
                'assigned_count' => $assignedCount,
                'status' => $s->status ?? 'active',
            ];
        });

        return [
            'data' => $shifts,
            'current_page' => 1,
            'last_page' => 1,
            'per_page' => $shifts->count(),
            'total' => $shifts->count(),
        ];
    }

    protected function getDetailedDepartmentRecords(array $filters, int $perPage, int $page, ?array $scopedDepartmentIds, ?string $sortBy, ?string $sortDir): array
    {
        $query = Department::with(['manager']);

        if ($scopedDepartmentIds !== null) {
            $query->whereIn('id', $scopedDepartmentIds);
        }

        if (!empty($filters['search'])) {
            $s = trim($filters['search']);
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                    ->orWhere('code', 'like', "%{$s}%");
            });
        }

        $paginator = $query->withCount(['activeAssignments as employee_count' => function ($q) {
            $q->where('status', 'active')->where('is_primary', true);
        }])
        ->orderBy('employee_count', 'desc')
        ->paginate($perPage, ['*'], 'page', $page);

        $items = collect($paginator->items())->map(function ($dept) {
            return [
                'id' => $dept->id,
                'code' => $dept->code,
                'name' => $dept->name,
                'manager_name' => $dept->manager?->full_name ?? '—',
                'employee_count' => (int) $dept->employee_count,
                'status' => $dept->status ?? 'active',
            ];
        });

        return [
            'data' => $items,
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
        ];
    }

    protected function getDetailedPayrollRecords(array $filters, int $perPage, int $page, ?array $scopedDepartmentIds, ?string $sortBy, ?string $sortDir): array
    {
        if (!Schema::hasTable('payrolls')) {
            return [
                'data' => [],
                'current_page' => 1,
                'last_page' => 1,
                'per_page' => $perPage,
                'total' => 0,
            ];
        }

        $paginator = Payroll::orderBy('year', 'desc')
            ->orderBy('month', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);

        $items = collect($paginator->items())->map(function ($p) {
            return [
                'id' => $p->id,
                'period' => Carbon::create($p->year, $p->month, 1)->format('M Y'),
                'total_gross' => (float) $p->total_gross,
                'total_deductions' => (float) $p->total_deductions,
                'total_net' => (float) $p->total_net,
                'currency' => $p->currency ?? 'USD',
                'payment_date' => $p->payment_date ? Carbon::parse($p->payment_date)->format('Y-m-d') : '—',
                'status' => $p->status,
            ];
        });

        return [
            'data' => $items,
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
        ];
    }

    /**
     * 8. Server-Side CSV Export with UTF-8 BOM for Khmer & English Fonts
     */
    public function exportCsv(string $category, array $filters = [], ?array $scopedDepartmentIds = null, string $lang = 'kh'): StreamedResponse
    {
        $timestamp = Carbon::now()->format('Y_m_d_His');
        $filename = "Report_{$category}_{$timestamp}.csv";
        $isEn = strtolower($lang) === 'en';

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $callback = function () use ($category, $filters, $scopedDepartmentIds, $isEn) {
            $file = fopen('php://output', 'w');

            // UTF-8 BOM for Excel / Unicode Khmer support
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));

            // Fetch records for export (up to 5000 records)
            $result = $this->getDetailedRecords($category, $filters, 5000, 1, $scopedDepartmentIds);
            $rows = $result['data'] ?? [];

            switch ($category) {
                case 'attendance':
                    fputcsv($file, $isEn ? [
                        'Employee ID',
                        'Employee Name',
                        'Department',
                        'Position',
                        'Date',
                        'Shift',
                        'Check In',
                        'Check Out',
                        'Working Hours',
                        'Overtime',
                        'Late Minutes',
                        'Status',
                        'Notes',
                    ] : [
                        'លេខសម្គាល់បុគ្គលិក',
                        'ឈ្មោះបុគ្គលិក',
                        'ដេប៉ាតឺម៉ង់',
                        'មុខតំណែង',
                        'កាលបរិច្ឆេទ',
                        'វេនការងារ',
                        'ម៉ោងចូល',
                        'ម៉ោងចេញ',
                        'ម៉ោងបំពេញការងារ',
                        'ម៉ោងបន្ថែម',
                        'យឺត (នាទី)',
                        'ស្ថានភាព',
                        'កំណត់សម្គាល់',
                    ]);
                    foreach ($rows as $r) {
                        fputcsv($file, [
                            $r['employee_code'],
                            $r['employee_name'],
                            $r['department'],
                            $r['position'],
                            $r['date'],
                            $r['shift_name'],
                            $r['check_in'],
                            $r['check_out'],
                            $r['working_hours'],
                            $r['overtime_hours'],
                            $r['late_minutes'],
                            $r['status'],
                            $r['notes'],
                        ]);
                    }
                    break;

                case 'leave':
                    fputcsv($file, $isEn ? [
                        'Employee ID',
                        'Employee Name',
                        'Department',
                        'Leave Type',
                        'Start Date',
                        'End Date',
                        'Total Days',
                        'Reason',
                        'Approver',
                        'Status',
                    ] : [
                        'លេខសម្គាល់បុគ្គលិក',
                        'ឈ្មោះបុគ្គលិក',
                        'ដេប៉ាតឺម៉ង់',
                        'ប្រភេទច្បាប់',
                        'ថ្ងៃចាប់ផ្តើម',
                        'ថ្ងៃបញ្ចប់',
                        'ចំនួនថ្ងៃ',
                        'មូលហេតុ',
                        'អ្នកអនុម័ត',
                        'ស្ថានភាព',
                    ]);
                    foreach ($rows as $r) {
                        fputcsv($file, [
                            $r['employee_code'],
                            $r['employee_name'],
                            $r['department'],
                            $r['leave_type'],
                            $r['start_date'],
                            $r['end_date'],
                            $r['total_days'],
                            $r['reason'],
                            $r['supervisor_name'],
                            $r['status'],
                        ]);
                    }
                    break;

                case 'employee':
                    fputcsv($file, $isEn ? [
                        'Employee ID',
                        'Full Name',
                        'Gender',
                        'Email',
                        'Phone',
                        'Department',
                        'Position',
                        'Employment Type',
                        'Join Date',
                        'Status',
                    ] : [
                        'លេខសម្គាល់បុគ្គលិក',
                        'ឈ្មោះពេញ',
                        'ភេទ',
                        'អ៊ីមែល',
                        'លេខទូរស័ព្ទ',
                        'ដេប៉ាតឺម៉ង់',
                        'មុខតំណែង',
                        'ប្រភេទការងារ',
                        'ថ្ងៃចូលបម្រើការ',
                        'ស្ថានភាព',
                    ]);
                    foreach ($rows as $r) {
                        fputcsv($file, [
                            $r['employee_code'],
                            $r['employee_name'],
                            $r['gender'],
                            $r['email'],
                            $r['phone'],
                            $r['department'],
                            $r['position'],
                            $r['employment_type'],
                            $r['join_date'],
                            $r['status'],
                        ]);
                    }
                    break;

                case 'shift':
                    fputcsv($file, $isEn ? [
                        'Shift Name',
                        'Code',
                        'Start Time',
                        'End Time',
                        'Break Minutes',
                        'Is Overnight',
                        'Assigned Records',
                        'Status',
                    ] : [
                        'ឈ្មោះវេនការងារ',
                        'កូដ',
                        'ម៉ោងចាប់ផ្តើម',
                        'ម៉ោងបញ្ចប់',
                        'សម្រាក (នាទី)',
                        'វេនយប់',
                        'ចំនួនកំណត់ត្រា',
                        'ស្ថានភាព',
                    ]);
                    foreach ($rows as $r) {
                        fputcsv($file, [
                            $r['name'],
                            $r['code'],
                            $r['start_time'],
                            $r['end_time'],
                            $r['break_minutes'],
                            $r['is_overnight'] ? ($isEn ? 'Yes' : 'បាទ/ចាស') : ($isEn ? 'No' : 'ទេ'),
                            $r['assigned_count'],
                            $r['status'],
                        ]);
                    }
                    break;

                case 'department':
                    fputcsv($file, $isEn ? [
                        'Department Code',
                        'Department Name',
                        'Department Head',
                        'Employee Count',
                        'Status',
                    ] : [
                        'កូដដេប៉ាតឺម៉ង់',
                        'ឈ្មោះដេប៉ាតឺម៉ង់',
                        'ប្រធានផ្នែក',
                        'ចំនួនបុគ្គលិក',
                        'ស្ថានភាព',
                    ]);
                    foreach ($rows as $r) {
                        fputcsv($file, [
                            $r['code'],
                            $r['name'],
                            $r['manager_name'],
                            $r['employee_count'],
                            $r['status'],
                        ]);
                    }
                    break;

                case 'payroll':
                    fputcsv($file, $isEn ? [
                        'Period',
                        'Total Gross',
                        'Total Deductions',
                        'Total Net',
                        'Currency',
                        'Payment Date',
                        'Status',
                    ] : [
                        'កាលបរិច្ឆេទ',
                        'ប្រាក់បៀវត្សរ៍សរុប',
                        'ការកាត់កងសរុប',
                        'ប្រាក់ខែជាក់ស្តែង',
                        'រូបិយប័ណ្ណ',
                        'ថ្ងៃបើកប្រាក់',
                        'ស្ថានភាព',
                    ]);
                    foreach ($rows as $r) {
                        fputcsv($file, [
                            $r['period'],
                            $r['total_gross'],
                            $r['total_deductions'],
                            $r['total_net'],
                            $r['currency'],
                            $r['payment_date'],
                            $r['status'],
                        ]);
                    }
                    break;
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
