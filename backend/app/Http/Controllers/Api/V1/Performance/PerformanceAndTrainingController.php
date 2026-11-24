<?php

namespace App\Http\Controllers\Api\V1\Performance;

use App\Http\Controllers\Controller;
use App\Models\EmployeeTraining;
use App\Models\PerformanceCriterion;
use App\Models\PerformanceReview;
use App\Models\TrainingProgram;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class PerformanceAndTrainingController extends Controller
{
    // Performance Reviews
    public function reviews(Request $request): JsonResponse
    {
        if (!Schema::hasTable('performance_reviews')) {
            return response()->json([]);
        }

        $query = PerformanceReview::with(['employee', 'reviewer', 'criteria']);

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        if ($request->filled('review_period')) {
            $query->where('review_period', $request->review_period);
        }

        return response()->json($query->orderBy('created_at', 'desc')->get());
    }

    public function storeReview(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'reviewer_id' => 'required|exists:employees,id',
            'review_period' => 'required|string|max:50',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'self_rating' => 'nullable|numeric|between:1,5',
            'reviewer_rating' => 'nullable|numeric|between:1,5',
            'strengths' => 'nullable|string',
            'improvements' => 'nullable|string',
            'goals' => 'nullable|string',
            'status' => 'required|string|in:draft,submitted,acknowledged,completed',
        ]);

        $review = PerformanceReview::create($validated);
        $review->load(['employee', 'reviewer']);

        return response()->json(['message' => 'Performance review created', 'review' => $review], 201);
    }

    public function addCriteria(Request $request, $reviewId): JsonResponse
    {
        $review = PerformanceReview::findOrFail($reviewId);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'weight' => 'required|integer|between:1,100',
            'score' => 'required|numeric|between:1,5',
            'comments' => 'nullable|string',
        ]);

        $criterion = $review->criteria()->create($validated);
        return response()->json(['message' => 'Criterion added', 'criterion' => $criterion], 201);
    }

    // Training Programs
    public function programs(Request $request): JsonResponse
    {
        if (!Schema::hasTable('training_programs')) {
            return response()->json([]);
        }

        $query = TrainingProgram::withCount('participants');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->orderBy('start_date', 'asc')->get());
    }

    public function storeProgram(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'instructor_name' => 'nullable|string|max:100',
            'duration_hours' => 'required|integer|min:1',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'max_participants' => 'required|integer|min:1',
            'location' => 'nullable|string|max:255',
            'status' => 'required|string|in:upcoming,in_progress,completed,cancelled',
        ]);

        $program = TrainingProgram::create($validated);
        return response()->json(['message' => 'Training program created', 'program' => $program], 201);
    }

    public function enroll(Request $request, $programId): JsonResponse
    {
        $program = TrainingProgram::findOrFail($programId);

        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
        ]);

        $exists = EmployeeTraining::where('training_program_id', $program->id)
            ->where('employee_id', $validated['employee_id'])
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'Employee is already enrolled in this program.'], 422);
        }

        $enrollment = EmployeeTraining::create([
            'training_program_id' => $program->id,
            'employee_id' => $validated['employee_id'],
            'enrollment_date' => now(),
            'attendance_status' => 'registered',
            'completion_status' => 'enrolled',
        ]);

        return response()->json(['message' => 'Employee enrolled in training', 'enrollment' => $enrollment], 201);
    }
}

