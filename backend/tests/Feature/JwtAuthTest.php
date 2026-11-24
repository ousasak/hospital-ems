<?php

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\User;
use App\Services\JwtAuthService;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class JwtAuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    /**
     * Requirement: Login with valid credentials → Success + JWT
     */
    public function test_login_with_valid_credentials_returns_success_and_jwt(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@gmail.com',
            'password' => '1234567',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Login successful',
                'token_type' => 'Bearer',
            ])
            ->assertJsonStructure([
                'success',
                'message',
                'token',
                'access_token',
                'token_type',
                'expires_in',
                'user' => ['id', 'name', 'email', 'role', 'roles'],
                'data' => [
                    'user' => ['id', 'name', 'email', 'role', 'roles'],
                    'access_token',
                    'token_type',
                    'expires_in',
                ],
            ]);

        $jwt = $response->json('data.access_token');
        $this->assertNotEmpty($jwt);

        $payload = JwtAuthService::verify($jwt);
        $this->assertNotNull($payload);
        $this->assertEquals('admin@gmail.com', $payload['email']);
        $this->assertEquals('Super Admin', $payload['role']);
    }

    /**
     * Requirement: Login with incorrect password → 401
     */
    public function test_login_with_incorrect_password_returns_401(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@gmail.com',
            'password' => 'wrong_password_123',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'message' => 'Invalid email or password.',
            ]);
    }

    /**
     * Requirement: Login with nonexistent user → 401
     */
    public function test_login_with_nonexistent_user_returns_401(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'ghost.user.not.exist@gmail.com',
            'password' => '1234567',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'message' => 'Invalid email or password.',
            ]);
    }

    /**
     * Requirement: Login with missing fields → 422
     */
    public function test_login_with_missing_fields_returns_422(): void
    {
        // Missing password
        $response1 = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@gmail.com',
        ]);
        $response1->assertStatus(422)
            ->assertJson(['success' => false]);

        // Missing email and username
        $response2 = $this->postJson('/api/v1/auth/login', [
            'password' => '1234567',
        ]);
        $response2->assertStatus(422)
            ->assertJson(['success' => false]);
    }

    /**
     * Requirement: Login with Employee Code (e.g. TKH-0001 or EMP-001) → Success + JWT
     */
    public function test_login_with_employee_code_returns_success_and_jwt(): void
    {
        // Find hospital director seeded in database (TKH-0001)
        $director = Employee::where('employee_code', 'TKH-0001')->first();
        $this->assertNotNull($director);

        $response = $this->postJson('/api/v1/auth/login', [
            'username' => 'TKH-0001',
            'password' => '1234567',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Login successful',
            ]);

        $jwt = $response->json('access_token');
        $payload = JwtAuthService::verify($jwt);
        $this->assertNotNull($payload);
        $this->assertEquals($director->user_id, $payload['sub']);
    }

    /**
     * Requirement: Access protected API with valid JWT → Success
     */
    public function test_access_protected_api_with_valid_jwt_succeeds(): void
    {
        $user = User::where('email', 'admin@gmail.com')->first();
        $jwt = JwtAuthService::generate($user, 3600);

        // Access /api/v1/auth/me with JWT Bearer Token
        $responseMe = $this->withHeader('Authorization', 'Bearer ' . $jwt)
            ->getJson('/api/v1/auth/me');

        $responseMe->assertStatus(200)
            ->assertJson([
                'success' => true,
                'user' => [
                    'email' => 'admin@gmail.com',
                ],
            ]);

        // Access /api/v1/dashboard/stats with JWT Bearer Token
        $responseStats = $this->withHeader('Authorization', 'Bearer ' . $jwt)
            ->getJson('/api/v1/dashboard/stats');

        $responseStats->assertStatus(200);
    }

    /**
     * Requirement: Access protected API without JWT → 401
     */
    public function test_access_protected_api_without_jwt_returns_401(): void
    {
        $response = $this->getJson('/api/v1/auth/me');
        $response->assertStatus(401);
    }

    /**
     * Requirement: Access protected API with invalid/tampered JWT → 401
     */
    public function test_access_protected_api_with_invalid_jwt_returns_401(): void
    {
        $user = User::where('email', 'admin@gmail.com')->first();
        $tamperedJwt = JwtAuthService::generate($user, 3600) . 'tampered';

        $response = $this->withHeader('Authorization', 'Bearer ' . $tamperedJwt)
            ->getJson('/api/v1/auth/me');

        $response->assertStatus(401);
    }

    /**
     * Requirement: Access protected API with expired JWT → 401
     */
    public function test_access_protected_api_with_expired_jwt_returns_401(): void
    {
        $user = User::where('email', 'admin@gmail.com')->first();
        // Generate an already expired JWT (-10 seconds)
        $expiredJwt = JwtAuthService::generate($user, -10);

        $response = $this->withHeader('Authorization', 'Bearer ' . $expiredJwt)
            ->getJson('/api/v1/auth/me');

        $response->assertStatus(401);
    }

    /**
     * Requirement: Inactive or suspended user account rejection → 403
     */
    public function test_login_with_suspended_or_inactive_account_returns_403(): void
    {
        // Create suspended user
        $suspendedUser = User::create([
            'name' => 'Suspended Doctor',
            'email' => 'suspended@hospital.gov.kh',
            'password' => Hash::make('1234567'),
        ]);

        Employee::create([
            'user_id' => $suspendedUser->id,
            'employee_code' => 'TKH-SUSP',
            'first_name' => 'Suspended',
            'last_name' => 'Doctor',
            'gender' => 'male',
            'email' => 'suspended@hospital.gov.kh',
            'employment_status' => 'suspended',
            'join_date' => '2023-01-01',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'suspended@hospital.gov.kh',
            'password' => '1234567',
        ]);

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'Your account has been deactivated or suspended. Please contact administrator.',
            ]);
    }

    /**
     * Requirement: Token Refresh → Returns new valid token
     */
    public function test_refresh_token_returns_new_valid_jwt(): void
    {
        $user = User::where('email', 'admin@gmail.com')->first();
        $initialJwt = JwtAuthService::generate($user, 3600);

        $response = $this->withHeader('Authorization', 'Bearer ' . $initialJwt)
            ->postJson('/api/v1/auth/refresh');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Token refreshed successfully',
                'token_type' => 'Bearer',
            ])
            ->assertJsonStructure([
                'token',
                'access_token',
                'token_type',
                'expires_in',
            ]);

        $newJwt = $response->json('access_token');
        $this->assertNotEmpty($newJwt);
        $this->assertNotEquals($initialJwt, $newJwt);

        $payload = JwtAuthService::verify($newJwt);
        $this->assertNotNull($payload);
        $this->assertEquals('admin@gmail.com', $payload['email']);
    }

    /**
     * Requirement: Logout → Token invalidated / blacklisted
     */
    public function test_logout_invalidates_current_jwt_token(): void
    {
        $user = User::where('email', 'admin@gmail.com')->first();
        $jwt = JwtAuthService::generate($user, 3600);

        // Before logout, access works
        $beforeResponse = $this->withHeader('Authorization', 'Bearer ' . $jwt)
            ->getJson('/api/v1/auth/me');
        $beforeResponse->assertStatus(200);

        // Perform logout
        $logoutResponse = $this->withHeader('Authorization', 'Bearer ' . $jwt)
            ->postJson('/api/v1/auth/logout');
        $logoutResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Successfully logged out',
            ]);

        // After logout, token should be blacklisted and rejected
        $this->app['auth']->forgetGuards();
        $afterResponse = $this->withHeader('Authorization', 'Bearer ' . $jwt)
            ->getJson('/api/v1/auth/me');
        $afterResponse->assertStatus(401);
    }
}
