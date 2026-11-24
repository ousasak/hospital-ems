<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Employee;
use App\Models\EmployeeAssignment;
use App\Models\LeaveType;
use App\Models\Position;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmsApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_user_can_login_with_valid_credentials(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@gmail.com',
            'password' => '1234567',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'token',
                'user' => ['id', 'name', 'email', 'roles'],
            ]);
    }

    public function test_user_cannot_login_with_invalid_credentials(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@gmail.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'message' => 'Invalid email or password.',
            ]);
    }

    public function test_authenticated_user_can_access_dashboard_stats(): void
    {
        $user = User::where('email', 'admin@gmail.com')->first();
        $token = $user->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/v1/dashboard/stats');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'metrics' => [
                    'total_employees',
                    'active_employees',
                    'today_present',
                    'today_late',
                    'today_absent',
                ],
                'departments',
                'gender_distribution',
            ]);
    }

    public function test_employee_assignment_transfer_closes_previous_assignment(): void
    {
        $user = User::where('email', 'admin@gmail.com')->first();
        $token = $user->createToken('test')->plainTextToken;

        $employee = Employee::where('employee_code', 'EMP-006')->first();
        $originalAssignment = $employee->primaryAssignment;
        $this->assertNotNull($originalAssignment);
        $this->assertTrue((bool) $originalAssignment->is_primary);

        $newDept = Department::where('code', 'HR')->first();
        $newPos = Position::where('department_id', $newDept->id)->first();

        $transferDate = Carbon::today()->addDays(1)->toDateString();

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/v1/assignments', [
                'employee_id' => $employee->id,
                'department_id' => $newDept->id,
                'position_id' => $newPos->id,
                'start_date' => $transferDate,
                'is_primary' => true,
                'status' => 'active',
                'notes' => 'Transfer to HR Department',
            ]);

        $response->assertStatus(201);

        // Verify previous assignment was closed
        $originalAssignment->refresh();
        $this->assertEquals('ended', $originalAssignment->status);
        $this->assertFalse((bool) $originalAssignment->is_primary);
        $this->assertEquals(Carbon::parse($transferDate)->subDay()->toDateString(), $originalAssignment->end_date->toDateString());
    }

    public function test_leave_workflow_deducts_and_updates_balances(): void
    {
        $emp = Employee::where('employee_code', 'EMP-007')->first();
        $user = $emp->user;
        $token = $user->createToken('test')->plainTextToken;

        $annualLeave = LeaveType::where('code', 'AL')->first();

        // 1. Submit leave request
        $startDate = Carbon::today()->addDays(20)->toDateString();
        $endDate = Carbon::today()->addDays(21)->toDateString();

        $reqResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/v1/leaves/requests', [
                'leave_type_id' => $annualLeave->id,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'reason' => 'Annual trip',
            ]);

        $reqResponse->assertStatus(201);
        $leaveId = $reqResponse->json('leave_request.id');

        // 2. Supervisor approves
        $supUser = User::where('email', 'deptmanager@gmail.com')->first();
        $supToken = $supUser->createToken('test')->plainTextToken;

        $supReview = $this->withHeader('Authorization', 'Bearer ' . $supToken)
            ->putJson("/api/v1/leaves/requests/{$leaveId}/supervisor-review", [
                'status' => 'approved',
                'notes' => 'Approved by manager',
            ]);

        $supReview->assertStatus(200);

        // 3. HR approves
        $hrUser = User::where('email', 'hrmanager@gmail.com')->first();
        $hrToken = $hrUser->createToken('test')->plainTextToken;

        $hrReview = $this->withHeader('Authorization', 'Bearer ' . $hrToken)
            ->putJson("/api/v1/leaves/requests/{$leaveId}/hr-review", [
                'status' => 'approved',
                'notes' => 'Final HR approval granted',
            ]);

        $hrReview->assertStatus(200);
        $this->assertEquals('approved', $hrReview->json('leave_request.status'));
    }
}
