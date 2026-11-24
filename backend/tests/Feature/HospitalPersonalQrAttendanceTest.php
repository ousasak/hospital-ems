<?php

namespace Tests\Feature;

use App\Models\AttendanceRecord;
use App\Models\AttendanceScanLog;
use App\Models\Employee;
use App\Models\EmployeeQrCode;
use App\Models\HospitalGeofence;
use App\Models\HospitalNetwork;
use App\Models\User;
use App\Models\WorkShift;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HospitalPersonalQrAttendanceTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected User $employeeUser1;
    protected User $employeeUser2;
    protected Employee $employee1;
    protected Employee $employee2;
    protected string $adminToken;
    protected string $employeeToken1;
    protected string $employeeToken2;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();

        $this->adminUser = User::where('email', 'admin@gmail.com')->first();
        $this->adminToken = $this->adminUser->createToken('admin_test')->plainTextToken;

        // Find or create employee 1
        $this->employee1 = Employee::where('employee_code', 'EMP-001')->first();
        $this->employeeUser1 = $this->employee1->user;
        $this->employeeToken1 = $this->employeeUser1->createToken('emp1_test')->plainTextToken;

        // Find or create employee 2
        $this->employee2 = Employee::where('employee_code', 'EMP-002')->first();
        $this->employeeUser2 = $this->employee2->user;
        $this->employeeToken2 = $this->employeeUser2->createToken('emp2_test')->plainTextToken;

        // Ensure active Hospital Network is configured
        HospitalNetwork::firstOrCreate(
            ['network_name' => 'Test Hospital Wi-Fi'],
            [
                'allowed_ip' => '127.0.0.1',
                'allowed_cidr' => '127.0.0.1/32',
                'status' => 'active',
                'branch_name' => 'Main Hospital',
            ]
        );

        // Ensure active Hospital Geofence is configured (Center: 11.8891000, 105.8762000)
        HospitalGeofence::firstOrCreate(
            ['name' => 'Test Hospital Main Building'],
            [
                'latitude' => 11.8891000,
                'longitude' => 105.8762000,
                'radius_meters' => 200,
                'max_accuracy_meters' => 80,
                'status' => 'active',
                'branch_name' => 'Main Campus',
            ]
        );

        // Clear pre-seeded today attendance records and scan logs for clean test isolation
        AttendanceRecord::whereIn('employee_id', [$this->employee1->id, $this->employee2->id])->delete();
        AttendanceScanLog::truncate();

        // Freeze time within morning shift (08:05:00) so shift validations pass reliably
        Carbon::setTestNow(Carbon::today()->setTime(8, 5, 0));
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_admin_can_generate_employee_qr(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/v1/admin/employees/{$this->employee1->id}/qr/generate");

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'active_qr' => [
                    'status',
                    'generated_at',
                    'attendance_url',
                    'svg',
                    'png_data_uri',
                ],
            ]);

        $this->assertDatabaseHas('employee_qr_codes', [
            'employee_id' => $this->employee1->id,
            'status' => 'active',
        ]);
    }

    public function test_admin_can_view_employee_id_card_data(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson("/api/v1/employees/{$this->employee1->id}/id-card");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'organization' => ['name', 'phone'],
                'employee' => ['id', 'employee_code', 'full_name'],
                'qr' => ['attendance_url', 'svg', 'png_data_uri'],
            ]);
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $response = $this->getJson('/api/v1/employee/attendance/qr/some-token/validate');
        $response->assertStatus(401);
    }

    public function test_employee_can_validate_their_own_qr_code(): void
    {
        // Generate QR for employee 1
        $rawToken = bin2hex(random_bytes(32));
        EmployeeQrCode::create([
            'employee_id' => $this->employee1->id,
            'token_hash' => hash('sha256', $rawToken),
            'status' => 'active',
            'generated_at' => now(),
            'generated_by' => $this->adminUser->id,
        ]);
        $this->employee1->update(['qr_code_token' => $rawToken]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->employeeToken1)
            ->getJson("/api/v1/employee/attendance/qr/{$rawToken}/validate");

        $response->assertStatus(200)
            ->assertJson([
                'valid' => true,
                'employee' => [
                    'id' => $this->employee1->id,
                    'employee_code' => $this->employee1->employee_code,
                ],
            ]);
    }

    public function test_employee_cannot_use_another_employees_qr_code(): void
    {
        // QR code belongs to Employee 1
        $rawToken = bin2hex(random_bytes(32));
        EmployeeQrCode::create([
            'employee_id' => $this->employee1->id,
            'token_hash' => hash('sha256', $rawToken),
            'status' => 'active',
            'generated_at' => now(),
            'generated_by' => $this->adminUser->id,
        ]);

        // Employee 2 attempts to validate / scan Employee 1's QR
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->employeeToken2)
            ->getJson("/api/v1/employee/attendance/qr/{$rawToken}/validate");

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['ownership']);
    }

    public function test_revoked_qr_code_is_rejected_immediately(): void
    {
        $rawToken = bin2hex(random_bytes(32));
        $qr = EmployeeQrCode::create([
            'employee_id' => $this->employee1->id,
            'token_hash' => hash('sha256', $rawToken),
            'status' => 'active',
            'generated_at' => now(),
            'generated_by' => $this->adminUser->id,
        ]);

        // Revoke the QR code
        $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->patchJson("/api/v1/admin/employees/{$this->employee1->id}/qr/revoke", [
                'reason' => 'Lost physical card',
            ])->assertStatus(200);

        // Employee tries to use the revoked QR
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->employeeToken1)
            ->getJson("/api/v1/employee/attendance/qr/{$rawToken}/validate");

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['token']);
    }

    public function test_attendance_fails_when_network_ip_is_unauthorized(): void
    {
        $rawToken = bin2hex(random_bytes(32));
        EmployeeQrCode::create([
            'employee_id' => $this->employee1->id,
            'token_hash' => hash('sha256', $rawToken),
            'status' => 'active',
            'generated_at' => now(),
            'generated_by' => $this->adminUser->id,
        ]);

        // Set request IP to unauthorized IP (e.g. 198.51.100.22)
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->employeeToken1)
            ->withServerVariables(['REMOTE_ADDR' => '198.51.100.22'])
            ->postJson('/api/v1/employee/attendance/qr/submit', [
                'token' => $rawToken,
                'latitude' => 11.8891000,
                'longitude' => 105.8762000,
                'accuracy' => 15,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['network']);

        // Check rejection logged in audit logs
        $this->assertDatabaseHas('attendance_scan_logs', [
            'employee_id' => $this->employee1->id,
            'overall_status' => 'rejected',
            'network_validation_status' => 'failed',
        ]);
    }

    public function test_attendance_fails_when_gps_is_outside_geofence(): void
    {
        $rawToken = bin2hex(random_bytes(32));
        EmployeeQrCode::create([
            'employee_id' => $this->employee1->id,
            'token_hash' => hash('sha256', $rawToken),
            'status' => 'active',
            'generated_at' => now(),
            'generated_by' => $this->adminUser->id,
        ]);

        // 10 km away from hospital coordinates
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->employeeToken1)
            ->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])
            ->postJson('/api/v1/employee/attendance/qr/submit', [
                'token' => $rawToken,
                'latitude' => 11.5564,
                'longitude' => 104.9282,
                'accuracy' => 10,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['location']);

        $this->assertDatabaseHas('attendance_scan_logs', [
            'employee_id' => $this->employee1->id,
            'overall_status' => 'rejected',
            'location_validation_status' => 'failed',
        ]);
    }

    public function test_attendance_fails_when_gps_accuracy_is_too_low(): void
    {
        $rawToken = bin2hex(random_bytes(32));
        EmployeeQrCode::create([
            'employee_id' => $this->employee1->id,
            'token_hash' => hash('sha256', $rawToken),
            'status' => 'active',
            'generated_at' => now(),
            'generated_by' => $this->adminUser->id,
        ]);

        // Coordinates inside hospital, but accuracy is 250m (exceeds max 80m threshold)
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->employeeToken1)
            ->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])
            ->postJson('/api/v1/employee/attendance/qr/submit', [
                'token' => $rawToken,
                'latitude' => 11.8891000,
                'longitude' => 105.8762000,
                'accuracy' => 250,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['location']);
    }

    public function test_successful_check_in_when_both_wifi_and_gps_are_valid(): void
    {
        $rawToken = bin2hex(random_bytes(32));
        EmployeeQrCode::create([
            'employee_id' => $this->employee1->id,
            'token_hash' => hash('sha256', $rawToken),
            'status' => 'active',
            'generated_at' => now(),
            'generated_by' => $this->adminUser->id,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->employeeToken1)
            ->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])
            ->postJson('/api/v1/employee/attendance/qr/submit', [
                'token' => $rawToken,
                'latitude' => 11.8891000,
                'longitude' => 105.8762000,
                'accuracy' => 12,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'action' => 'check_in',
            ]);

        $this->assertDatabaseHas('attendance_records', [
            'employee_id' => $this->employee1->id,
            'check_in_method' => 'qr',
            'check_in_ip' => '127.0.0.1',
        ]);

        $this->assertDatabaseHas('attendance_scan_logs', [
            'employee_id' => $this->employee1->id,
            'event_type' => 'check_in',
            'overall_status' => 'success',
        ]);
    }

    public function test_subsequent_scan_automatically_triggers_check_out(): void
    {
        $rawToken = bin2hex(random_bytes(32));
        EmployeeQrCode::create([
            'employee_id' => $this->employee1->id,
            'token_hash' => hash('sha256', $rawToken),
            'status' => 'active',
            'generated_at' => now(),
            'generated_by' => $this->adminUser->id,
        ]);

        // First punch: Check-in at 08:05
        $this->withHeader('Authorization', 'Bearer ' . $this->employeeToken1)
            ->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])
            ->postJson('/api/v1/employee/attendance/qr/submit', [
                'token' => $rawToken,
                'latitude' => 11.8891000,
                'longitude' => 105.8762000,
                'accuracy' => 15,
            ])->assertStatus(200)->assertJson(['action' => 'check_in']);

        // Advance time past cooldown interval to end of shift (17:05)
        Carbon::setTestNow(Carbon::today()->setTime(17, 5, 0));

        // Second punch: Automatically Check-out
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->employeeToken1)
            ->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])
            ->postJson('/api/v1/employee/attendance/qr/submit', [
                'token' => $rawToken,
                'latitude' => 11.8891000,
                'longitude' => 105.8762000,
                'accuracy' => 15,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'action' => 'check_out',
            ]);

        $record = AttendanceRecord::where('employee_id', $this->employee1->id)
            ->whereDate('attendance_date', Carbon::today()->toDateString())
            ->first();

        $this->assertNotNull($record->check_in_time);
        $this->assertNotNull($record->check_out_time);
    }

    public function test_third_scan_is_rejected_as_duplicate(): void
    {
        $rawToken = bin2hex(random_bytes(32));
        EmployeeQrCode::create([
            'employee_id' => $this->employee1->id,
            'token_hash' => hash('sha256', $rawToken),
            'status' => 'active',
            'generated_at' => now(),
            'generated_by' => $this->adminUser->id,
        ]);

        // Punch 1: In at 08:05
        $this->withHeader('Authorization', 'Bearer ' . $this->employeeToken1)
            ->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])
            ->postJson('/api/v1/employee/attendance/qr/submit', [
                'token' => $rawToken,
                'latitude' => 11.8891000,
                'longitude' => 105.8762000,
                'accuracy' => 15,
            ])->assertStatus(200);

        // Advance time past cooldown interval
        Carbon::setTestNow(Carbon::today()->setTime(17, 5, 0));

        // Punch 2: Out at 17:05
        $this->withHeader('Authorization', 'Bearer ' . $this->employeeToken1)
            ->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])
            ->postJson('/api/v1/employee/attendance/qr/submit', [
                'token' => $rawToken,
                'latitude' => 11.8891000,
                'longitude' => 105.8762000,
                'accuracy' => 15,
            ])->assertStatus(200);

        // Advance time to 17:15
        Carbon::setTestNow(Carbon::today()->setTime(17, 15, 0));

        // Punch 3: Attempting third punch today
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->employeeToken1)
            ->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])
            ->postJson('/api/v1/employee/attendance/qr/submit', [
                'token' => $rawToken,
                'latitude' => 11.8891000,
                'longitude' => 105.8762000,
                'accuracy' => 15,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['duplicate']);
    }

    public function test_admin_can_manage_hospital_networks_and_geofences(): void
    {
        // 1. Create network
        $netRes = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson('/api/v1/admin/attendance/network-settings', [
                'network_name' => 'Trauma Unit Wi-Fi',
                'branch_name' => 'Wing B',
                'allowed_cidr' => '172.16.0.0/16',
                'status' => 'active',
            ]);
        $netRes->assertStatus(201);
        $netId = $netRes->json('network.id');

        // 2. Update network
        $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->putJson("/api/v1/admin/attendance/network-settings/{$netId}", [
                'network_name' => 'Trauma Unit Wi-Fi Updated',
                'branch_name' => 'Wing B',
                'allowed_cidr' => '172.16.1.0/24',
                'status' => 'active',
            ])->assertStatus(200);

        // 3. Create Geofence
        $geoRes = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson('/api/v1/admin/attendance/geofences', [
                'name' => 'North Clinic Entrance',
                'latitude' => 11.8895000,
                'longitude' => 105.8769000,
                'radius_meters' => 100,
                'max_accuracy_meters' => 50,
                'status' => 'active',
            ]);
        $geoRes->assertStatus(201);
        $geoId = $geoRes->json('geofence.id');

        // 4. Update Geofence
        $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->putJson("/api/v1/admin/attendance/geofences/{$geoId}", [
                'name' => 'North Clinic Entrance Extended',
                'latitude' => 11.8895000,
                'longitude' => 105.8769000,
                'radius_meters' => 120,
                'max_accuracy_meters' => 60,
                'status' => 'active',
            ])->assertStatus(200);

        // 5. Query Audit Scan Logs
        $logRes = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/v1/admin/attendance/qr-logs');
        $logRes->assertStatus(200);
    }
}
