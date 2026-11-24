<?php

namespace App\Http\Controllers\Api\V1\Organization;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\EmploymentType;
use App\Models\Organization;
use App\Models\Position;
use App\Models\WorkLocation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class OrganizationController extends Controller
{
    // Organization Profile
    public function getProfile(): JsonResponse
    {
        $org = Organization::first();
        return response()->json($org);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'legal_name' => 'nullable|string|max:255',
            'registration_number' => 'nullable|string|max:100',
            'tax_id' => 'nullable|string|max:100',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'website' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'default_currency' => 'required|string|max:10',
            'fiscal_year_start' => 'nullable|string|max:10',
        ]);

        $org = Organization::first();
        if ($org) {
            $org->update($validated);
        } else {
            $org = Organization::create($validated);
        }

        return response()->json([
            'message' => 'Organization profile updated successfully',
            'organization' => $org,
        ]);
    }

    // Departments
    public function departments(Request $request): JsonResponse
    {
        $query = Department::with([
                'parent:id,name,code',
                'manager.primaryAssignment.position:id,title',
                'positions:id,department_id,title,level',
            ])
            ->withCount([
                'activeAssignments as employee_count',
                'children as children_count',
            ]);

        if ($request->has('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                    ->orWhere('code', 'like', "%{$s}%");
            });
        }

        $departments = $query->orderBy('name')->get();
        return response()->json($departments);
    }

    public function storeDepartment(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:departments,code',
            'parent_id' => 'nullable|exists:departments,id',
            'manager_id' => 'nullable|exists:employees,id',
            'description' => 'nullable|string',
            'status' => 'required|string|in:active,inactive',
        ]);

        $dept = Department::create($validated);
        $dept->load(['parent', 'manager']);

        return response()->json([
            'message' => 'Department created successfully',
            'department' => $dept,
        ], 201);
    }

    public function updateDepartment(Request $request, $id): JsonResponse
    {
        $dept = Department::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:departments,code,' . $id,
            'parent_id' => 'nullable|different:id|exists:departments,id',
            'manager_id' => 'nullable|exists:employees,id',
            'description' => 'nullable|string',
            'status' => 'required|string|in:active,inactive',
        ]);

        if (!empty($validated['parent_id']) && $this->isDescendant($validated['parent_id'], (int) $id)) {
            return response()->json([
                'message' => 'Circular relationship detected: a department cannot report to its own subordinate unit.',
                'errors' => ['parent_id' => ['A department cannot report to its own subordinate unit.']],
            ], 422);
        }

        $dept->update($validated);
        $dept->load(['parent', 'manager']);

        return response()->json([
            'message' => 'Department updated successfully',
            'department' => $dept,
        ]);
    }

    public function destroyDepartment($id): JsonResponse
    {
        $dept = Department::findOrFail($id);
        $activeCount = $dept->activeAssignments()->count();
        if ($activeCount > 0) {
            return response()->json([
                'message' => "Cannot delete department because {$activeCount} employee(s) are currently assigned to it.",
            ], 422);
        }

        $dept->delete();
        return response()->json(['message' => 'Department deleted successfully']);
    }

    // Positions
    public function positions(Request $request): JsonResponse
    {
        $query = Position::with('department')
            ->withCount(['assignments as employee_count' => function ($q) {
                $q->where('status', 'active')->where('is_primary', true);
            }]);

        if ($request->has('department_id')) {
            $query->where('department_id', $request->department_id);
        }

        if ($request->has('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('title', 'like', "%{$s}%")
                    ->orWhere('code', 'like', "%{$s}%");
            });
        }

        $positions = $query->orderBy('title')->get();
        return response()->json($positions);
    }

    public function storePosition(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'department_id' => 'nullable|exists:departments,id',
            'title' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:positions,code',
            'description' => 'nullable|string',
            'level' => 'required|string|in:entry,mid,senior,lead,executive',
            'min_salary' => 'nullable|numeric|min:0',
            'max_salary' => 'nullable|numeric|min:0|gte:min_salary',
            'status' => 'required|string|in:active,inactive',
        ]);

        $position = Position::create($validated);
        $position->load('department');

        return response()->json([
            'message' => 'Position created successfully',
            'position' => $position,
        ], 201);
    }

    public function updatePosition(Request $request, $id): JsonResponse
    {
        $position = Position::findOrFail($id);

        $validated = $request->validate([
            'department_id' => 'nullable|exists:departments,id',
            'title' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:positions,code,' . $id,
            'description' => 'nullable|string',
            'level' => 'required|string|in:entry,mid,senior,lead,executive',
            'min_salary' => 'nullable|numeric|min:0',
            'max_salary' => 'nullable|numeric|min:0|gte:min_salary',
            'status' => 'required|string|in:active,inactive',
        ]);

        $position->update($validated);
        $position->load('department');

        return response()->json([
            'message' => 'Position updated successfully',
            'position' => $position,
        ]);
    }

    public function destroyPosition($id): JsonResponse
    {
        $pos = Position::findOrFail($id);
        $count = $pos->assignments()->where('status', 'active')->count();
        if ($count > 0) {
            return response()->json([
                'message' => "Cannot delete position because {$count} employee(s) hold this position.",
            ], 422);
        }

        $pos->delete();
        return response()->json(['message' => 'Position deleted successfully']);
    }

    // Work Locations
    public function workLocations(): JsonResponse
    {
        if (!Schema::hasTable('work_locations')) {
            return response()->json([]);
        }

        $locations = WorkLocation::withCount(['assignments as employee_count' => function ($q) {
            $q->where('status', 'active')->where('is_primary', true);
        }])->orderBy('is_headquarters', 'desc')->orderBy('name')->get();

        return response()->json($locations);
    }

    public function storeWorkLocation(Request $request): JsonResponse
    {
        if (!Schema::hasTable('work_locations')) {
            return response()->json(['message' => 'Work locations are not supported in this deployment.'], 400);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:work_locations,code',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'timezone' => 'required|string|max:100',
            'is_headquarters' => 'boolean',
            'status' => 'required|string|in:active,inactive',
        ]);

        $location = WorkLocation::create($validated);
        return response()->json(['message' => 'Work location created successfully', 'location' => $location], 201);
    }

    public function updateWorkLocation(Request $request, $id): JsonResponse
    {
        if (!Schema::hasTable('work_locations')) {
            return response()->json(['message' => 'Work locations are not supported in this deployment.'], 400);
        }

        $loc = WorkLocation::findOrFail($id);
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:work_locations,code,' . $id,
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'timezone' => 'required|string|max:100',
            'is_headquarters' => 'boolean',
            'status' => 'required|string|in:active,inactive',
        ]);

        $loc->update($validated);
        return response()->json(['message' => 'Work location updated successfully', 'location' => $loc]);
    }

    // Employment Types
    public function employmentTypes(): JsonResponse
    {
        $types = EmploymentType::orderBy('name')->get();
        return response()->json($types);
    }

    // Org Chart Tree
    public function orgChart(): JsonResponse
    {
        $allDepartments = Department::with([
                'manager.primaryAssignment.position',
                'positions:id,department_id,title,level',
            ])
            ->withCount(['activeAssignments as employee_count'])
            ->orderBy('name')
            ->get();

        $tree = $this->buildDepartmentTree($allDepartments);

        return response()->json($tree);
    }

    private function buildDepartmentTree($departments, $parentId = null, $level = 1): array
    {
        $branch = [];

        foreach ($departments as $department) {
            if ($department->parent_id == $parentId) {
                if ($department->id == $parentId) {
                    continue; // Safeguard against self-parenting
                }

                $node = $department->toArray();
                $node['level'] = $level;
                $children = $this->buildDepartmentTree($departments, $department->id, $level + 1);
                $node['children'] = $children;
                $node['children_count'] = count($children);

                $subtreeEmployeeCount = $department->employee_count ?? 0;
                foreach ($children as $child) {
                    $subtreeEmployeeCount += ($child['total_subtree_employees'] ?? $child['employee_count'] ?? 0);
                }
                $node['total_subtree_employees'] = $subtreeEmployeeCount;

                $branch[] = $node;
            }
        }

        return $branch;
    }

    private function isDescendant($parentId, $deptId): bool
    {
        $visited = [];
        $current = Department::find($parentId);
        while ($current && $current->parent_id) {
            if ($current->parent_id == $deptId) {
                return true;
            }
            if (in_array($current->id, $visited)) {
                break;
            }
            $visited[] = $current->id;
            $current = Department::find($current->parent_id);
        }
        return false;
    }
}

