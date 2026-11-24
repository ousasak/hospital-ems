<?php

namespace App\Http\Controllers\Api\V1\Employees;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Position;
use App\Models\WorkLocation;
use App\Models\EmploymentType;
use App\Models\Employee;
use App\Models\EmployeeAssignment;
use App\Models\EmployeeContact;
use App\Models\EmployeeDocument;
use App\Models\EmployeeEducation;
use App\Models\EmployeeEmergencyContact;
use App\Models\EmployeeExperience;
use App\Models\EmployeeSalary;
use App\Models\LeaveBalance;
use App\Models\LeaveType;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class EmployeeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $withRelations = [
            'primaryAssignment.department',
            'primaryAssignment.position',
            'primaryAssignment.employmentType',
            'primaryAssignment.supervisor',
            'user',
        ];
        $hasWorkLocations = \Illuminate\Support\Facades\Schema::hasTable('work_locations');
        if ($hasWorkLocations) {
            $withRelations[] = 'primaryAssignment.workLocation';
        }
        if (\Illuminate\Support\Facades\Schema::hasTable('employee_salaries')) {
            $withRelations[] = 'currentSalary';
            $withRelations[] = 'salaries';
        }
        $query = Employee::with($withRelations);

        // Search
        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s, $hasWorkLocations) {
                $q->where('first_name', 'like', "%{$s}%")
                    ->orWhere('last_name', 'like', "%{$s}%")
                    ->orWhere('employee_code', 'like', "%{$s}%")
                    ->orWhere('email', 'like', "%{$s}%")
                    ->orWhere('phone', 'like', "%{$s}%")
                    ->orWhereHas('primaryAssignment.department', fn($dq) => $dq->where('name', 'like', "%{$s}%"))
                    ->orWhereHas('primaryAssignment.position', fn($pq) => $pq->where('title', 'like', "%{$s}%"));
                if ($hasWorkLocations) {
                    $q->orWhereHas('primaryAssignment.workLocation', fn($lq) => $lq->where('name', 'like', "%{$s}%")->orWhere('city', 'like', "%{$s}%"));
                }
            });
        }

        // Filters
        if ($request->filled('status')) {
            $statusVal = strtolower($request->status);
            $query->where('employment_status', $statusVal);
        }

        if ($request->filled('country')) {
            $country = $request->country;
            $query->where(function ($q) use ($country, $hasWorkLocations) {
                $q->where('nationality', 'like', "%{$country}%");
                if ($hasWorkLocations) {
                    $q->orWhereHas('primaryAssignment.workLocation', fn($lq) => $lq->where('country', 'like', "%{$country}%"));
                }
            });
        }

        if ($request->filled('office') && $hasWorkLocations) {
            $office = $request->office;
            $query->whereHas('primaryAssignment.workLocation', function ($q) use ($office) {
                $q->where('name', $office);
            });
        }

        if ($request->filled('type')) {
            $type = $request->type;
            $query->whereHas('primaryAssignment.employmentType', function ($q) use ($type) {
                $q->where('name', $type);
            });
        }

        if ($request->filled('department')) {
            $deptName = $request->department;
            $query->whereHas('primaryAssignment.department', function ($q) use ($deptName) {
                $q->where('name', $deptName);
            });
        }

        if ($request->filled('gender')) {
            $query->where('gender', $request->gender);
        }

        if ($request->filled('department_id')) {
            $deptId = $request->department_id;
            $query->whereHas('assignments', function ($q) use ($deptId) {
                $q->where('department_id', $deptId)
                    ->where('is_primary', true)
                    ->where('status', 'active');
            });
        }

        if ($request->filled('position_id')) {
            $posId = $request->position_id;
            $query->whereHas('assignments', function ($q) use ($posId) {
                $q->where('position_id', $posId)
                    ->where('is_primary', true)
                    ->where('status', 'active');
            });
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortDir = $request->get('sort_dir', 'desc');
        $allowedSorts = ['id', 'employee_code', 'first_name', 'last_name', 'join_date', 'employment_status', 'created_at'];

        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir === 'asc' ? 'asc' : 'desc');
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $perPage = (int) $request->get('per_page', 10);
        $employees = $query->paginate($perPage);

        return response()->json($employees);
    }

    public function show($id): JsonResponse
    {
        $showRelations = [
            'user.roles',
            'primaryAssignment.department',
            'primaryAssignment.position',
            'primaryAssignment.employmentType',
            'primaryAssignment.supervisor',
            'assignments.department',
            'assignments.position',
            'assignments.employmentType',
            'assignments.supervisor',
            'contacts',
            'emergencyContacts',
            'educations',
            'documents',
            'attendanceRecords' => fn ($q) => $q->orderBy('attendance_date', 'desc')->take(30),
            'leaveBalances.leaveType',
            'leaveRequests.leaveType',
        ];

        if (\Illuminate\Support\Facades\Schema::hasTable('work_locations')) {
            $showRelations[] = 'primaryAssignment.workLocation';
            $showRelations[] = 'assignments.workLocation';
        }
        if (\Illuminate\Support\Facades\Schema::hasTable('employee_salaries')) {
            $showRelations[] = 'currentSalary';
            $showRelations[] = 'salaries.salaryStructure';
        }
        if (\Illuminate\Support\Facades\Schema::hasTable('payrolls')) {
            $showRelations[] = 'payrollItems.payroll';
        }

        $employee = Employee::with($showRelations)->findOrFail($id);

        return response()->json($employee);
    }

    public function store(Request $request): JsonResponse
    {
        if ($request->has('name') && !$request->has('first_name')) {
            $parts = explode(' ', trim($request->input('name')), 2);
            $request->merge([
                'first_name' => $parts[0] ?? 'Employee',
                'last_name' => $parts[1] ?? 'Staff',
            ]);
        }
        if (!$request->has('gender')) {
            $request->merge(['gender' => 'male']);
        }
        if (!$request->has('join_date')) {
            $request->merge(['join_date' => now()->toDateString()]);
        }
        if (!$request->has('employment_status')) {
            $request->merge(['employment_status' => 'active']);
        }
        if ($request->filled('department') && !$request->filled('department_id')) {
            $dept = Department::firstOrCreate(
                ['name' => $request->department],
                ['code' => strtoupper(substr(preg_replace('/[^a-zA-Z]/', '', $request->department), 0, 4)), 'status' => 'active']
            );
            $request->merge(['department_id' => $dept->id]);
        }
        if ($request->filled('title') && !$request->filled('position_id')) {
            $pos = Position::firstOrCreate(
                ['title' => $request->title],
                ['code' => strtoupper(substr(preg_replace('/[^a-zA-Z]/', '', $request->title), 0, 4)), 'department_id' => $request->department_id ?? 1, 'status' => 'active']
            );
            $request->merge(['position_id' => $pos->id]);
        }
        if ($request->filled('office') && !$request->filled('work_location_id') && \Illuminate\Support\Facades\Schema::hasTable('work_locations')) {
            $loc = WorkLocation::firstOrCreate(
                ['name' => $request->office],
                ['code' => strtoupper(substr(preg_replace('/[^a-zA-Z]/', '', $request->office), 0, 6)), 'city' => $request->city ?: 'HQ', 'country' => $request->country ?: 'Global', 'status' => 'active']
            );
            $request->merge(['work_location_id' => $loc->id]);
        }
        if ($request->filled('type') && !$request->filled('employment_type_id')) {
            $empType = EmploymentType::firstOrCreate(
                ['name' => $request->type],
                ['code' => strtoupper(substr($request->type, 0, 2)), 'is_active' => true]
            );
            $request->merge(['employment_type_id' => $empType->id]);
        }
        if (!$request->filled('department_id')) {
            $firstDept = Department::first();
            if ($firstDept) $request->merge(['department_id' => $firstDept->id]);
        }
        if (!$request->filled('position_id')) {
            $firstPos = Position::first();
            if ($firstPos) $request->merge(['position_id' => $firstPos->id]);
        }

        $validated = $request->validate([
            'employee_code' => 'nullable|string|max:50|unique:employees,employee_code',
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'gender' => 'required|string|in:male,female,other',
            'date_of_birth' => 'nullable|date',
            'marital_status' => 'nullable|string|max:30',
            'nationality' => 'nullable|string|max:100',
            'national_id' => 'nullable|string|max:50',
            'passport_number' => 'nullable|string|max:50',
            'medical_license_number' => 'nullable|string|max:50',
            'license_expiry_date' => 'nullable|date',
            'specialization' => 'nullable|string|max:100',
            'avatar_url' => 'nullable|string',
            'avatar' => 'nullable',
            'email' => 'required|email|max:255|unique:employees,email',
            'phone' => 'nullable|string|max:50',
            'personal_email' => 'nullable|email|max:255',
            'join_date' => 'required|date',
            'probation_end_date' => 'nullable|date|after_or_equal:join_date',
            'contract_end_date' => 'nullable|date|after_or_equal:join_date',
            'employment_status' => 'required|string|in:active,probation,suspended,terminated,resigned',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'bank_name' => 'nullable|string|max:100',
            'bank_account_name' => 'nullable|string|max:100',
            'bank_account_number' => 'nullable|string|max:100',
            
            // Assignment fields
            'department_id' => 'required|exists:departments,id',
            'position_id' => 'required|exists:positions,id',
            'work_location_id' => 'nullable',
            'supervisor_id' => 'nullable|exists:employees,id',
            'employment_type_id' => 'nullable|exists:employment_types,id',
            'base_salary' => 'nullable|numeric|min:0',

            // Optional user account creation
            'create_user_account' => 'boolean',
            'user_role' => 'nullable|string|exists:roles,name',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            // 1. Generate code if empty
            if (empty($validated['employee_code'])) {
                $lastId = Employee::max('id') ?? 0;
                $validated['employee_code'] = 'EMP-' . sprintf('%03d', $lastId + 1);
            }

            // 2. Create user if requested
            $userId = null;
            if ($request->boolean('create_user_account')) {
                $user = User::create([
                    'name' => $validated['first_name'] . ' ' . $validated['last_name'],
                    'email' => $validated['email'],
                    'password' => Hash::make('1234567'),
                    'email_verified_at' => now(),
                ]);
                $role = $validated['user_role'] ?? 'Employee';
                $user->assignRole($role);
                $userId = $user->id;
            }

            $validated['user_id'] = $userId;
            $validated['qr_code_token'] = bin2hex(random_bytes(16));
            $validated['avatar_url'] = $this->processAvatar($request);
            unset($validated['avatar']);

            // 3. Create employee record
            $employee = Employee::create($validated);

            // 4. Create primary assignment (Module 04)
            $assignmentData = [
                'employee_id' => $employee->id,
                'department_id' => $validated['department_id'],
                'position_id' => $validated['position_id'],
                'supervisor_id' => $validated['supervisor_id'] ?? null,
                'employment_type_id' => $validated['employment_type_id'] ?? null,
                'start_date' => $validated['join_date'],
                'end_date' => null,
                'is_primary' => true,
                'status' => 'active',
                'notes' => 'Initial onboarding primary assignment',
            ];
            if (\Illuminate\Support\Facades\Schema::hasColumn('employee_assignments', 'work_location_id') && !empty($validated['work_location_id'])) {
                $assignmentData['work_location_id'] = $validated['work_location_id'];
            }
            EmployeeAssignment::create($assignmentData);

            // 5. Create initial base salary if employee_salaries table exists
            if (!empty($validated['base_salary']) && \Illuminate\Support\Facades\Schema::hasTable('employee_salaries')) {
                EmployeeSalary::create([
                    'employee_id' => $employee->id,
                    'base_salary' => $validated['base_salary'],
                    'currency' => 'USD',
                    'effective_date' => $validated['join_date'],
                    'status' => 'active',
                ]);
            }

            // 6. Initialize standard leave balances for the current year
            $leaveTypes = LeaveType::where('status', 'active')->get();
            $currentYear = Carbon::now()->year;
            foreach ($leaveTypes as $lt) {
                LeaveBalance::create([
                    'employee_id' => $employee->id,
                    'leave_type_id' => $lt->id,
                    'year' => $currentYear,
                    'total_days' => $lt->default_days_per_year,
                    'used_days' => 0.00,
                    'pending_days' => 0.00,
                    'remaining_days' => $lt->default_days_per_year,
                ]);
            }

            $loadCreated = ['primaryAssignment.department', 'primaryAssignment.position'];
            if (\Illuminate\Support\Facades\Schema::hasTable('work_locations')) {
                $loadCreated[] = 'primaryAssignment.workLocation';
            }
            $employee->load($loadCreated);

            return response()->json([
                'message' => 'Employee created successfully',
                'employee' => $employee,
            ], 201);
        });
    }

    public function update(Request $request, $id): JsonResponse
    {
        $employee = Employee::findOrFail($id);

        if ($request->has('name') && !$request->has('first_name')) {
            $parts = explode(' ', trim($request->input('name')), 2);
            $request->merge([
                'first_name' => $parts[0] ?? 'Employee',
                'last_name' => $parts[1] ?? ($employee->last_name ?: 'Staff'),
            ]);
        }
        if (!$request->has('employee_code')) {
            $request->merge(['employee_code' => $employee->employee_code]);
        }
        if (!$request->has('gender')) {
            $request->merge(['gender' => $employee->gender ?: 'male']);
        }
        if (!$request->has('join_date')) {
            $request->merge(['join_date' => $employee->join_date ? $employee->join_date->toDateString() : now()->toDateString()]);
        }
        if (!$request->has('employment_status')) {
            $request->merge(['employment_status' => $employee->employment_status ?: 'active']);
        }
        if (!$request->has('email')) {
            $request->merge(['email' => $employee->email]);
        }
        if ($request->filled('department') && !$request->filled('department_id')) {
            $dept = Department::firstOrCreate(
                ['name' => $request->department],
                ['code' => strtoupper(substr(preg_replace('/[^a-zA-Z]/', '', $request->department), 0, 4)), 'status' => 'active']
            );
            $request->merge(['department_id' => $dept->id]);
        }
        if ($request->filled('title') && !$request->filled('position_id')) {
            $pos = Position::firstOrCreate(
                ['title' => $request->title],
                ['code' => strtoupper(substr(preg_replace('/[^a-zA-Z]/', '', $request->title), 0, 4)), 'department_id' => $request->department_id ?? $employee->primaryAssignment?->department_id ?? 1, 'status' => 'active']
            );
            $request->merge(['position_id' => $pos->id]);
        }
        if ($request->filled('office') && !$request->filled('work_location_id') && \Illuminate\Support\Facades\Schema::hasTable('work_locations')) {
            $loc = WorkLocation::firstOrCreate(
                ['name' => $request->office],
                ['code' => strtoupper(substr(preg_replace('/[^a-zA-Z]/', '', $request->office), 0, 6)), 'city' => $request->city ?: 'HQ', 'country' => $request->country ?: 'Global', 'status' => 'active']
            );
            $request->merge(['work_location_id' => $loc->id]);
        }
        if ($request->filled('type') && !$request->filled('employment_type_id')) {
            $empType = EmploymentType::firstOrCreate(
                ['name' => $request->type],
                ['code' => strtoupper(substr($request->type, 0, 2)), 'is_active' => true]
            );
            $request->merge(['employment_type_id' => $empType->id]);
        }

        $validated = $request->validate([
            'employee_code' => 'required|string|max:50|unique:employees,employee_code,' . $id,
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'gender' => 'required|string|in:male,female,other',
            'date_of_birth' => 'nullable|date',
            'marital_status' => 'nullable|string|max:30',
            'nationality' => 'nullable|string|max:100',
            'national_id' => 'nullable|string|max:50',
            'passport_number' => 'nullable|string|max:50',
            'medical_license_number' => 'nullable|string|max:50',
            'license_expiry_date' => 'nullable|date',
            'specialization' => 'nullable|string|max:100',
            'avatar_url' => 'nullable|string',
            'avatar' => 'nullable',
            'email' => 'required|email|max:255|unique:employees,email,' . $id,
            'phone' => 'nullable|string|max:50',
            'personal_email' => 'nullable|email|max:255',
            'join_date' => 'required|date',
            'probation_end_date' => 'nullable|date',
            'contract_end_date' => 'nullable|date',
            'employment_status' => 'required|string|in:active,probation,suspended,terminated,resigned',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'bank_name' => 'nullable|string|max:100',
            'bank_account_name' => 'nullable|string|max:100',
            'bank_account_number' => 'nullable|string|max:100',
            'base_salary' => 'nullable|numeric|min:0',
            'department_id' => 'nullable|exists:departments,id',
            'position_id' => 'nullable|exists:positions,id',
            'work_location_id' => 'nullable',
            'supervisor_id' => 'nullable|exists:employees,id',
            'employment_type_id' => 'nullable|exists:employment_types,id',
        ]);

        $employeeUpdateData = $validated;
        unset(
            $employeeUpdateData['base_salary'],
            $employeeUpdateData['department_id'],
            $employeeUpdateData['position_id'],
            $employeeUpdateData['work_location_id'],
            $employeeUpdateData['supervisor_id'],
            $employeeUpdateData['employment_type_id'],
            $employeeUpdateData['avatar']
        );

        if ($request->has('avatar_url') || $request->has('avatar') || $request->hasFile('avatar') || $request->hasFile('avatar_file')) {
            $employeeUpdateData['avatar_url'] = $this->processAvatar($request, $employee->avatar_url);
        }

        $employee->update($employeeUpdateData);

        if ($request->filled('base_salary') && \Illuminate\Support\Facades\Schema::hasTable('employee_salaries')) {
            $salary = $employee->currentSalary;
            if ($salary) {
                $salary->update(['base_salary' => $request->base_salary]);
            } else {
                EmployeeSalary::create([
                    'employee_id' => $employee->id,
                    'base_salary' => $request->base_salary,
                    'currency' => 'USD',
                    'effective_date' => now()->toDateString(),
                    'status' => 'active',
                ]);
            }
        }

        if ($request->filled('department_id') || $request->filled('position_id') || $request->filled('employment_type_id') || $request->filled('supervisor_id')) {
            $assignment = $employee->primaryAssignment;
            $assignmentData = [
                'department_id' => $request->department_id,
                'position_id' => $request->position_id,
                'supervisor_id' => $request->supervisor_id,
                'employment_type_id' => $request->employment_type_id,
            ];
            if (\Illuminate\Support\Facades\Schema::hasColumn('employee_assignments', 'work_location_id') && $request->filled('work_location_id')) {
                $assignmentData['work_location_id'] = $request->work_location_id;
            }

            if ($assignment) {
                $assignment->update(array_filter($assignmentData, fn($val) => !is_null($val)));
            } else if ($request->filled('department_id') && $request->filled('position_id')) {
                EmployeeAssignment::create(array_merge($assignmentData, [
                    'employee_id' => $employee->id,
                    'start_date' => $employee->join_date,
                    'is_primary' => true,
                    'status' => 'active',
                ]));
            }
        }

        $loadUpdated = [
            'primaryAssignment.department',
            'primaryAssignment.position',
            'primaryAssignment.employmentType',
            'primaryAssignment.supervisor',
        ];
        if (\Illuminate\Support\Facades\Schema::hasTable('work_locations')) {
            $loadUpdated[] = 'primaryAssignment.workLocation';
        }
        $employee->load($loadUpdated);

        return response()->json([
            'message' => 'Employee updated successfully',
            'employee' => $employee,
        ]);
    }

    public function destroy($id): JsonResponse
    {
        $employee = Employee::findOrFail($id);
        $employee->delete(); // Soft delete

        return response()->json(['message' => 'Employee archived successfully']);
    }

    public function restore($id): JsonResponse
    {
        $employee = Employee::withTrashed()->findOrFail($id);
        $employee->restore();

        return response()->json(['message' => 'Employee restored successfully']);
    }

    // Sub-resources: Education, Experience, Emergency Contacts, Documents
    public function addEmergencyContact(Request $request, $id): JsonResponse
    {
        $employee = Employee::findOrFail($id);
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'relationship' => 'required|string|max:50',
            'phone' => 'required|string|max:50',
            'secondary_phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'is_primary' => 'boolean',
        ]);

        $contact = $employee->emergencyContacts()->create($validated);
        return response()->json(['message' => 'Emergency contact added', 'contact' => $contact], 201);
    }

    public function addEducation(Request $request, $id): JsonResponse
    {
        $employee = Employee::findOrFail($id);
        $validated = $request->validate([
            'degree_level' => 'required|string|max:100',
            'institution_name' => 'required|string|max:200',
            'field_of_study' => 'required|string|max:200',
            'start_year' => 'nullable|integer',
            'end_year' => 'nullable|integer',
            'grade_or_gpa' => 'nullable|string|max:50',
        ]);

        $edu = $employee->educations()->create($validated);
        return response()->json(['message' => 'Education record added', 'education' => $edu], 201);
    }

    public function addExperience(Request $request, $id): JsonResponse
    {
        $employee = Employee::findOrFail($id);
        $validated = $request->validate([
            'company_name' => 'required|string|max:200',
            'job_title' => 'required|string|max:200',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date',
            'responsibilities' => 'nullable|string',
            'reason_for_leaving' => 'nullable|string',
        ]);

        $exp = $employee->experiences()->create($validated);
        return response()->json(['message' => 'Work experience record added', 'experience' => $exp], 201);
    }

    public function uploadDocument(Request $request, $id): JsonResponse
    {
        $employee = Employee::findOrFail($id);
        $request->validate([
            'file' => 'required|file|max:10240', // 10MB
            'title' => 'required|string|max:255',
            'category' => 'required|string|max:50',
            'issue_date' => 'nullable|date',
            'expiry_date' => 'nullable|date',
        ]);

        $file = $request->file('file');
        $path = $file->store("documents/{$employee->id}", 'public');

        $doc = $employee->documents()->create([
            'title' => $request->title,
            'category' => $request->category,
            'file_path' => $path,
            'file_size' => $file->getSize(),
            'mime_type' => $file->getClientMimeType(),
            'issue_date' => $request->issue_date,
            'expiry_date' => $request->expiry_date,
            'status' => 'active',
        ]);

        return response()->json(['message' => 'Document uploaded successfully', 'document' => $doc], 201);
    }

    public function destroyDocument($employeeId, $docId): JsonResponse
    {
        $doc = EmployeeDocument::where('employee_id', $employeeId)->findOrFail($docId);
        Storage::disk('public')->delete($doc->file_path);
        $doc->delete();

        return response()->json(['message' => 'Document deleted successfully']);
    }

    public function exportCsv(): StreamedResponse
    {
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="employees_' . date('Y-m-d') . '.csv"',
        ];

        $callback = function () {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['Employee Code', 'Full Name', 'Gender', 'Email', 'Phone', 'Department', 'Position', 'Status', 'Join Date']);

            Employee::with(['primaryAssignment.department', 'primaryAssignment.position'])
                ->chunk(100, function ($employees) use ($file) {
                    foreach ($employees as $emp) {
                        fputcsv($file, [
                            $emp->employee_code,
                            $emp->full_name,
                            $emp->gender,
                            $emp->email,
                            $emp->phone,
                            $emp->primaryAssignment?->department?->name ?? 'N/A',
                            $emp->primaryAssignment?->position?->title ?? 'N/A',
                            $emp->employment_status,
                            $emp->join_date ? $emp->join_date->format('Y-m-d') : '',
                        ]);
                    }
                });

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Upload / update avatar directly
     */
    public function uploadAvatar(Request $request, $id): JsonResponse
    {
        $employee = Employee::findOrFail($id);

        $request->validate([
            'avatar' => 'nullable',
            'avatar_file' => 'nullable',
            'avatar_url' => 'nullable|string',
        ]);

        $avatarUrl = $this->processAvatar($request, $employee->avatar_url);
        $employee->update(['avatar_url' => $avatarUrl]);

        return response()->json([
            'message' => 'Avatar updated successfully',
            'avatar_url' => $avatarUrl,
            'employee' => $employee->fresh(),
        ]);
    }

    /**
     * Process avatar from uploaded file, base64 data URI, or URL path
     */
    protected function processAvatar(Request $request, ?string $existingAvatar = null): ?string
    {
        // 1. Direct file upload via multipart/form-data
        if ($request->hasFile('avatar')) {
            $file = $request->file('avatar');
            $path = $file->store('avatars', 'public');
            return '/storage/' . $path;
        }

        if ($request->hasFile('avatar_file')) {
            $file = $request->file('avatar_file');
            $path = $file->store('avatars', 'public');
            return '/storage/' . $path;
        }

        // 2. Base64 data URI string (e.g. data:image/png;base64,iVBOR...)
        $avatarInput = $request->input('avatar_url') ?? $request->input('avatar');
        if (is_string($avatarInput) && preg_match('/^data:image\/(\w+);base64,(.+)$/s', $avatarInput, $matches)) {
            $ext = strtolower($matches[1]);
            if ($ext === 'jpeg') $ext = 'jpg';
            if (!in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'])) {
                $ext = 'png';
            }
            $cleanBase64 = preg_replace('/\s+/', '', $matches[2]);
            $binary = base64_decode($cleanBase64);
            if ($binary !== false) {
                $filename = 'avatars/avatar_' . uniqid() . '_' . time() . '.' . $ext;
                Storage::disk('public')->put($filename, $binary);
                return '/storage/' . $filename;
            }
        }

        // 3. User explicitly cleared or removed avatar
        if ($request->has('avatar_url') && empty($avatarInput)) {
            if ($existingAvatar && str_starts_with($existingAvatar, '/storage/avatars/')) {
                $oldPath = str_replace('/storage/', '', $existingAvatar);
                Storage::disk('public')->delete($oldPath);
            }
            return null;
        }

        // 4. Existing string URL or path
        if (is_string($avatarInput) && !empty($avatarInput)) {
            return $avatarInput;
        }

        return $existingAvatar;
    }
}

