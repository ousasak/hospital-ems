<?php

namespace App\Http\Controllers\Api\V1\Recruitment;

use App\Http\Controllers\Controller;
use App\Models\Candidate;
use App\Models\Employee;
use App\Models\EmployeeAssignment;
use App\Models\EmploymentType;
use App\Models\Interview;
use App\Models\JobApplication;
use App\Models\JobVacancy;
use App\Models\LeaveBalance;
use App\Models\LeaveType;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class RecruitmentController extends Controller
{
    // Vacancies
    public function vacancies(Request $request): JsonResponse
    {
        if (!Schema::hasTable('job_vacancies')) {
            return response()->json([]);
        }

        $query = JobVacancy::with(['department', 'position'])
            ->withCount('applications');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->orderBy('created_at', 'desc')->get());
    }

    public function storeVacancy(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'department_id' => 'required|exists:departments,id',
            'position_id' => 'required|exists:positions,id',
            'title' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:job_vacancies,code',
            'openings_count' => 'required|integer|min:1',
            'employment_type' => 'required|string|max:50',
            'experience_level' => 'required|string|max:50',
            'salary_range' => 'nullable|string|max:100',
            'description' => 'required|string',
            'requirements' => 'nullable|string',
            'closing_date' => 'nullable|date',
            'status' => 'required|string|in:draft,open,closed',
        ]);

        $vacancy = JobVacancy::create($validated);
        $vacancy->load(['department', 'position']);

        return response()->json(['message' => 'Job vacancy created', 'vacancy' => $vacancy], 201);
    }

    // Candidates
    public function candidates(Request $request): JsonResponse
    {
        if (!Schema::hasTable('candidates')) {
            return response()->json([
                'data' => [],
                'total' => 0,
                'current_page' => 1,
                'last_page' => 1,
                'per_page' => 15,
            ]);
        }

        $query = Candidate::with(['applications.vacancy.department', 'applications.interviews', 'hiredEmployee']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('first_name', 'like', "%{$s}%")
                    ->orWhere('last_name', 'like', "%{$s}%")
                    ->orWhere('email', 'like', "%{$s}%")
                    ->orWhere('phone', 'like', "%{$s}%");
            });
        }

        return response()->json($query->orderBy('created_at', 'desc')->paginate(15));
    }

    public function storeCandidate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:50',
            'source' => 'required|string|max:50',
            'current_company' => 'nullable|string|max:100',
            'current_salary' => 'nullable|numeric|min:0',
            'expected_salary' => 'nullable|numeric|min:0',
            'portfolio_url' => 'nullable|url',
            'vacancy_id' => 'required|exists:job_vacancies,id',
        ]);

        return DB::transaction(function () use ($validated) {
            $candidate = Candidate::create($validated);

            JobApplication::create([
                'job_vacancy_id' => $validated['vacancy_id'],
                'candidate_id' => $candidate->id,
                'application_date' => now(),
                'stage' => 'applied',
            ]);

            $candidate->load('applications.vacancy');
            return response()->json(['message' => 'Candidate added successfully', 'candidate' => $candidate], 201);
        });
    }

    public function updateCandidateStatus(Request $request, $id): JsonResponse
    {
        $request->validate([
            'status' => 'required|string|in:applied,screening,interview,offered,hired,rejected',
        ]);

        $cand = Candidate::findOrFail($id);
        $cand->update(['status' => $request->status]);

        return response()->json(['message' => 'Candidate status updated', 'candidate' => $cand]);
    }

    /**
     * Convert successful candidate into Employee Record (Module 08 requirement)
     */
    public function convertToEmployee(Request $request, $id): JsonResponse
    {
        $candidate = Candidate::findOrFail($id);

        $validated = $request->validate([
            'department_id' => 'required|exists:departments,id',
            'position_id' => 'required|exists:positions,id',
            'join_date' => 'required|date',
            'salary' => 'required|numeric|min:0',
            'work_location_id' => 'nullable|exists:work_locations,id',
            'supervisor_id' => 'nullable|exists:employees,id',
        ]);

        return DB::transaction(function () use ($candidate, $validated) {
            $lastId = Employee::max('id') ?? 0;
            $code = 'EMP-' . sprintf('%03d', $lastId + 1);

            $ftType = EmploymentType::where('code', 'FULL_TIME')->first();

            $employee = Employee::create([
                'employee_code' => $code,
                'first_name' => $candidate->first_name,
                'last_name' => $candidate->last_name,
                'email' => $candidate->email,
                'phone' => $candidate->phone,
                'join_date' => $validated['join_date'],
                'employment_status' => 'active',
                'qr_code_token' => bin2hex(random_bytes(16)),
            ]);

            // Create primary assignment
            EmployeeAssignment::create([
                'employee_id' => $employee->id,
                'department_id' => $validated['department_id'],
                'position_id' => $validated['position_id'],
                'work_location_id' => $validated['work_location_id'] ?? null,
                'supervisor_id' => $validated['supervisor_id'] ?? null,
                'employment_type_id' => $ftType?->id,
                'start_date' => $validated['join_date'],
                'is_primary' => true,
                'status' => 'active',
                'notes' => 'Hired via recruitment pipeline from candidate profile',
            ]);

            // Set leave balances
            $leaveTypes = LeaveType::where('status', 'active')->get();
            $year = Carbon::parse($validated['join_date'])->year;
            foreach ($leaveTypes as $lt) {
                LeaveBalance::create([
                    'employee_id' => $employee->id,
                    'leave_type_id' => $lt->id,
                    'year' => $year,
                    'total_days' => $lt->default_days_per_year,
                    'used_days' => 0.00,
                    'pending_days' => 0.00,
                    'remaining_days' => $lt->default_days_per_year,
                ]);
            }

            // Update candidate status to hired
            $candidate->update([
                'status' => 'hired',
                'hired_employee_id' => $employee->id,
            ]);

            return response()->json([
                'message' => "Candidate {$candidate->full_name} converted to Employee {$employee->employee_code} successfully",
                'employee' => $employee,
            ], 201);
        });
    }

    // Interviews
    public function scheduleInterview(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'job_application_id' => 'required|exists:job_applications,id',
            'interviewer_id' => 'nullable|exists:employees,id',
            'scheduled_at' => 'required|date',
            'duration_minutes' => 'required|integer|min:15',
            'meeting_type' => 'required|string|in:in_person,online,phone',
            'meeting_link_or_room' => 'nullable|string',
        ]);

        $interview = Interview::create($validated);
        return response()->json(['message' => 'Interview scheduled successfully', 'interview' => $interview], 201);
    }
}

