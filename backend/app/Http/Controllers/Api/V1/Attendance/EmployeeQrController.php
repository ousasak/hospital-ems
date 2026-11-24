<?php

namespace App\Http\Controllers\Api\V1\Attendance;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\EmployeeQrCode;
use App\Models\Organization;
use App\Services\QrCode\QrCodeService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class EmployeeQrController extends Controller
{
    /**
     * Get employee's personal QR Code details, SVG, PNG, and lifecycle history
     */
    public function show(int $employeeId, Request $request): JsonResponse
    {
        $employee = Employee::with([
            'primaryAssignment.department',
            'primaryAssignment.position',
            'qrCodes.generatedBy',
            'qrCodes.revokedBy',
        ])->findOrFail($employeeId);

        $activeQr = $employee->qrCodes->firstWhere('status', 'active');
        $qrData = null;

        if ($activeQr) {
            // Note: Token hash is stored in DB. If employee table has qr_code_token cached,
            // or if needed we can display URL: /attendance/qr/{token}
            $token = $employee->qr_code_token ?? $activeQr->token_hash;
            $qrUrl = $this->buildAttendanceUrl($token);
            $svg = QrCodeService::toSvg($qrUrl, 300);
            $png = QrCodeService::toPngDataUri($qrUrl, 350);

            $qrData = [
                'id' => $activeQr->id,
                'status' => $activeQr->status,
                'generated_at' => $activeQr->generated_at->toIso8601String(),
                'expires_at' => $activeQr->expires_at?->toIso8601String(),
                'attendance_url' => $qrUrl,
                'svg' => $svg,
                'png_data_uri' => $png,
                'generated_by' => $activeQr->generatedBy?->name ?? 'System Admin',
            ];
        }

        $history = $employee->qrCodes->map(function ($code) {
            return [
                'id' => $code->id,
                'status' => $code->status,
                'generated_at' => $code->generated_at->toIso8601String(),
                'revoked_at' => $code->revoked_at?->toIso8601String(),
                'revocation_reason' => $code->revocation_reason,
                'generated_by' => $code->generatedBy?->name,
                'revoked_by' => $code->revokedBy?->name,
            ];
        });

        $payload = [
            'employee' => [
                'id' => $employee->id,
                'employee_code' => $employee->employee_code,
                'full_name' => $employee->full_name,
                'department' => $employee->primaryAssignment?->department?->name,
                'position' => $employee->primaryAssignment?->position?->title,
                'avatar_url' => $employee->avatar_url,
            ],
            'active_qr' => $qrData,
            'history' => $history,
        ];

        return response()->json(array_merge([
            'success' => true,
            'message' => 'Employee QR details retrieved successfully.',
            'data' => $payload,
        ], $payload));
    }

    /**
     * Generate or regenerate unique Personal QR Code for employee
     */
    public function generate(int $employeeId, Request $request): JsonResponse
    {
        $employee = Employee::findOrFail($employeeId);
        $user = $request->user();

        // 256-bit cryptographically secure random token
        $rawToken = bin2hex(random_bytes(32));
        $tokenHash = hash('sha256', $rawToken);
        $now = Carbon::now();
        $newQr = null;

        DB::transaction(function () use ($employee, $user, $rawToken, $tokenHash, $now, &$newQr) {
            // Revoke any existing active QR codes immediately
            EmployeeQrCode::where('employee_id', $employee->id)
                ->where('status', 'active')
                ->update([
                    'status' => 'revoked',
                    'revoked_at' => $now,
                    'revoked_by' => $user?->id ?? null,
                    'revocation_reason' => 'Superseded by new QR code generation',
                ]);

            // Create new active QR Code
            $newQr = EmployeeQrCode::create([
                'employee_id' => $employee->id,
                'token_hash' => $tokenHash,
                'status' => 'active',
                'generated_at' => $now,
                'generated_by' => $user?->id ?? null,
            ]);

            // Save raw token onto employee record for QR rendering
            $employee->update(['qr_code_token' => $rawToken]);
        });

        $qrUrl = $this->buildAttendanceUrl($rawToken);
        $svg = QrCodeService::toSvg($qrUrl, 300);
        $png = QrCodeService::toPngDataUri($qrUrl, 350);

        $activeQrData = [
            'id' => $newQr?->id,
            'status' => 'active',
            'generated_at' => $now->toIso8601String(),
            'attendance_url' => $qrUrl,
            'svg' => $svg,
            'png_data_uri' => $png,
            'generated_by' => $user?->name ?? 'System Admin',
        ];

        $employeeData = [
            'id' => $employee->id,
            'employee_code' => $employee->employee_code,
            'full_name' => $employee->full_name,
            'department' => $employee->primaryAssignment?->department?->name,
            'position' => $employee->primaryAssignment?->position?->title,
            'avatar_url' => $employee->avatar_url,
        ];

        $payload = [
            'message' => "Personal QR Code generated successfully for {$employee->full_name}.",
            'employee' => $employeeData,
            'active_qr' => $activeQrData,
        ];

        return response()->json(array_merge([
            'success' => true,
            'data' => $payload,
        ], $payload), 201);
    }

    /**
     * Regenerate personal QR code (alias to generate with audit tracking)
     */
    public function regenerate(int $employeeId, Request $request): JsonResponse
    {
        return $this->generate($employeeId, $request);
    }

    /**
     * Revoke compromised, lost, or deactivated QR Code immediately
     */
    public function revoke(int $employeeId, Request $request): JsonResponse
    {
        $request->validate([
            'reason' => 'nullable|string|max:255',
        ]);

        $employee = Employee::findOrFail($employeeId);
        $user = $request->user();
        $now = Carbon::now();

        DB::transaction(function () use ($employee, $user, $now, $request) {
            EmployeeQrCode::where('employee_id', $employee->id)
                ->where('status', 'active')
                ->update([
                    'status' => 'revoked',
                    'revoked_at' => $now,
                    'revoked_by' => $user?->id ?? null,
                    'revocation_reason' => $request->get('reason', 'Revoked by HR Administrator'),
                ]);

            $employee->update(['qr_code_token' => null]);
        });

        return response()->json([
            'success' => true,
            'message' => "Personal QR Code for {$employee->full_name} has been revoked immediately.",
            'data' => null,
        ]);
    }

    /**
     * Get complete printable Employee ID Card data
     */
    public function idCard(int $employeeId): JsonResponse
    {
        $employee = Employee::with([
            'primaryAssignment.department',
            'primaryAssignment.position',
            'emergencyContacts',
        ])->findOrFail($employeeId);

        $org = Organization::first();

        // Ensure active QR exists
        $rawToken = $employee->qr_code_token;
        if (!$rawToken) {
            $rawToken = bin2hex(random_bytes(32));
            $tokenHash = hash('sha256', $rawToken);
            $now = Carbon::now();

            EmployeeQrCode::create([
                'employee_id' => $employee->id,
                'token_hash' => $tokenHash,
                'status' => 'active',
                'generated_at' => $now,
                'generated_by' => auth()->id(),
            ]);

            $employee->update(['qr_code_token' => $rawToken]);
        }

        $qrUrl = $this->buildAttendanceUrl($rawToken);
        $svg = QrCodeService::toSvg($qrUrl, 260);
        $png = QrCodeService::toPngDataUri($qrUrl, 300);

        $payload = [
            'organization' => [
                'name' => $org?->name ?? 'មន្ទីរពេទ្យមិត្តភាពកម្ពុជា-ចិន ត្បូងឃ្មុំ',
                'legal_name' => $org?->legal_name ?? 'Cambodia-China Friendship Hospital',
                'logo_url' => $org?->logo_path ?? '/hospital-logo.png',
                'phone' => $org?->phone ?? '+855 42 941 234',
                'email' => $org?->email ?? 'contact@tbongkhmum-hospital.gov.kh',
                'address' => $org?->address ?? 'ផ្លូវជាតិលេខ ៧, ភូមិនិគមលើ, ឃុំស្រឡប់, ស្រុកត្បូងឃ្មុំ',
            ],
            'employee' => [
                'id' => $employee->id,
                'employee_code' => $employee->employee_code,
                'first_name' => $employee->first_name,
                'last_name' => $employee->last_name,
                'full_name' => $employee->full_name,
                'avatar_url' => $employee->avatar_url,
                'department' => $employee->primaryAssignment?->department?->name ?? 'Hospital Staff',
                'position' => $employee->primaryAssignment?->position?->title ?? 'Medical Personnel',
                'specialization' => $employee->specialization,
                'medical_license_number' => $employee->medical_license_number,
                'join_date' => $employee->join_date?->format('Y-m-d'),
                'national_id' => $employee->national_id,
                'blood_group' => $employee->emergencyContacts->first()?->relationship ?? null,
                'emergency_phone' => $employee->emergencyContacts->first()?->phone ?? $employee->phone,
            ],
            'qr' => [
                'attendance_url' => $qrUrl,
                'svg' => $svg,
                'png_data_uri' => $png,
            ],
        ];

        return response()->json(array_merge([
            'success' => true,
            'message' => 'Employee ID Card data retrieved successfully.',
            'data' => $payload,
        ], $payload));
    }

    private function buildAttendanceUrl(string $token): string
    {
        $base = config('app.url', 'http://localhost:5173');
        // If app.url is backend (port 8000), prefer frontend host if standard
        $frontendHost = env('FRONTEND_URL', 'http://localhost:5173');
        $url = rtrim($frontendHost, '/') . '/attendance/qr/' . $token;

        return $url;
    }
}

