<?php

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmployeePortalEndpointsTest extends TestCase
{
    use RefreshDatabase;

    protected User $employeeUser;
    protected Employee $employee;
    protected string $token;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();

        $this->employeeUser = User::where('email', 'employee@gmail.com')->firstOrFail();
        $this->employee = $this->employeeUser->employee;
        $this->token = $this->employeeUser->createToken('portal_test')->plainTextToken;
    }

    public function test_auth_me(): void
    {
        $res = $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->getJson('/api/v1/auth/me');
        $res->assertStatus(200);
    }

    public function test_employee_detail(): void
    {
        $res = $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->getJson('/api/v1/employees/' . $this->employee->id);
        $res->assertStatus(200);
    }

    public function test_today_attendance(): void
    {
        $res = $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->getJson('/api/v1/employee/attendance/today');
        $res->assertStatus(200);
    }

    public function test_attendance_history(): void
    {
        $res = $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->getJson('/api/v1/employee/attendance/history?per_page=60');
        $res->assertStatus(200);
    }

    public function test_employee_qr(): void
    {
        $res = $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->getJson('/api/v1/employees/' . $this->employee->id . '/qr');
        $res->assertStatus(200);
    }

    public function test_leave_types(): void
    {
        $res = $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->getJson('/api/v1/leaves/types');
        $res->assertStatus(200);
    }

    public function test_leave_balances(): void
    {
        $res = $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->getJson('/api/v1/leaves/balances?employee_id=' . $this->employee->id);
        $res->assertStatus(200);
    }

    public function test_leave_requests(): void
    {
        $res = $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->getJson('/api/v1/leaves/requests?employee_id=' . $this->employee->id . '&per_page=50');
        $res->assertStatus(200);
    }

    public function test_shifts(): void
    {
        $res = $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->getJson('/api/v1/attendance/shifts');
        $res->assertStatus(200);
    }

    public function test_holidays(): void
    {
        $res = $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->getJson('/api/v1/attendance/holidays');
        $res->assertStatus(200);
    }

    public function test_documents(): void
    {
        $res = $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->getJson('/api/v1/documents?employee_id=' . $this->employee->id);
        $res->assertStatus(200);
    }
}
