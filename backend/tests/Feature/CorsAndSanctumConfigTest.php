<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\JwtAuthService;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CorsAndSanctumConfigTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    /**
     * Requirement: CORS reads allowed origins from environment and permits Vite development origin
     */
    public function test_cors_preflight_allows_frontend_origin(): void
    {
        $response = $this->withHeaders([
            'Origin' => 'http://localhost:5173',
            'Access-Control-Request-Method' => 'POST',
            'Access-Control-Request-Headers' => 'Authorization, Content-Type, Accept, Accept-Language, X-Company-Id, X-Locale',
        ])->options('/api/v1/auth/login');

        $this->assertTrue(in_array($response->getStatusCode(), [200, 204]), 'Preflight should return 200 or 204');
        $this->assertEquals('http://localhost:5173', $response->headers->get('Access-Control-Allow-Origin'));
        $this->assertEquals('true', $response->headers->get('Access-Control-Allow-Credentials'));
    }

    /**
     * Requirement: CORS rejects unauthorized external origins
     */
    public function test_cors_rejects_unauthorized_origin(): void
    {
        $response = $this->withHeaders([
            'Origin' => 'http://unauthorized-evil-domain.com',
            'Access-Control-Request-Method' => 'POST',
        ])->options('/api/v1/auth/login');

        $allowOrigin = $response->headers->get('Access-Control-Allow-Origin');
        $this->assertNotEquals('http://unauthorized-evil-domain.com', $allowOrigin);
    }

    /**
     * Requirement: Sanctum stateful domains include the frontend development host and port
     */
    public function test_sanctum_stateful_domains_includes_frontend(): void
    {
        $statefulDomains = config('sanctum.stateful', []);

        $this->assertIsArray($statefulDomains);
        $this->assertTrue(
            in_array('localhost:5173', $statefulDomains),
            'Sanctum stateful domains must include localhost:5173'
        );
        $this->assertTrue(
            in_array('127.0.0.1:5173', $statefulDomains),
            'Sanctum stateful domains must include 127.0.0.1:5173'
        );
    }

    /**
     * Requirement: CORS allowed paths include api/* and CSRF endpoints
     */
    public function test_cors_paths_include_api_and_csrf_endpoints(): void
    {
        $paths = config('cors.paths', []);

        $this->assertContains('api/*', $paths);
        $this->assertContains('sanctum/csrf-cookie', $paths);
    }

    /**
     * Requirement: CORS allowed origins must NOT contain wildcard '*' when credentials are true
     */
    public function test_cors_does_not_contain_wildcard_when_credentials_are_supported(): void
    {
        $supportsCredentials = config('cors.supports_credentials');
        $allowedOrigins = config('cors.allowed_origins', []);

        if ($supportsCredentials) {
            $this->assertNotContains(
                '*',
                $allowedOrigins,
                'When supports_credentials is true, allowed_origins cannot contain wildcard "*"'
            );
        }
    }

    /**
     * Requirement: Authenticated request with Bearer token respects CORS origin headers
     */
    public function test_authenticated_api_request_with_cors_origin_succeeds(): void
    {
        $user = User::where('email', 'admin@gmail.com')->first();
        $this->assertNotNull($user, 'Seeded admin user must exist');

        $jwt = JwtAuthService::generate($user, 3600);

        $response = $this->withHeaders([
            'Origin' => 'http://localhost:5173',
            'Authorization' => 'Bearer ' . $jwt,
            'Accept' => 'application/json',
            'Accept-Language' => 'km',
        ])->getJson('/api/v1/auth/me');

        $response->assertStatus(200);
        $this->assertEquals('http://localhost:5173', $response->headers->get('Access-Control-Allow-Origin'));
        $this->assertEquals('true', $response->headers->get('Access-Control-Allow-Credentials'));
        $response->assertJson([
            'success' => true,
            'user' => [
                'email' => 'admin@gmail.com',
            ],
        ]);
    }
}

