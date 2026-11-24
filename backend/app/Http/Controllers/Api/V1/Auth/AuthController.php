<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\User;
use App\Services\JwtAuthService;
use App\Services\LoginRateLimiterService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    use ApiResponseTrait;

    /**
     * Check active lockout status and remaining retry time for an account or IP
     */
    public function lockoutStatus(Request $request): JsonResponse
    {
        $identifier = $request->query('username') ?? $request->query('email');
        $clientIp = $request->ip() ?? '127.0.0.1';

        $status = LoginRateLimiterService::checkLockout($identifier, $clientIp);

        $headers = [];
        if ($status['locked'] && $status['retry_after'] > 0) {
            $headers['Retry-After'] = (string) $status['retry_after'];
            $headers['X-RateLimit-Reset'] = (string) (time() + $status['retry_after']);
        }

        return response()->json([
            'success' => true,
            'locked' => $status['locked'],
            'retry_after' => $status['retry_after'],
            'failed_attempts' => $status['failed_attempts'],
            'remaining_attempts' => $status['remaining_attempts'],
            'warning' => $status['warning'],
            'message' => $status['locked']
                ? "Account or network is temporarily locked. Please try again in {$status['retry_after']} seconds."
                : ($status['warning']
                    ? "Warning: Only 1 attempt remaining before your account is temporarily locked for 30 seconds."
                    : ""),
        ], 200, $headers);
    }

    /**
     * Authenticate user against real database records using secure hashing and JWT
     */
    public function login(Request $request): JsonResponse
    {
        // 1. Validate required fields
        $validator = Validator::make($request->all(), [
            'email' => 'required_without:username|string',
            'username' => 'required_without:email|string',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'The email/username and password fields are required.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $loginInput = trim($request->input('email') ?? $request->input('username'));
        $password = (string) $request->input('password');
        $clientIp = $request->ip() ?? '127.0.0.1';

        // 2. Check Lockout Status BEFORE database query or credential validation
        $lockStatus = LoginRateLimiterService::checkLockout($loginInput, $clientIp);
        if ($lockStatus['locked']) {
            return response()->json([
                'success' => false,
                'error_code' => 'ACCOUNT_LOCKED',
                'message' => "Too many failed login attempts. Please try again in {$lockStatus['retry_after']} seconds.",
                'locked' => true,
                'retry_after' => $lockStatus['retry_after'],
                'failed_attempts' => $lockStatus['failed_attempts'],
                'remaining_attempts' => 0,
                'warning' => false,
            ], 429, [
                'Retry-After' => (string) $lockStatus['retry_after'],
                'X-RateLimit-Reset' => (string) (time() + $lockStatus['retry_after']),
            ]);
        }

        // 3. Query real database record
        // Search by exact email
        $user = User::where('email', $loginInput)->first();

        // Fallback: search by Employee Code (e.g. TKH-0001 or EMP-001)
        if (!$user) {
            $employee = Employee::where('employee_code', $loginInput)->first();
            if ($employee && $employee->user_id) {
                $user = User::find($employee->user_id);
            }
        }

        // Fallback: search by exact Name
        if (!$user) {
            $user = User::where('name', $loginInput)->first();
        }

        // 4. Verify user existence and password hash
        if (!$user || !Hash::check($password, $user->password)) {
            $failStatus = LoginRateLimiterService::recordFailedAttempt($loginInput, $clientIp);

            if ($failStatus['locked']) {
                return response()->json([
                    'success' => false,
                    'error_code' => 'ACCOUNT_LOCKED',
                    'message' => "Too many failed login attempts. Account is temporarily locked. Please try again in {$failStatus['retry_after']} seconds.",
                    'locked' => true,
                    'retry_after' => $failStatus['retry_after'],
                    'failed_attempts' => $failStatus['failed_attempts'],
                    'remaining_attempts' => 0,
                    'warning' => false,
                ], 429, [
                    'Retry-After' => (string) $failStatus['retry_after'],
                    'X-RateLimit-Reset' => (string) (time() + $failStatus['retry_after']),
                ]);
            }

            $warningMessage = $failStatus['warning']
                ? " Warning: Only 1 attempt remaining before your account is temporarily locked for 30 seconds."
                : "";

            return response()->json([
                'success' => false,
                'error_code' => 'INVALID_CREDENTIALS',
                'message' => 'Invalid email or password.' . $warningMessage,
                'locked' => false,
                'retry_after' => 0,
                'failed_attempts' => $failStatus['failed_attempts'],
                'remaining_attempts' => $failStatus['remaining_attempts'],
                'warning' => $failStatus['warning'],
            ], 401);
        }

        // 5. Successful password match - Clear all failed attempts & locks immediately
        LoginRateLimiterService::clearLoginAttempts($loginInput, $clientIp);

        // 6. Check user status (Active vs Suspended / Inactive)
        $userStatus = $user->status ?? 'active';
        $employeeStatus = $user->employee?->employment_status ?? 'active';

        if (in_array(strtolower($userStatus), ['inactive', 'suspended', 'disabled']) ||
            in_array(strtolower($employeeStatus), ['inactive', 'suspended', 'terminated', 'resigned'])) {
            return response()->json([
                'success' => false,
                'message' => 'Your account has been deactivated or suspended. Please contact administrator.',
            ], 403);
        }

        // 5. Generate Real RFC 7519 JWT Token and Sanctum Access Token
        $ttl = (int) Config::get('jwt.ttl', 3600);
        $jwtToken = JwtAuthService::generate($user, $ttl);
        $sanctumToken = $user->createToken('staffstream-token')->plainTextToken;

        // 6. Eager load relations for complete authenticated profile
        $user->load([
            'roles.permissions',
            'employee.primaryAssignment.department',
            'employee.primaryAssignment.position',
            'employee.primaryAssignment.workLocation',
        ]);

        $roles = method_exists($user, 'getRoleNames') ? $user->getRoleNames() : collect([]);
        $permissions = method_exists($user, 'getAllPermissions') ? $user->getAllPermissions()->pluck('name') : collect([]);

        $userPayload = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'avatar_url' => $user->avatar_url,
            'role' => $roles->first() ?? 'Employee',
            'roles' => $roles,
            'permissions' => $permissions,
            'employee' => $user->employee,
        ];

        // 7. Return consistent, standards-compliant JSON response
        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'token' => $jwtToken,
            'access_token' => $jwtToken,
            'sanctum_token' => $sanctumToken,
            'token_type' => 'Bearer',
            'expires_in' => $ttl,
            'user' => $userPayload,
            'data' => [
                'user' => $userPayload,
                'access_token' => $jwtToken,
                'token' => $jwtToken,
                'token_type' => 'Bearer',
                'expires_in' => $ttl,
            ],
        ], 200);
    }

    /**
     * Get the authenticated user profile
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        if (!$user->employee) {
            $matchedEmp = Employee::where('email', $user->email)->first();
            if ($matchedEmp && !$matchedEmp->user_id) {
                $matchedEmp->user_id = $user->id;
                $matchedEmp->save();
            }
        }

        $user->load([
            'roles.permissions',
            'employee.primaryAssignment.department',
            'employee.primaryAssignment.position',
            'employee.primaryAssignment.workLocation',
            'employee.primaryAssignment.supervisor',
            'employee.emergencyContacts',
        ]);

        $roles = method_exists($user, 'getRoleNames') ? $user->getRoleNames() : collect([]);
        $permissions = method_exists($user, 'getAllPermissions') ? $user->getAllPermissions()->pluck('name') : collect([]);

        $userPayload = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'avatar_url' => $user->avatar_url,
            'role' => $roles->first() ?? 'Employee',
            'roles' => $roles,
            'permissions' => $permissions,
            'employee' => $user->employee,
        ];

        return response()->json([
            'success' => true,
            'user' => $userPayload,
            'data' => [
                'user' => $userPayload,
            ],
        ]);
    }

    /**
     * Refresh access tokens and issue a fresh JWT
     */
    public function refresh(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            $token = $request->bearerToken();
            if ($token) {
                $user = JwtAuthService::getUser($token);
            }
        }

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        // Invalidate previous JWT token if present
        $oldToken = $request->bearerToken();
        if ($oldToken) {
            JwtAuthService::invalidate($oldToken);
        }

        // Invalidate current sanctum token
        try {
            $user->currentAccessToken()?->delete();
        } catch (\Throwable $e) {
            // Ignore
        }

        $ttl = (int) Config::get('jwt.ttl', 3600);
        $newJwt = JwtAuthService::generate($user, $ttl);
        $newSanctum = $user->createToken('staffstream-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Token refreshed successfully',
            'token' => $newJwt,
            'access_token' => $newJwt,
            'token_type' => 'Bearer',
            'expires_in' => $ttl,
            'data' => [
                'access_token' => $newJwt,
                'token' => $newJwt,
                'token_type' => 'Bearer',
                'expires_in' => $ttl,
            ],
        ]);
    }

    /**
     * Log out by invalidating the current token
     */
    public function logout(Request $request): JsonResponse
    {
        $token = $request->bearerToken();
        if ($token) {
            JwtAuthService::invalidate($token);
        }

        $user = $request->user();
        if ($user) {
            try {
                $user->currentAccessToken()?->delete();
            } catch (\Throwable $e) {
                // Ignore
            }
        }

        try {
            auth()->guard('web')->logout();
            auth()->forgetGuards();
        } catch (\Throwable $e) {
            // Ignore
        }

        return response()->json([
            'success' => true,
            'message' => 'Successfully logged out',
        ]);
    }

    /**
     * Change authenticated user password
     */
    public function changePassword(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'The current password provided is incorrect.',
                'errors' => [
                    'current_password' => ['The current password provided is incorrect.'],
                ],
            ], 422);
        }

        $user->update([
            'password' => Hash::make($request->new_password),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Password updated successfully',
        ]);
    }

    /**
     * Update the authenticated user's personal profile and linked employee details
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $validated = $request->validate([
            'name' => 'nullable|string|max:100',
            'first_name' => 'nullable|string|max:100',
            'last_name' => 'nullable|string|max:100',
            'gender' => 'nullable|string|in:male,female,other,ប្រុស,ស្រី',
            'date_of_birth' => 'nullable|date',
            'city' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:50',
            'emergency_contact_name' => 'nullable|string|max:100',
            'avatar_url' => 'nullable|string',
            'department_id' => 'nullable|integer',
        ]);

        // Normalize gender
        $gender = $validated['gender'] ?? null;
        if ($gender === 'ប្រុស') {
            $gender = 'male';
        } elseif ($gender === 'ស្រី') {
            $gender = 'female';
        }

        // Avatar url update or file processing
        $avatarUrl = null;
        $avatarUpdated = false;

        if ($request->hasFile('avatar')) {
            $path = $request->file('avatar')->store('avatars', 'public');
            $avatarUrl = '/storage/' . $path;
            $avatarUpdated = true;
        } elseif ($request->has('avatar_url')) {
            $raw = $request->input('avatar_url');
            if (empty($raw)) {
                // Explicitly cleared / deleted avatar
                $avatarUrl = null;
                $avatarUpdated = true;
            } elseif (is_string($raw) && !str_starts_with($raw, 'blob:')) {
                if (preg_match('/^data:image\/(\w+);base64,(.+)$/s', $raw, $matches)) {
                    $ext = strtolower($matches[1]);
                    if ($ext === 'jpeg') $ext = 'jpg';
                    if (!in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'gif'])) $ext = 'png';
                    $binary = base64_decode(preg_replace('/\s+/', '', $matches[2]));
                    if ($binary !== false) {
                        $filename = 'avatars/avatar_' . uniqid() . '_' . time() . '.' . $ext;
                        \Illuminate\Support\Facades\Storage::disk('public')->put($filename, $binary);
                        $avatarUrl = '/storage/' . $filename;
                        $avatarUpdated = true;
                    }
                } else {
                    $avatarUrl = $raw;
                    $avatarUpdated = true;
                }
            }
        }

        if ($avatarUpdated) {
            $user->avatar_url = $avatarUrl;
        }

        // Update User name
        if (!empty($validated['name'])) {
            $user->name = $validated['name'];
        } elseif (!empty($validated['first_name']) || !empty($validated['last_name'])) {
            $user->name = trim(($validated['last_name'] ?? '') . ' ' . ($validated['first_name'] ?? ''));
        }
        $user->save();

        // Update or link employee record
        $employee = $user->employee;
        if (!$employee) {
            $employee = Employee::where('email', $user->email)->first();
            if ($employee && !$employee->user_id) {
                $employee->user_id = $user->id;
            }
        }

        if ($employee) {
            if ($avatarUpdated) {
                $employee->avatar_url = $avatarUrl;
            }
            if (isset($validated['first_name'])) {
                $employee->first_name = $validated['first_name'];
            }
            if (isset($validated['last_name'])) {
                $employee->last_name = $validated['last_name'];
            }
            if ($gender) {
                $employee->gender = $gender;
            }
            if (!empty($validated['date_of_birth'])) {
                $employee->date_of_birth = $validated['date_of_birth'];
            }
            if (isset($validated['city'])) {
                $employee->city = $validated['city'];
            }
            if (isset($validated['address'])) {
                $employee->address = $validated['address'];
            }
            if (isset($validated['phone'])) {
                $employee->phone = $validated['phone'];
            }
            $employee->save();

            // Handle emergency contact phone
            if (!empty($validated['emergency_contact_phone'])) {
                $employee->emergencyContacts()->updateOrCreate(
                    ['is_primary' => true],
                    [
                        'name' => $validated['emergency_contact_name'] ?? 'អាណាព្យាបាល / បន្ទាន់',
                        'relationship' => 'guardian',
                        'phone' => $validated['emergency_contact_phone'],
                        'is_primary' => true,
                    ]
                );
            }
        }

        // Reload user with relations
        $user->load([
            'roles.permissions',
            'employee.primaryAssignment.department',
            'employee.primaryAssignment.position',
            'employee.primaryAssignment.workLocation',
            'employee.emergencyContacts',
        ]);

        $roles = method_exists($user, 'getRoleNames') ? $user->getRoleNames() : collect([]);
        $permissions = method_exists($user, 'getAllPermissions') ? $user->getAllPermissions()->pluck('name') : collect([]);

        $userPayload = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'avatar_url' => $user->avatar_url,
            'role' => $roles->first() ?? 'Employee',
            'roles' => $roles,
            'permissions' => $permissions,
            'employee' => $user->employee,
        ];

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully.',
            'user' => $userPayload,
            'data' => [
                'user' => $userPayload,
            ],
        ]);
    }

    /**
     * Upload avatar for the authenticated user
     */
    public function uploadAvatar(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $request->validate([
            'avatar' => 'nullable|image|max:5120',
            'avatar_file' => 'nullable|image|max:5120',
        ]);

        $file = $request->file('avatar') ?? $request->file('avatar_file');
        if (!$file) {
            return response()->json(['success' => false, 'message' => 'No image file uploaded.'], 422);
        }

        $path = $file->store('avatars', 'public');
        $avatarUrl = '/storage/' . $path;

        $user->avatar_url = $avatarUrl;
        $user->save();

        $employee = $user->employee ?: Employee::where('email', $user->email)->first();
        if ($employee) {
            $employee->avatar_url = $avatarUrl;
            $employee->save();
        }

        return response()->json([
            'success' => true,
            'message' => 'Avatar updated successfully.',
            'avatar_url' => $avatarUrl,
            'data' => [
                'avatar_url' => $avatarUrl,
            ],
        ]);
    }

    /**
     * Remove avatar for the authenticated user and associated employee
     */
    public function removeAvatar(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        // Delete physical file if custom avatar
        if ($user->avatar_url && str_starts_with($user->avatar_url, '/storage/avatars/')) {
            $oldPath = str_replace('/storage/', '', $user->avatar_url);
            \Illuminate\Support\Facades\Storage::disk('public')->delete($oldPath);
        }

        $user->avatar_url = null;
        $user->save();

        $employee = $user->employee ?: Employee::where('email', $user->email)->first();
        if ($employee) {
            $employee->avatar_url = null;
            $employee->save();
        }

        return response()->json([
            'success' => true,
            'message' => 'Avatar removed successfully.',
            'avatar_url' => null,
            'data' => [
                'avatar_url' => null,
            ],
        ]);
    }
}
