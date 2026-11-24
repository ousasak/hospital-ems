<?php

namespace App\Http\Controllers\Api\V1\Users;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class UserManagementController extends Controller
{
    protected const SYSTEM_ROLES = [
        'Super Admin',
        'HR Manager',
        'HR Staff',
        'Department Manager',
        'Accountant',
        'Employee',
    ];

    public function index(Request $request): JsonResponse
    {
        $query = User::with([
            'roles.permissions',
            'employee.primaryAssignment.department',
            'employee.primaryAssignment.workLocation',
        ]);

        // Search by user name, email, or employee code/names
        if ($request->filled('search')) {
            $search = trim($request->get('search'));
            $lower = strtolower($search);
            $query->where(function ($q) use ($lower) {
                $q->whereRaw('LOWER(name) LIKE ?', ["%{$lower}%"])
                  ->orWhereRaw('LOWER(email) LIKE ?', ["%{$lower}%"])
                  ->orWhereHas('employee', function ($emp) use ($lower) {
                      $emp->whereRaw('LOWER(employee_code) LIKE ?', ["%{$lower}%"])
                          ->orWhereRaw('LOWER(first_name) LIKE ?', ["%{$lower}%"])
                          ->orWhereRaw('LOWER(last_name) LIKE ?', ["%{$lower}%"]);
                  });
            });
        }

        // Filter by role
        if ($request->filled('role')) {
            $role = $request->get('role');
            $query->whereHas('roles', function ($q) use ($role) {
                $q->where('name', $role);
            });
        }

        // Filter by branch / work location
        if ($request->filled('branch')) {
            $branch = $request->get('branch');
            $query->whereHas('employee.primaryAssignment', function ($q) use ($branch) {
                if (is_numeric($branch)) {
                    $q->where('work_location_id', $branch);
                } else {
                    $q->whereHas('workLocation', function ($wl) use ($branch) {
                        $wl->where('name', $branch);
                    });
                }
            });
        }

        // Filter by status (active vs inactive)
        if ($request->filled('status')) {
            $status = strtolower($request->get('status'));
            if ($status === 'active') {
                $query->where(function ($q) {
                    $q->whereNotNull('email_verified_at')
                      ->orWhereHas('employee', function ($emp) {
                          $emp->where('employment_status', 'Active');
                      });
                });
            } elseif ($status === 'inactive') {
                $query->where(function ($q) {
                    $q->whereNull('email_verified_at')
                      ->whereDoesntHave('employee', function ($emp) {
                          $emp->where('employment_status', 'Active');
                      });
                });
            }
        }

        // Sortable columns
        $sortBy = $request->get('sort_by', 'created_at');
        $sortDir = strtolower($request->get('sort_dir', 'desc')) === 'asc' ? 'asc' : 'desc';
        if (in_array($sortBy, ['id', 'name', 'email', 'created_at'])) {
            $query->orderBy($sortBy, $sortDir);
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $perPage = max(1, min(100, (int) $request->get('per_page', 15)));
        $users = $query->paginate($perPage);

        // Calculate global summary stats
        $totalUsers = User::count();
        $activeUsers = User::where(function ($q) {
            $q->whereNotNull('email_verified_at')
              ->orWhereHas('employee', fn($e) => $e->where('employment_status', 'Active'));
        })->count();

        $stats = [
            'total_users' => $totalUsers,
            'active_users' => $activeUsers,
            'inactive_users' => max(0, $totalUsers - $activeUsers),
            'total_roles' => Role::count(),
        ];

        $payload = $users->toArray();
        $payload['stats'] = $stats;

        return response()->json($payload);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => 'required|string|exists:roles,name',
            'status' => 'nullable|string|in:active,inactive',
            'employee_id' => 'nullable|integer|exists:employees,id',
        ]);

        $isActive = ($request->input('status') ?? 'active') === 'active';

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'email_verified_at' => $isActive ? now() : null,
        ]);

        $user->assignRole($validated['role']);

        // Link with selected employee if provided
        if (!empty($validated['employee_id'])) {
            $employee = Employee::find($validated['employee_id']);
            if ($employee) {
                $employee->update([
                    'user_id' => $user->id,
                    'employment_status' => $isActive ? 'Active' : 'Inactive',
                ]);
            }
        }

        $user->load([
            'roles.permissions',
            'employee.primaryAssignment.department',
            'employee.primaryAssignment.workLocation',
        ]);

        return response()->json([
            'message' => 'User created successfully',
            'user' => $user,
        ], 201);
    }

    public function show($id): JsonResponse
    {
        $user = User::with([
            'roles.permissions',
            'employee.primaryAssignment.department',
            'employee.primaryAssignment.workLocation',
            'employee.primaryAssignment.position',
        ])->findOrFail($id);

        return response()->json($user);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email,' . $id,
            'password' => 'nullable|string|min:6',
            'role' => 'nullable|string|exists:roles,name',
            'status' => 'nullable|string|in:active,inactive',
            'employee_id' => 'nullable|integer|exists:employees,id',
        ]);

        $updateData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
        ];

        if (!empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        if ($request->has('status')) {
            $isActive = strtolower($request->input('status')) === 'active';
            $updateData['email_verified_at'] = $isActive ? now() : null;
            if ($user->employee) {
                $user->employee->update([
                    'employment_status' => $isActive ? 'Active' : 'Inactive',
                ]);
            }
        }

        $user->update($updateData);

        if (!empty($validated['role'])) {
            $user->syncRoles([$validated['role']]);
        }

        if (array_key_exists('employee_id', $validated)) {
            if (!empty($validated['employee_id'])) {
                // Detach previous employee if needed
                Employee::where('user_id', $user->id)->update(['user_id' => null]);
                Employee::where('id', $validated['employee_id'])->update(['user_id' => $user->id]);
            }
        }

        $user->load([
            'roles.permissions',
            'employee.primaryAssignment.department',
            'employee.primaryAssignment.workLocation',
        ]);

        return response()->json([
            'message' => 'User updated successfully',
            'user' => $user,
        ]);
    }

    public function toggleStatus(Request $request, $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $newStatus = $request->input('status');

        if (!$newStatus) {
            $currentStatus = $user->status;
            $newStatus = $currentStatus === 'active' ? 'inactive' : 'active';
        }

        $isActive = strtolower($newStatus) === 'active';
        $user->update([
            'email_verified_at' => $isActive ? now() : null,
        ]);

        if ($user->employee) {
            $user->employee->update([
                'employment_status' => $isActive ? 'Active' : 'Inactive',
            ]);
        }

        $user->load([
            'roles.permissions',
            'employee.primaryAssignment.department',
            'employee.primaryAssignment.workLocation',
        ]);

        return response()->json([
            'message' => $isActive ? 'User activated successfully' : 'User deactivated successfully',
            'status' => $isActive ? 'active' : 'inactive',
            'user' => $user,
        ]);
    }

    public function resetPassword(Request $request, $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $validated = $request->validate([
            'password' => 'required|string|min:6',
        ]);

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        return response()->json([
            'message' => 'Password reset successfully',
        ]);
    }

    public function destroy($id): JsonResponse
    {
        $user = User::findOrFail($id);
        if ($user->hasRole('Super Admin') && User::role('Super Admin')->count() <= 1) {
            return response()->json(['message' => 'Cannot delete the only Super Admin user.'], 422);
        }

        // Unlink any associated employee
        Employee::where('user_id', $user->id)->update(['user_id' => null]);

        $user->delete();
        return response()->json(['message' => 'User deleted successfully']);
    }

    public function roles(): JsonResponse
    {
        $roles = Role::with('permissions')
            ->orderBy('id', 'asc')
            ->get();

        $userCounts = DB::table('model_has_roles')
            ->select('role_id', DB::raw('count(*) as aggregate'))
            ->groupBy('role_id')
            ->pluck('aggregate', 'role_id');

        $roles->transform(function ($role) use ($userCounts) {
            $role->is_system = in_array($role->name, self::SYSTEM_ROLES);
            $role->users_count = (int) ($userCounts[$role->id] ?? 0);
            return $role;
        });

        return response()->json($roles);
    }

    public function storeRole(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:roles,name',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        $role = Role::create([
            'name' => $validated['name'],
            'guard_name' => 'web',
        ]);

        if (!empty($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        }

        $role->load('permissions');
        $role->users_count = 0;
        $role->is_system = false;

        return response()->json([
            'message' => 'Role created successfully',
            'role' => $role,
        ], 201);
    }

    public function updateRole(Request $request, $id): JsonResponse
    {
        $role = Role::findOrFail($id);
        $isSystem = in_array($role->name, self::SYSTEM_ROLES);

        $validated = $request->validate([
            'name' => 'nullable|string|max:100|unique:roles,name,' . $id,
            'permissions' => 'nullable|array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        if ($isSystem && isset($validated['name']) && $validated['name'] !== $role->name) {
            return response()->json(['message' => 'System role names cannot be modified.'], 422);
        }

        if (isset($validated['name']) && !$isSystem) {
            $role->name = $validated['name'];
            $role->save();
        }

        if (isset($validated['permissions'])) {
            if ($role->name === 'Super Admin') {
                $role->syncPermissions(Permission::all());
            } else {
                $role->syncPermissions($validated['permissions']);
            }
        }

        $role->load('permissions');
        $role->users_count = (int) DB::table('model_has_roles')
            ->where('role_id', $role->id)
            ->count();
        $role->is_system = $isSystem;

        return response()->json([
            'message' => 'Role updated successfully',
            'role' => $role,
        ]);
    }

    public function destroyRole($id): JsonResponse
    {
        $role = Role::findOrFail($id);

        if (in_array($role->name, self::SYSTEM_ROLES)) {
            return response()->json([
                'message' => 'System roles cannot be deleted.',
            ], 422);
        }

        $usersCount = (int) DB::table('model_has_roles')
            ->where('role_id', $role->id)
            ->count();

        if ($usersCount > 0) {
            return response()->json([
                'message' => "Cannot delete role because it is currently assigned to {$usersCount} user(s).",
            ], 422);
        }

        $role->delete();

        return response()->json([
            'message' => 'Role deleted successfully',
        ]);
    }

    public function duplicateRole(Request $request, $id): JsonResponse
    {
        $sourceRole = Role::with('permissions')->findOrFail($id);

        $baseName = $request->input('name') ?: ($sourceRole->name . ' (Copy)');
        $newName = $baseName;
        $counter = 1;
        while (Role::where('name', $newName)->exists()) {
            $counter++;
            $newName = $baseName . " {$counter}";
        }

        $newRole = Role::create([
            'name' => $newName,
            'guard_name' => 'web',
        ]);

        $permissions = $sourceRole->permissions->pluck('name')->toArray();
        if (!empty($permissions)) {
            $newRole->syncPermissions($permissions);
        }

        $newRole->load('permissions');
        $newRole->users_count = 0;
        $newRole->is_system = false;

        return response()->json([
            'message' => 'Role duplicated successfully',
            'role' => $newRole,
        ], 201);
    }

    public function permissions(): JsonResponse
    {
        $permissions = Permission::orderBy('name', 'asc')->get();
        return response()->json($permissions);
    }

    public function syncUserRoles(Request $request, $id): JsonResponse
    {
        $request->validate([
            'roles' => 'required|array',
            'roles.*' => 'string|exists:roles,name',
        ]);

        $user = User::findOrFail($id);
        $user->syncRoles($request->roles);

        return response()->json(['message' => 'Roles updated', 'roles' => $user->getRoleNames()]);
    }
}
