<?php

namespace Tests\Unit\Services;

use App\Models\Employee;
use App\Services\Employee\EmployeeService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmployeeServiceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_employee_service_retrieves_paginated_and_by_id(): void
    {
        $service = app(EmployeeService::class);

        $paginated = $service->getEmployees([], 5);
        $this->assertEquals(5, $paginated->perPage());

        $first = Employee::first();
        $found = $service->getEmployeeById($first->id);

        $this->assertNotNull($found);
        $this->assertEquals($first->id, $found->id);
    }
}

