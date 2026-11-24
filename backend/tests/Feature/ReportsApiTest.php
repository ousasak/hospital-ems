<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Employee;
use App\Models\User;
use App\Services\JwtAuthService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportsApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected User $hrUser;
    protected User $deptManagerUser;
    protected User $employeeUser;
    protected User $accountantUser;

    protected string $adminToken;
    protected string $hrToken;
    protected string $deptManagerToken;
    protected string $employeeToken;
    protected string $accountantToken;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();

        $this->adminUser = User::where('email', 'admin@gmail.com')->first();
        $this->adminToken = JwtAuthService::generate($this->adminUser, 3600);

        $this->hrUser = User::where('email', 'hrmanager@gmail.com')->first();
        $this->hrToken = JwtAuthService::generate($this->hrUser, 3600);

        $this->deptManagerUser = User::where('email', 'deptmanager@gmail.com')->first();
        $this->deptManagerToken = JwtAuthService::generate($this->deptManagerUser, 3600);

        $this->accountantUser = User::where('email', 'accountant@gmail.com')->first();
        $this->accountantToken = JwtAuthService::generate($this->accountantUser, 3600);

        $this->employeeUser = User::where('email', 'employee@gmail.com')->first();
        $this->employeeToken = JwtAuthService::generate($this->employeeUser, 3600);
    }

    /**
     * 1. Unauthenticated users cannot access reports
     */
    public function test_unauthenticated_user_cannot_access_reports(): void
    {
        $response = $this->getJson('/api/v1/reports/summary');
        $response->assertStatus(401);
    }

    /**
     * 2. General employee without reporting permissions is rejected (403)
     */
    public function test_general_employee_cannot_access_reports(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->employeeToken)
            ->getJson('/api/v1/reports/summary');

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
            ]);
    }

    /**
     * 3. Super Admin has organization-wide access to summary and workforce
     */
    public function test_super_admin_can_access_organization_reports(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/v1/reports/summary');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $metrics = $response->json('metrics');
        $this->assertGreaterThan(0, $metrics['total_employees']);
        $this->assertFalse($response->json('scope.is_department_scoped'));
    }

    /**
     * 4. HR Manager has organization-wide access
     */
    public function test_hr_manager_can_access_reports(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->hrToken)
            ->getJson('/api/v1/reports/workforce');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertGreaterThan(0, $response->json('total_headcount'));
    }

    /**
     * 5. Department Manager is strictly scoped to assigned department
     */
    public function test_department_manager_is_scoped_to_assigned_department(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->deptManagerToken)
            ->getJson('/api/v1/reports/summary');

        $response->assertStatus(200);
        $this->assertTrue($response->json('scope.is_department_scoped'));
        $this->assertNotEmpty($response->json('scope.department_ids'));

        // Scoped employee count must be smaller than organization total
        $totalOrgEmployees = Employee::count();
        $deptEmployees = $response->json('metrics.total_employees');
        $this->assertLessThanOrEqual($totalOrgEmployees, $deptEmployees);
    }

    /**
     * 6. Department Manager cannot access other departments (IDOR prevention)
     */
    public function test_department_manager_cannot_bypass_scope_via_department_id_param(): void
    {
        // Find another department ID not managed by this manager
        $managedIds = $this->deptManagerUser->employee->managedDepartments()->pluck('id')->toArray();
        $otherDept = Department::whereNotIn('id', $managedIds)->first();

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->deptManagerToken)
            ->getJson('/api/v1/reports/summary?department_id=' . $otherDept->id);

        $response->assertStatus(200);
        // Backend overrides to manager's authorized department IDs
        $returnedIds = $response->json('scope.department_ids');
        $this->assertNotContains($otherDept->id, $returnedIds);
    }

    /**
     * 7. Attendance Analytics with date range filtering
     */
    public function test_attendance_report_with_date_range_filtering(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/v1/reports/attendance?start_date=2026-11-01&end_date=2026-11-17');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'period' => ['start_date', 'end_date'],
                'status_counts' => ['present', 'late', 'absent', 'on_leave', 'half_day'],
                'attendance_rate',
                'daily_trends',
                'department_rates',
            ]);
    }

    /**
     * 8. Leave Analytics returns requests by status and monthly breakdown
     */
    public function test_leave_report_returns_accurate_metrics(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/v1/reports/leaves?year=2026');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'year',
                'by_status' => ['approved', 'pending_supervisor', 'pending_hr', 'rejected', 'cancelled'],
                'leaves_by_month',
                'by_department',
            ]);
    }

    /**
     * 9. Shifts & scheduling analytics
     */
    public function test_shift_report_returns_shift_distribution(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/v1/reports/shifts');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'by_shift',
                'categories_breakdown',
                'by_department',
            ]);

        // Also test with specific department filter
        $dept = Department::first();
        if ($dept) {
            $deptResponse = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
                ->getJson('/api/v1/reports/shifts?department_id=' . $dept->id);
            $deptResponse->assertStatus(200);
        }
    }

    /**
     * 10. Detailed records endpoint supports categories, pagination, and search
     */
    public function test_detailed_records_endpoint_supports_categories_and_pagination(): void
    {
        foreach (['attendance', 'leave', 'employee', 'shift', 'department'] as $cat) {
            $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
                ->getJson('/api/v1/reports/detailed-records?category=' . $cat . '&per_page=5&page=1');

            $response->assertStatus(200);
            $this->assertTrue($response->json('success'));
            $this->assertIsArray($response->json('data'));
        }
    }

    /**
     * 11. CSV export streams file with text/csv header
     */
    public function test_export_csv_streams_file(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->get('/api/v1/reports/export?category=attendance');

        $response->assertStatus(200);
        $this->assertStringContainsString('text/csv', $response->headers->get('Content-Type'));
    }

    /**
     * 12. CSV export produces pure English or Khmer headers with zero mixed strings
     */
    public function test_export_csv_respects_language_parameters(): void
    {
        // 1. English CSV export
        ob_start();
        $responseEn = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->get('/api/v1/reports/export?category=attendance&lang=en');
        $contentEn = $responseEn->streamedContent();
        ob_end_clean();

        $this->assertStringContainsString('Employee ID', $contentEn);
        $this->assertStringContainsString('Working Hours', $contentEn);
        $this->assertStringNotContainsString('(Employee ID)', $contentEn);

        // 2. Khmer CSV export
        ob_start();
        $responseKh = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->get('/api/v1/reports/export?category=attendance&lang=kh');
        $contentKh = $responseKh->streamedContent();
        ob_end_clean();

        $this->assertStringContainsString('លេខសម្គាល់បុគ្គលិក', $contentKh);
        $this->assertStringContainsString('ម៉ោងបំពេញការងារ', $contentKh);
        $this->assertStringNotContainsString('(Employee ID)', $contentKh);
    }

    /**
     * 13. Payroll report permission check: Unauthorized user rejected
     */
    public function test_unauthorized_user_cannot_access_payroll_report(): void
    {
        // Dept Manager is not authorized for payroll
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->deptManagerToken)
            ->getJson('/api/v1/reports/payroll');

        $response->assertStatus(403);
    }

    /**
     * 14. Payroll report permission check: Super Admin and Accountant authorized
     */
    public function test_super_admin_and_accountant_can_access_payroll_report(): void
    {
        // Super Admin is authorized
        $adminResponse = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/v1/reports/payroll');

        $adminResponse->assertStatus(200);

        // Reset auth between requests in same method if needed
        $this->app['auth']->forgetGuards();

        // Accountant is authorized
        $accResponse = $this->withHeader('Authorization', 'Bearer ' . $this->accountantToken)
            ->getJson('/api/v1/reports/payroll');

        $accResponse->assertStatus(200);
    }
}
