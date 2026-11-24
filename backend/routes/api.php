<?php

use App\Http\Controllers\Api\V1\Assignments\EmployeeAssignmentController;
use App\Http\Controllers\Api\V1\Attendance\AttendanceController;
use App\Http\Controllers\Api\V1\Attendance\EmployeeQrController;
use App\Http\Controllers\Api\V1\Attendance\HospitalAttendanceSecurityController;
use App\Http\Controllers\Api\V1\Attendance\PersonalQrAttendanceController;
use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Dashboard\DashboardController;
use App\Http\Controllers\Api\V1\Documents\DocumentController;
use App\Http\Controllers\Api\V1\Employees\EmployeeController;
use App\Http\Controllers\Api\V1\Leave\LeaveController;
use App\Http\Controllers\Api\V1\Organization\OrganizationController;
use App\Http\Controllers\Api\V1\Payroll\PayrollController;
use App\Http\Controllers\Api\V1\Performance\PerformanceAndTrainingController;
use App\Http\Controllers\Api\V1\Recruitment\RecruitmentController;
use App\Http\Controllers\Api\V1\Reports\ReportsController;
use App\Http\Controllers\Api\V1\Settings\SettingsController;
use App\Http\Controllers\Api\V1\Users\UserManagementController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| StaffStream EMS RESTful API Routes (v1)
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {

    // Public / Authentication
    Route::prefix('auth')->group(function () {
        Route::post('/login', [AuthController::class, 'login']);
        Route::get('/lockout-status', [AuthController::class, 'lockoutStatus']);
    });

    // Public Organization branding & settings (for login page / header)
    Route::get('/public-settings', [SettingsController::class, 'getSettings']);

    // Authenticated API Routes
    Route::middleware('auth:sanctum')->group(function () {

        // Auth management
        Route::prefix('auth')->group(function () {
            Route::get('/me', [AuthController::class, 'me']);
            Route::get('/profile', [AuthController::class, 'me']);
            Route::put('/profile', [AuthController::class, 'updateProfile']);
            Route::post('/avatar', [AuthController::class, 'uploadAvatar']);
            Route::delete('/avatar', [AuthController::class, 'removeAvatar']);
            Route::post('/logout', [AuthController::class, 'logout']);
            Route::post('/refresh', [AuthController::class, 'refresh']);
            Route::post('/change-password', [AuthController::class, 'changePassword']);
        });

        // Direct Profile Routes
        Route::get('/profile', [AuthController::class, 'me']);
        Route::put('/profile', [AuthController::class, 'updateProfile']);
        Route::post('/profile/avatar', [AuthController::class, 'uploadAvatar']);
        Route::delete('/profile/avatar', [AuthController::class, 'removeAvatar']);

        // Module 01: Dashboard
        Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

        // Module 02: Organization Management
        Route::prefix('organization')->group(function () {
            Route::get('/profile', [OrganizationController::class, 'getProfile']);
            Route::put('/profile', [OrganizationController::class, 'updateProfile']);
            Route::get('/departments', [OrganizationController::class, 'departments']);
            Route::post('/departments', [OrganizationController::class, 'storeDepartment']);
            Route::put('/departments/{id}', [OrganizationController::class, 'updateDepartment']);
            Route::delete('/departments/{id}', [OrganizationController::class, 'destroyDepartment']);
            Route::get('/positions', [OrganizationController::class, 'positions']);
            Route::post('/positions', [OrganizationController::class, 'storePosition']);
            Route::put('/positions/{id}', [OrganizationController::class, 'updatePosition']);
            Route::delete('/positions/{id}', [OrganizationController::class, 'destroyPosition']);
            Route::get('/work-locations', [OrganizationController::class, 'workLocations']);
            Route::post('/work-locations', [OrganizationController::class, 'storeWorkLocation']);
            Route::put('/work-locations/{id}', [OrganizationController::class, 'updateWorkLocation']);
            Route::get('/employment-types', [OrganizationController::class, 'employmentTypes']);
            Route::get('/chart', [OrganizationController::class, 'orgChart']);
        });

        // Module 03: Employee Management
        Route::prefix('employees')->group(function () {
            Route::get('/', [EmployeeController::class, 'index']);
            Route::post('/', [EmployeeController::class, 'store']);
            Route::get('/export', [EmployeeController::class, 'exportCsv']);
            Route::get('/{id}', [EmployeeController::class, 'show']);
            Route::put('/{id}', [EmployeeController::class, 'update']);
            Route::delete('/{id}', [EmployeeController::class, 'destroy']);
            Route::post('/{id}/restore', [EmployeeController::class, 'restore']);
            Route::post('/{id}/emergency-contacts', [EmployeeController::class, 'addEmergencyContact']);
            Route::post('/{id}/educations', [EmployeeController::class, 'addEducation']);
            Route::post('/{id}/experiences', [EmployeeController::class, 'addExperience']);
            Route::post('/{id}/documents', [EmployeeController::class, 'uploadDocument']);
            Route::delete('/{id}/documents/{docId}', [EmployeeController::class, 'destroyDocument']);
            Route::post('/{id}/avatar', [EmployeeController::class, 'uploadAvatar']);

            // Employee Personal QR & ID Card
            Route::get('/{id}/qr', [EmployeeQrController::class, 'show']);
            Route::post('/{id}/qr/generate', [EmployeeQrController::class, 'generate']);
            Route::post('/{id}/qr/regenerate', [EmployeeQrController::class, 'regenerate']);
            Route::patch('/{id}/qr/revoke', [EmployeeQrController::class, 'revoke']);
            Route::get('/{id}/id-card', [EmployeeQrController::class, 'idCard']);
        });

        // Module 04: Employee Assignment Management (Source of Truth)
        Route::prefix('assignments')->group(function () {
            Route::get('/', [EmployeeAssignmentController::class, 'index']);
            Route::post('/', [EmployeeAssignmentController::class, 'store']);
            Route::get('/employee/{employeeId}', [EmployeeAssignmentController::class, 'getEmployeeHistory']);
            Route::put('/{id}', [EmployeeAssignmentController::class, 'update']);
            Route::delete('/{id}', [EmployeeAssignmentController::class, 'destroy']);
        });

        // Module 04B: Employee Documents Management & Vault
        Route::prefix('documents')->group(function () {
            Route::get('/', [DocumentController::class, 'index']);
            Route::get('/stats', [DocumentController::class, 'stats']);
            Route::post('/', [DocumentController::class, 'store']);
            Route::get('/{id}', [DocumentController::class, 'show']);
            Route::get('/{id}/download', [DocumentController::class, 'download']);
            Route::delete('/{id}', [DocumentController::class, 'destroy']);
            Route::patch('/{id}/verify', [DocumentController::class, 'verify']);
            Route::post('/{id}/ping-renewal', [DocumentController::class, 'pingRenewal']);
        });

        // Module 05: Attendance Management & Hospital Security
        Route::prefix('attendance')->group(function () {
            Route::get('/today', [AttendanceController::class, 'today']);
            Route::get('/records', [AttendanceController::class, 'records']);
            Route::get('/export', [AttendanceController::class, 'exportExcel']);
            Route::post('/check-in', [AttendanceController::class, 'checkIn']);
            Route::post('/check-out', [AttendanceController::class, 'checkOut']);
            Route::post('/admin-entry', [AttendanceController::class, 'adminEntry']);
            Route::post('/corrections', [AttendanceController::class, 'requestCorrection']);
            Route::put('/corrections/{id}/review', [AttendanceController::class, 'reviewCorrection']);
            Route::get('/shifts', [AttendanceController::class, 'shifts']);
            Route::get('/holidays', [AttendanceController::class, 'holidays']);

            // Hospital Networks & Geofences Security Controls
            Route::get('/networks', [HospitalAttendanceSecurityController::class, 'getNetworks']);
            Route::post('/networks', [HospitalAttendanceSecurityController::class, 'storeNetwork']);
            Route::put('/networks/{id}', [HospitalAttendanceSecurityController::class, 'updateNetwork']);
            Route::delete('/networks/{id}', [HospitalAttendanceSecurityController::class, 'destroyNetwork']);

            Route::get('/geofences', [HospitalAttendanceSecurityController::class, 'getGeofences']);
            Route::post('/geofences', [HospitalAttendanceSecurityController::class, 'storeGeofence']);
            Route::put('/geofences/{id}', [HospitalAttendanceSecurityController::class, 'updateGeofence']);
            Route::delete('/geofences/{id}', [HospitalAttendanceSecurityController::class, 'destroyGeofence']);

            Route::get('/scan-logs', [HospitalAttendanceSecurityController::class, 'scanLogs']);
            Route::get('/stats', [HospitalAttendanceSecurityController::class, 'attendanceStats']);
        });

        // Admin Attendance Aliases (matching spec Section 10)
        Route::prefix('admin')->group(function () {
            Route::prefix('employees/{id}/qr')->group(function () {
                Route::get('/', [EmployeeQrController::class, 'show']);
                Route::post('/generate', [EmployeeQrController::class, 'generate']);
                Route::post('/regenerate', [EmployeeQrController::class, 'regenerate']);
                Route::patch('/revoke', [EmployeeQrController::class, 'revoke']);
            });

            Route::prefix('attendance')->group(function () {
                Route::get('/qr-logs', [HospitalAttendanceSecurityController::class, 'scanLogs']);
                Route::get('/network-settings', [HospitalAttendanceSecurityController::class, 'getNetworks']);
                Route::post('/network-settings', [HospitalAttendanceSecurityController::class, 'storeNetwork']);
                Route::put('/network-settings/{id}', [HospitalAttendanceSecurityController::class, 'updateNetwork']);
                Route::delete('/network-settings/{id}', [HospitalAttendanceSecurityController::class, 'destroyNetwork']);
                Route::get('/geofences', [HospitalAttendanceSecurityController::class, 'getGeofences']);
                Route::post('/geofences', [HospitalAttendanceSecurityController::class, 'storeGeofence']);
                Route::put('/geofences/{id}', [HospitalAttendanceSecurityController::class, 'updateGeofence']);
                Route::delete('/geofences/{id}', [HospitalAttendanceSecurityController::class, 'destroyGeofence']);
                Route::get('/records', [AttendanceController::class, 'records']);
                Route::get('/export', [AttendanceController::class, 'exportExcel']);
                Route::get('/reports', [HospitalAttendanceSecurityController::class, 'attendanceStats']);
            });
        });

        // Employee Personal Mobile QR Attendance Flow
        Route::prefix('employee/attendance')->group(function () {
            Route::get('/qr/{token}/validate', [PersonalQrAttendanceController::class, 'validateQr']);
            Route::post('/qr/submit', [PersonalQrAttendanceController::class, 'submit']);
            Route::get('/today', [PersonalQrAttendanceController::class, 'today']);
            Route::get('/history', [PersonalQrAttendanceController::class, 'history']);
        });

        // Module 06: Leave Management
        Route::prefix('leaves')->group(function () {
            Route::get('/types', [LeaveController::class, 'types']);
            Route::post('/types', [LeaveController::class, 'storeType']);
            Route::get('/balances', [LeaveController::class, 'balances']);
            Route::get('/requests', [LeaveController::class, 'requests']);
            Route::post('/requests', [LeaveController::class, 'storeRequest']);
            Route::put('/requests/{id}/supervisor-review', [LeaveController::class, 'supervisorReview']);
            Route::put('/requests/{id}/hr-review', [LeaveController::class, 'hrReview']);
            Route::post('/requests/{id}/cancel', [LeaveController::class, 'cancel']);
        });

        // Module 07: Payroll Management
        Route::prefix('payroll')->group(function () {
            Route::get('/structures', [PayrollController::class, 'structures']);
            Route::post('/structures', [PayrollController::class, 'storeStructure']);
            Route::get('/employee-salaries/{employeeId}', [PayrollController::class, 'getEmployeeSalaries']);
            Route::post('/employee-salaries', [PayrollController::class, 'setEmployeeSalary']);
            Route::get('/batches', [PayrollController::class, 'batches']);
            Route::post('/batches/process', [PayrollController::class, 'processBatch']);
            Route::get('/batches/{id}', [PayrollController::class, 'getBatch']);
            Route::put('/batches/{id}/status', [PayrollController::class, 'updateBatchStatus']);
            Route::get('/payslips/{id}', [PayrollController::class, 'getPayslip']);
        });

        // Module 08: Recruitment Pipeline
        Route::prefix('recruitment')->group(function () {
            Route::get('/vacancies', [RecruitmentController::class, 'vacancies']);
            Route::post('/vacancies', [RecruitmentController::class, 'storeVacancy']);
            Route::get('/candidates', [RecruitmentController::class, 'candidates']);
            Route::post('/candidates', [RecruitmentController::class, 'storeCandidate']);
            Route::put('/candidates/{id}/status', [RecruitmentController::class, 'updateCandidateStatus']);
            Route::post('/candidates/{id}/convert-to-employee', [RecruitmentController::class, 'convertToEmployee']);
            Route::post('/interviews', [RecruitmentController::class, 'scheduleInterview']);
        });

        // Module 09: Performance Management
        Route::prefix('performance')->group(function () {
            Route::get('/reviews', [PerformanceAndTrainingController::class, 'reviews']);
            Route::post('/reviews', [PerformanceAndTrainingController::class, 'storeReview']);
            Route::post('/reviews/{id}/criteria', [PerformanceAndTrainingController::class, 'addCriteria']);
        });

        // Module 10: Training Management
        Route::prefix('training')->group(function () {
            Route::get('/programs', [PerformanceAndTrainingController::class, 'programs']);
            Route::post('/programs', [PerformanceAndTrainingController::class, 'storeProgram']);
            Route::post('/programs/{id}/enroll', [PerformanceAndTrainingController::class, 'enroll']);
        });

        // Module 12: Reports & Analytics
        Route::prefix('reports')->group(function () {
            Route::get('/summary', [ReportsController::class, 'summary']);
            Route::get('/workforce', [ReportsController::class, 'workforceReport']);
            Route::get('/attendance', [ReportsController::class, 'attendanceReport']);
            Route::get('/leaves', [ReportsController::class, 'leaveReport']);
            Route::get('/shifts', [ReportsController::class, 'shiftReport']);
            Route::get('/payroll', [ReportsController::class, 'payrollReport']);
            Route::get('/detailed-records', [ReportsController::class, 'detailedRecords']);
            Route::get('/export', [ReportsController::class, 'exportReport']);
        });

        // Module 13: Users & Roles (RBAC)
        Route::prefix('users')->group(function () {
            // Roles & Permissions routes (must precede /{id})
            Route::get('/roles', [UserManagementController::class, 'roles']);
            Route::post('/roles', [UserManagementController::class, 'storeRole']);
            Route::put('/roles/{id}', [UserManagementController::class, 'updateRole']);
            Route::delete('/roles/{id}', [UserManagementController::class, 'destroyRole']);
            Route::post('/roles/{id}/duplicate', [UserManagementController::class, 'duplicateRole']);

            Route::get('/permissions', [UserManagementController::class, 'permissions']);

            // User routes
            Route::get('/', [UserManagementController::class, 'index']);
            Route::post('/', [UserManagementController::class, 'store']);
            Route::get('/{id}', [UserManagementController::class, 'show']);
            Route::put('/{id}', [UserManagementController::class, 'update']);
            Route::delete('/{id}', [UserManagementController::class, 'destroy']);
            Route::patch('/{id}/status', [UserManagementController::class, 'toggleStatus']);
            Route::post('/{id}/reset-password', [UserManagementController::class, 'resetPassword']);
            Route::put('/{id}/roles', [UserManagementController::class, 'syncUserRoles']);
        });

        // Module 14: System Settings & Communication
        Route::prefix('settings')->group(function () {
            Route::get('/', [SettingsController::class, 'getSettings']);
            Route::put('/', [SettingsController::class, 'updateSettings']);
            Route::get('/announcements', [SettingsController::class, 'announcements']);
            Route::post('/announcements', [SettingsController::class, 'storeAnnouncement']);
            Route::delete('/announcements/{id}', [SettingsController::class, 'destroyAnnouncement']);
            Route::get('/audit-logs', [SettingsController::class, 'auditLogs']);
        });
    });
});
