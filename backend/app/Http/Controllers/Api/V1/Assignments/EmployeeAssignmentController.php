<?php

namespace App\Http\Controllers\Api\V1\Assignments;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\EmployeeAssignment;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EmployeeAssignmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = EmployeeAssignment::with([
            'employee',
            'department',
            'position',
            'supervisor',
            'employmentType',
        ]);

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        if ($request->filled('department_id')) {
            $query->where('department_id', $request->department_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->boolean('is_primary_only')) {
            $query->where('is_primary', true);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $likeOp = DB::connection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';
            $query->where(function ($q) use ($search, $likeOp) {
                $q->whereHas('employee', function ($empQ) use ($search, $likeOp) {
                    $empQ->where('first_name', $likeOp, "%{$search}%")
                        ->orWhere('last_name', $likeOp, "%{$search}%")
                        ->orWhere('employee_code', $likeOp, "%{$search}%");
                })->orWhereHas('department', function ($deptQ) use ($search, $likeOp) {
                    $deptQ->where('name', $likeOp, "%{$search}%");
                })->orWhereHas('position', function ($posQ) use ($search, $likeOp) {
                    $posQ->where('title', $likeOp, "%{$search}%");
                });
            });
        }

        $assignments = $query->orderBy('start_date', 'desc')->paginate($request->get('per_page', 15));

        return response()->json($assignments);
    }

    public function getEmployeeHistory($employeeId): JsonResponse
    {
        $assignments = EmployeeAssignment::with([
            'department',
            'position',
            'supervisor',
            'employmentType',
        ])
            ->where('employee_id', $employeeId)
            ->orderBy('start_date', 'desc')
            ->get();

        return response()->json($assignments);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'department_id' => 'required|exists:departments,id',
            'position_id' => 'required|exists:positions,id',
            'supervisor_id' => 'nullable|exists:employees,id',
            'employment_type_id' => 'nullable|exists:employment_types,id',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'is_primary' => 'boolean',
            'status' => 'required|string|in:active,pending,ended,cancelled',
            'notes' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $startDate = Carbon::parse($validated['start_date']);
            $isPrimary = $request->boolean('is_primary', true);

            // If this is set as primary and active, automatically close any previous active primary assignment
            if ($isPrimary && $validated['status'] === 'active') {
                $previousPrimary = EmployeeAssignment::where('employee_id', $validated['employee_id'])
                    ->where('is_primary', true)
                    ->where('status', 'active')
                    ->where(function ($q) use ($startDate) {
                        $q->whereNull('end_date')->orWhere('end_date', '>=', $startDate->toDateString());
                    })
                    ->first();

                if ($previousPrimary) {
                    $previousPrimary->update([
                        'end_date' => $startDate->copy()->subDay()->toDateString(),
                        'status' => 'ended',
                        'is_primary' => false,
                        'notes' => ($previousPrimary->notes ? $previousPrimary->notes . "\n" : '') .
                            'Assignment ended due to transfer on ' . $startDate->toDateString(),
                    ]);
                }
            }

            $assignment = EmployeeAssignment::create(array_merge($validated, ['is_primary' => $isPrimary]));
            $assignment->load([
                'department',
                'position',
                'supervisor',
                'employmentType',
            ]);

            return response()->json([
                'message' => 'Employee assignment / transfer recorded successfully',
                'assignment' => $assignment,
            ], 201);
        });
    }

    public function update(Request $request, $id): JsonResponse
    {
        $assignment = EmployeeAssignment::findOrFail($id);

        $validated = $request->validate([
            'department_id' => 'required|exists:departments,id',
            'position_id' => 'required|exists:positions,id',
            'supervisor_id' => 'nullable|exists:employees,id',
            'employment_type_id' => 'nullable|exists:employment_types,id',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'is_primary' => 'boolean',
            'status' => 'required|string|in:active,pending,ended,cancelled',
            'notes' => 'nullable|string',
        ]);

        $assignment->update($validated);
        $assignment->load([
            'department',
            'position',
            'supervisor',
            'employmentType',
        ]);

        return response()->json([
            'message' => 'Employee assignment updated successfully',
            'assignment' => $assignment,
        ]);
    }

    public function destroy($id): JsonResponse
    {
        $assignment = EmployeeAssignment::findOrFail($id);
        
        // Ensure not deleting the sole primary active assignment without replacement
        if ($assignment->is_primary && $assignment->status === 'active') {
            $otherCount = EmployeeAssignment::where('employee_id', $assignment->employee_id)
                ->where('id', '!=', $id)
                ->count();
            if ($otherCount === 0) {
                return response()->json([
                    'message' => 'Cannot delete the only primary assignment for this employee. Please create a replacement assignment first.',
                ], 422);
            }
        }

        $assignment->delete();
        return response()->json(['message' => 'Assignment deleted successfully']);
    }
}

