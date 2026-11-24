<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Employee;
use App\Models\Organization;
use App\Models\Position;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HospitalSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_hospital_database_seeder_runs_successfully(): void
    {
        $this->seed(DatabaseSeeder::class);

        $org = Organization::first();
        $this->assertNotNull($org);
        $this->assertEquals('មន្ទីរពេទ្យមិត្តភាពកម្ពុជា-ចិនត្បូងឃ្មុំ', $org->name);

        // Verify departments count (includes hospital departments)
        $departmentsCount = Department::count();
        $this->assertGreaterThanOrEqual(22, $departmentsCount);

        // Verify total employees count (213 hospital staff + core users)
        $employeesCount = Employee::count();
        $this->assertGreaterThanOrEqual(213, $employeesCount);

        // Verify hospital leadership
        $director = Employee::where('first_name', 'អេក')->where('last_name', 'ឃាង')->first();
        $this->assertNotNull($director);
        $this->assertEquals('TKH-0001', $director->employee_code);

        // Verify department heads
        $adminChief = Employee::where('first_name', 'ជា')->where('last_name', 'សីលា')->first();
        $this->assertNotNull($adminChief);
        $this->assertEquals('TKH-0004', $adminChief->employee_code);

        $adminDept = Department::where('code', 'ADMIN')->first();
        $this->assertNotNull($adminDept);
        $this->assertEquals($adminChief->id, $adminDept->manager_id);
    }
}

