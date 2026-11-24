<?php

namespace App\Http\Controllers\Api\V1\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\AttendanceRecord;
use App\Models\Department;
use App\Models\Employee;
use App\Models\Holiday;
use App\Models\LeaveRequest;
use App\Models\Payroll;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Spatie\Activitylog\Models\Activity;

class DashboardController extends Controller
{
    public function stats(Request $request): JsonResponse
    {
        $today = Carbon::today();
        $startOfMonth = $today->copy()->startOfMonth();
        $endOfMonth = $today->copy()->endOfMonth();

        // 1. Employee Metrics
        $totalEmployees = Employee::count();
        $activeEmployees = Employee::where('employment_status', 'active')->count();
        $probationEmployees = Employee::where('employment_status', 'probation')->count();
        $inactiveEmployees = Employee::whereIn('employment_status', ['suspended', 'terminated', 'resigned'])->count();

        // 2. Department Breakdown (sorted by headcount descending)
        $departments = Department::withCount(['activeAssignments' => function ($q) {
            $q->where('status', 'active')->where('is_primary', true);
        }])
        ->orderBy('active_assignments_count', 'desc')
        ->get()
        ->map(function ($dept) {
            return [
                'id' => $dept->id,
                'name' => $dept->name,
                'count' => $dept->active_assignments_count,
            ];
        });

        // 3. Gender Distribution
        $genderDistribution = Employee::select('gender', DB::raw('count(*) as count'))
            ->groupBy('gender')
            ->get()
            ->map(fn ($item) => [
                'gender' => ucfirst($item->gender),
                'count' => (int) $item->count,
            ]);

        // 4. Today's Attendance
        $todayRecords = AttendanceRecord::where('attendance_date', $today->toDateString())->get();
        $presentToday = $todayRecords->whereIn('status', ['present', 'late'])->count();
        $lateToday = $todayRecords->where('status', 'late')->count();
        $onLeaveToday = $todayRecords->where('status', 'on_leave')->count();
        $absentToday = max(0, $activeEmployees - ($presentToday + $onLeaveToday));

        // 5. Pending Leaves
        $pendingLeaves = LeaveRequest::with(['employee', 'leaveType'])
            ->whereIn('status', ['pending_supervisor', 'pending_hr'])
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        // 6. Monthly Payroll Summary (optional)
        $latestPayroll = \Illuminate\Support\Facades\Schema::hasTable('payrolls')
            ? Payroll::orderBy('year', 'desc')->orderBy('month', 'desc')->first()
            : null;

        // 7. Upcoming Birthdays (next nearest upcoming birthdays)
        $upcomingBirthdays = Employee::with(['primaryAssignment.department'])
            ->whereNotNull('date_of_birth')
            ->get()
            ->map(function ($emp) use ($today) {
                if (!$emp->date_of_birth) return null;
                $dob = $emp->date_of_birth->copy()->year($today->year);
                if ($dob->lt($today)) {
                    $dob->addYear();
                }
                $daysUntil = (int) $today->diffInDays($dob, false);
                return [
                    'id' => $emp->id,
                    'name' => $emp->full_name,
                    'date_of_birth' => $emp->date_of_birth->format('M d'),
                    'department' => $emp->primaryAssignment?->department?->name ?? 'បុគ្គលិកទូទៅ',
                    'avatar_url' => $emp->avatar_url,
                    'days_until' => $daysUntil,
                ];
            })
            ->filter()
            ->sortBy('days_until')
            ->values()
            ->take(5);

        // 8. Upcoming Holidays
        $upcomingHolidays = Holiday::all()->map(function ($h) use ($today) {
            $hDate = Carbon::parse($h->date);
            if ($h->is_recurring) {
                $nextDate = $hDate->copy()->year($today->year);
                if ($nextDate->lt($today)) {
                    $nextDate->addYear();
                }
                $h->date = $nextDate->toIso8601String();
            }
            return $h;
        })
        ->filter(fn ($h) => Carbon::parse($h->date)->gte($today))
        ->sortBy(fn ($h) => Carbon::parse($h->date)->timestamp)
        ->values()
        ->take(4);

        if ($upcomingHolidays->isEmpty()) {
            $upcomingHolidays = Holiday::orderBy('date', 'desc')->take(4)->get();
        }

        // 9. Recent Announcements
        $announcements = collect();
        if (\Illuminate\Support\Facades\Schema::hasTable('announcements')) {
            $announcements = Announcement::where('is_published', true)
                ->where(function ($q) use ($today) {
                    $q->whereNull('expires_at')->orWhere('expires_at', '>=', $today);
                })
                ->orderBy('published_at', 'desc')
                ->take(4)
                ->get();
        }

        // 10. Attendance Trends (7D, 30D, 3M, 12M)
        $attendanceTrends = [];
        for ($i = 6; $i >= 0; $i--) {
            $day = $today->copy()->subDays($i);
            $dayRecords = AttendanceRecord::where('attendance_date', $day->toDateString())->get();
            $pres = $dayRecords->where('status', 'present')->count();
            $late = $dayRecords->where('status', 'late')->count();
            $leave = $dayRecords->where('status', 'on_leave')->count();
            $abs = $dayRecords->where('status', 'absent')->count();
            $totalLogged = $pres + $late + $leave + $abs;
            $rate = $totalLogged > 0 ? round((($pres + $late) / $totalLogged) * 100, 1) : 0;
            
            $attendanceTrends[] = [
                'date' => $day->format('M d'),
                'dayName' => $day->format('D'),
                'present' => $pres,
                'late' => $late,
                'absent' => $abs,
                'on_leave' => $leave,
                'rate' => $rate,
            ];
        }

        $trends30d = [];
        for ($w = 3; $w >= 0; $w--) {
            $wStart = $today->copy()->subWeeks($w)->startOfWeek();
            $wEnd = $today->copy()->subWeeks($w)->endOfWeek();
            $weekRecords = AttendanceRecord::whereBetween('attendance_date', [$wStart->toDateString(), $wEnd->toDateString()])->get();
            $wDays = max(1, $weekRecords->pluck('attendance_date')->unique()->count());
            $wPres = (int) round($weekRecords->where('status', 'present')->count() / $wDays);
            $wLate = (int) round($weekRecords->where('status', 'late')->count() / $wDays);
            $wAbsent = (int) round($weekRecords->where('status', 'absent')->count() / $wDays);
            $trends30d[] = [
                'label' => 'Week ' . (4 - $w),
                'date' => $wStart->format('M d') . ' - ' . $wEnd->format('M d'),
                'present' => $wPres,
                'late' => $wLate,
                'absent' => $wAbsent,
            ];
        }

        $trends3m = [];
        for ($m = 2; $m >= 0; $m--) {
            $mDate = $today->copy()->subMonths($m);
            $mRecords = AttendanceRecord::whereMonth('attendance_date', $mDate->month)
                ->whereYear('attendance_date', $mDate->year)
                ->get();
            $workDays = max(1, $mRecords->pluck('attendance_date')->unique()->count());
            $mPres = (int) round($mRecords->where('status', 'present')->count() / $workDays);
            $mLate = (int) round($mRecords->where('status', 'late')->count() / $workDays);
            $mAbsent = (int) round($mRecords->where('status', 'absent')->count() / $workDays);
            $trends3m[] = [
                'label' => $mDate->format('M'),
                'present' => $mPres,
                'late' => $mLate,
                'absent' => $mAbsent,
            ];
        }

        $trends12m = [];
        for ($q = 3; $q >= 0; $q--) {
            $qDate = $today->copy()->subMonths($q * 3);
            $qLabel = 'Q' . ceil($qDate->month / 3);
            $qStart = $qDate->copy()->firstOfQuarter();
            $qEnd = $qDate->copy()->lastOfQuarter();
            $qRecords = AttendanceRecord::whereBetween('attendance_date', [$qStart->toDateString(), $qEnd->toDateString()])->get();
            $qDays = max(1, $qRecords->pluck('attendance_date')->unique()->count());
            $qPres = (int) round($qRecords->where('status', 'present')->count() / $qDays);
            $qLate = (int) round($qRecords->where('status', 'late')->count() / $qDays);
            $qAbsent = (int) round($qRecords->where('status', 'absent')->count() / $qDays);
            $trends12m[] = [
                'label' => $qLabel,
                'date' => $qLabel . ' ' . $qDate->year,
                'present' => $qPres,
                'late' => $qLate,
                'absent' => $qAbsent,
            ];
        }

        $attendanceDatasets = [
            '7d' => $attendanceTrends,
            '30d' => $trends30d,
            '3m' => $trends3m,
            '12m' => $trends12m,
        ];

        // 11. Upcoming Expiring Contracts (Contracts ending today or in future)
        $expiringContracts = Employee::with(['primaryAssignment.department', 'primaryAssignment.position'])
            ->whereIn('employment_status', ['active', 'probation'])
            ->whereNotNull('contract_end_date')
            ->where('contract_end_date', '>=', $today->toDateString())
            ->orderBy('contract_end_date', 'asc')
            ->take(5)
            ->get()
            ->map(function ($emp) use ($today) {
                $endDate = Carbon::parse($emp->contract_end_date);
                $days = (int) $today->diffInDays($endDate, false);
                return [
                    'id' => $emp->id,
                    'name' => $emp->full_name,
                    'employee_code' => $emp->employee_code,
                    'department' => $emp->primaryAssignment?->department?->name ?? 'បុគ្គលិកទូទៅ',
                    'position' => $emp->primaryAssignment?->position?->name ?? 'ឯកទេស',
                    'contract_end_date' => $endDate->format('M d, Y'),
                    'days_remaining' => $days,
                    'avatar_url' => $emp->avatar_url,
                ];
            });

        // 12. Probation Review Alerts (Employees with upcoming probation ends)
        $probationReviews = Employee::with(['primaryAssignment.department', 'primaryAssignment.position'])
            ->where('employment_status', 'probation')
            ->orWhere(function ($q) use ($today) {
                $q->whereNotNull('probation_end_date')
                  ->where('probation_end_date', '>=', $today->toDateString());
            })
            ->whereNotIn('employment_status', ['terminated', 'resigned'])
            ->orderBy('probation_end_date', 'asc')
            ->take(5)
            ->get()
            ->map(function ($emp) use ($today) {
                $endDate = $emp->probation_end_date ? Carbon::parse($emp->probation_end_date) : $today->copy()->addDays(30);
                $days = (int) $today->diffInDays($endDate, false);
                return [
                    'id' => $emp->id,
                    'name' => $emp->full_name,
                    'employee_code' => $emp->employee_code,
                    'department' => $emp->primaryAssignment?->department?->name ?? 'បុគ្គលិកទូទៅ',
                    'position' => $emp->primaryAssignment?->position?->name ?? 'បុគ្គលិក',
                    'probation_end_date' => $endDate->format('M d, Y'),
                    'days_remaining' => $days,
                    'avatar_url' => $emp->avatar_url,
                ];
            });

        // 13. New Joiners (Recently onboarded employees)
        $newJoiners = Employee::with(['primaryAssignment.department', 'primaryAssignment.position'])
            ->whereIn('employment_status', ['active', 'probation'])
            ->orderBy('join_date', 'desc')
            ->take(5)
            ->get()
            ->map(fn ($emp) => [
                'id' => $emp->id,
                'name' => $emp->full_name,
                'employee_code' => $emp->employee_code,
                'department' => $emp->primaryAssignment?->department?->name ?? 'បុគ្គលិកទូទៅ',
                'position' => $emp->primaryAssignment?->position?->name ?? 'បុគ្គលិក',
                'join_date' => $emp->join_date ? Carbon::parse($emp->join_date)->format('M d, Y') : 'Recent',
                'avatar_url' => $emp->avatar_url,
            ]);

        // 14. Today Attendance Exceptions (Late / On Leave)
        $todayExceptions = [
            'late' => AttendanceRecord::with('employee')
                ->where('attendance_date', $today->toDateString())
                ->where('status', 'late')
                ->take(5)
                ->get()
                ->map(fn ($rec) => [
                    'id' => $rec->id,
                    'name' => $rec->employee?->full_name ?? 'Employee',
                    'avatar_url' => $rec->employee?->avatar_url,
                    'check_in_time' => $rec->check_in_time ? Carbon::parse($rec->check_in_time)->format('h:i A') : '--:--',
                    'late_minutes' => $rec->late_minutes ?? 15,
                ]),
            'on_leave' => AttendanceRecord::with('employee')
                ->where('attendance_date', $today->toDateString())
                ->where('status', 'on_leave')
                ->take(5)
                ->get()
                ->map(fn ($rec) => [
                    'id' => $rec->id,
                    'name' => $rec->employee?->full_name ?? 'Employee',
                    'avatar_url' => $rec->employee?->avatar_url,
                    'notes' => $rec->notes ?? 'Approved Leave',
                ]),
        ];

        return response()->json([
            'metrics' => [
                'total_employees' => $totalEmployees,
                'active_employees' => $activeEmployees,
                'probation_employees' => $probationEmployees,
                'inactive_employees' => $inactiveEmployees,
                'today_present' => $presentToday,
                'today_late' => $lateToday,
                'today_absent' => $absentToday,
                'today_on_leave' => $onLeaveToday,
                'pending_leave_count' => LeaveRequest::whereIn('status', ['pending_supervisor', 'pending_hr'])->count(),
                'latest_payroll_gross' => $latestPayroll ? (float) $latestPayroll->total_gross : 0,
                'latest_payroll_net' => $latestPayroll ? (float) $latestPayroll->total_net : 0,
                'latest_payroll_currency' => $latestPayroll?->currency ?? 'USD',
            ],
            'departments' => $departments,
            'gender_distribution' => $genderDistribution,
            'attendance_trends' => $attendanceTrends,
            'attendance_trends_datasets' => $attendanceDatasets,
            'pending_leaves' => $pendingLeaves,
            'upcoming_birthdays' => $upcomingBirthdays,
            'upcoming_holidays' => $upcomingHolidays,
            'announcements' => $announcements,
            'expiring_contracts' => $expiringContracts,
            'probation_reviews' => $probationReviews,
            'new_joiners' => $newJoiners,
            'today_exceptions' => $todayExceptions,
        ]);
    }
}

