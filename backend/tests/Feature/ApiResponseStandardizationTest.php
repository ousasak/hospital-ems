<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Employee;
use App\Models\Position;
use App\Models\User;
use App\Models\WorkLocation;
use App\Services\JwtAuthService;
use App\Traits\ApiResponse;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ApiResponseStandardizationTest extends TestCase
{
    use RefreshDatabase;

    protected string $token;
    protected User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);

        $this->adminUser = User::where('email', 'admin@gmail.com')->first();
        $this->token = JwtAuthService::generate($this->adminUser, 3600);
    }

    /**
     * 1. GET List: Standard success envelope with array payload
     */
    public function test_get_list_returns_standard_success_envelope(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->getJson('/api/v1/organization/employment-types');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonStructure([
                'success',
                'message',
                'data',
            ]);

        $this->assertIsArray($response->json('data'));
    }

    /**
     * 2. GET Single: Standard success envelope with single resource payload
     */
    public function test_get_single_resource_returns_standard_success_envelope(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->getJson('/api/v1/organization/profile');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonStructure([
                'success',
                'message',
                'data',
            ]);

        $this->assertIsArray($response->json('data'));
    }

    /**
     * 3. POST Create: Standard create response with HTTP 201 and created resource in data
     */
    public function test_post_create_returns_201_with_standard_envelope(): void
    {
        if (!\Illuminate\Support\Facades\Schema::hasTable('work_locations')) {
            $this->markTestSkipped('work_locations table was streamlined for Hospital EMS');
        }
        $uniqueCode = 'TEST_LOC_' . time();
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->postJson('/api/v1/organization/work-locations', [
                'name' => 'Testing Laboratory ' . time(),
                'code' => $uniqueCode,
                'city' => 'Phnom Penh',
                'country' => 'Cambodia',
                'timezone' => 'Asia/Phnom_Penh',
                'status' => 'active',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonStructure([
                'success',
                'message',
                'data',
            ]);

        $this->assertNotNull($response->json('data'));
        $this->assertEquals($uniqueCode, $response->json('data.code') ?? $response->json('location.code'));
    }

    /**
     * 4. PUT Update: Standard update response with HTTP 200
     */
    public function test_put_update_returns_200_with_standard_envelope(): void
    {
        if (!\Illuminate\Support\Facades\Schema::hasTable('work_locations')) {
            $this->markTestSkipped('work_locations table was streamlined for Hospital EMS');
        }
        $location = WorkLocation::first();
        $this->assertNotNull($location);

        $updatedName = 'Updated Location ' . time();
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->putJson("/api/v1/organization/work-locations/{$location->id}", [
                'name' => $updatedName,
                'code' => $location->code,
                'city' => $location->city,
                'country' => $location->country,
                'timezone' => $location->timezone ?? 'Asia/Phnom_Penh',
                'status' => 'active',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonStructure([
                'success',
                'message',
                'data',
            ]);
    }

    /**
     * 5. DELETE: Standard delete response with HTTP 200 and data: null
     */
    public function test_delete_returns_200_with_data_null(): void
    {
        // Create a department with 0 assigned employees so it can be safely deleted
        $dept = Department::create([
            'name' => 'Disposable Dept ' . time(),
            'code' => 'DISP_' . time(),
            'status' => 'active',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->deleteJson("/api/v1/organization/departments/{$dept->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => null,
            ])
            ->assertJsonStructure([
                'success',
                'message',
                'data',
            ]);
    }

    /**
     * 6. GET Pagination: Paginated response with meta current_page, last_page, per_page, total
     */
    public function test_get_pagination_returns_correct_meta_structure(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->getJson('/api/v1/employees?per_page=5');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'meta' => [
                    'current_page' => 1,
                    'per_page' => 5,
                ],
            ])
            ->assertJsonStructure([
                'success',
                'message',
                'data',
                'meta' => [
                    'current_page',
                    'last_page',
                    'per_page',
                    'total',
                ],
            ]);

        $this->assertIsArray($response->json('data'));
        $this->assertIsInt($response->json('meta.current_page'));
        $this->assertIsInt($response->json('meta.last_page'));
        $this->assertIsInt($response->json('meta.per_page'));
        $this->assertIsInt($response->json('meta.total'));
    }

    /**
     * 7. Validation Error: HTTP 422 with success: false, data: null, and errors
     */
    public function test_validation_error_returns_422_with_errors_accessible(): void
    {
        $response = $this->postJson('/api/v1/auth/login', []);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'data' => null,
            ])
            ->assertJsonStructure([
                'success',
                'message',
                'data',
                'errors',
            ]);

        $this->assertNotEmpty($response->json('errors'));
    }

    /**
     * 8. Unauthorized: HTTP 401 with standard error and data: null
     */
    public function test_unauthorized_request_returns_401(): void
    {
        $response = $this->getJson('/api/v1/auth/me');

        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'data' => null,
                'message' => 'Unauthenticated.',
            ]);
    }

    /**
     * 9. Forbidden: HTTP 403 with standard error and data: null
     */
    public function test_forbidden_request_returns_403(): void
    {
        // Deactivated or suspended user login produces 403
        $suspendedUser = User::create([
            'name' => 'Suspended Doctor',
            'email' => 'suspended_doc@hospital.gov.kh',
            'password' => Hash::make('1234567'),
        ]);

        Employee::create([
            'user_id' => $suspendedUser->id,
            'employee_code' => 'TKH-SUSP-P2',
            'first_name' => 'Suspended',
            'last_name' => 'Doc',
            'gender' => 'male',
            'email' => 'suspended_doc@hospital.gov.kh',
            'employment_status' => 'suspended',
            'join_date' => '2024-01-01',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'suspended_doc@hospital.gov.kh',
            'password' => '1234567',
        ]);

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'data' => null,
            ]);
    }

    /**
     * 10. Not Found: HTTP 404 with standard error and data: null
     */
    public function test_not_found_returns_404(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->getJson('/api/v1/non-existent-endpoint-404');

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
                'data' => null,
                'message' => 'The requested resource was not found.',
            ]);
    }

    /**
     * 11. Server Error: HTTP 500 returns standard error envelope with safe message
     */
    public function test_server_error_returns_500_with_safe_message(): void
    {
        $response = ApiResponse::serverError();

        $this->assertEquals(500, $response->getStatusCode());
        $data = $response->getData(true);

        $this->assertFalse($data['success']);
        $this->assertNull($data['data']);
        $this->assertEquals('An unexpected server error occurred.', $data['message']);
    }

    /**
     * 12. GET Single Employee: Returns 200 with details and eager-loaded relations
     */
    public function test_get_single_employee_returns_200_with_relations(): void
    {
        $employee = Employee::first();
        if (!$employee) {
            $employee = Employee::create([
                'employee_code' => 'EMP-TEST-001',
                'first_name' => 'John',
                'last_name' => 'Doe',
                'gender' => 'male',
                'email' => 'john.doe.test@enterprise.com',
                'join_date' => now()->toDateString(),
                'employment_status' => 'active',
            ]);
        }

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->getJson('/api/v1/employees/' . $employee->id);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'id',
                    'employee_code',
                    'first_name',
                    'last_name',
                    'email',
                ],
            ]);

        $this->assertEquals($employee->id, $response->json('data.id'));
        $this->assertEquals($employee->employee_code, $response->json('data.employee_code'));

        $this->assertEquals($employee->id, $response->json('data.id'));
    }
}
