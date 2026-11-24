<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Employee;
use App\Models\EmployeeAssignment;
use App\Models\EmployeeSalary;
use App\Models\EmploymentType;
use App\Models\Organization;
use App\Models\Position;
use App\Models\SalaryStructure;
use App\Models\User;
use App\Models\WorkLocation;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SmartHREmployeeSeeder extends Seeder
{
    public function run(): void
    {
        $deptTitles = [
            'Human Resources' => 'HR Specialist',
            'Operations' => 'Operations Analyst',
            'Finance' => 'Finance Analyst',
            'Engineering' => 'Software Engineer',
            'Sales' => 'Account Executive',
            'Customer Support' => 'Support Specialist',
            'Field Services' => 'Field Technician',
            'Administration' => 'Administrative Coordinator',
            'Marketing' => 'Marketing Associate',
            'IT' => 'IT Support Engineer',
        ];

        $deptModels = [];
        $posModels = [];

        $salaryStructure = SalaryStructure::firstOrCreate(
            ['code' => 'SAL-USD-STD'],
            [
                'name' => 'Standard Executive & Professional USD',
                'description' => 'Base USD structure for professional and corporate roles',
                'currency' => 'USD',
                'is_active' => true,
            ]
        );

        $posSalaries = [
            'HR Specialist' => ['min' => 1200, 'max' => 2200, 'salary' => 1600],
            'Operations Analyst' => ['min' => 1100, 'max' => 2000, 'salary' => 1500],
            'Finance Analyst' => ['min' => 1400, 'max' => 2500, 'salary' => 2100],
            'Software Engineer' => ['min' => 1800, 'max' => 3800, 'salary' => 2800],
            'Account Executive' => ['min' => 1300, 'max' => 2800, 'salary' => 2200],
            'Support Specialist' => ['min' => 900, 'max' => 1600, 'salary' => 1200],
            'Field Technician' => ['min' => 1000, 'max' => 1800, 'salary' => 1400],
            'Administrative Coordinator' => ['min' => 800, 'max' => 1500, 'salary' => 1100],
            'Marketing Associate' => ['min' => 1100, 'max' => 2200, 'salary' => 1700],
            'IT Support Engineer' => ['min' => 1200, 'max' => 2400, 'salary' => 1900],
        ];

        $org = Organization::first();

        foreach ($deptTitles as $deptName => $title) {
            $dept = Department::firstOrCreate(
                ['name' => $deptName],
                [
                    'organization_id' => $org?->id,
                    'code' => strtoupper(substr(preg_replace('/[^a-zA-Z]/', '', $deptName), 0, 4)),
                    'description' => $deptName . ' department',
                    'status' => 'active',
                ]
            );
            $deptModels[$deptName] = $dept;

            $posInfo = $posSalaries[$title] ?? ['min' => 1000, 'max' => 2000, 'salary' => 1500];
            $pos = Position::firstOrCreate(
                ['title' => $title],
                [
                    'code' => strtoupper(substr(preg_replace('/[^a-zA-Z]/', '', $title), 0, 4)),
                    'department_id' => $dept->id,
                    'min_salary' => $posInfo['min'],
                    'max_salary' => $posInfo['max'],
                    'status' => 'active',
                ]
            );
            $posModels[$deptName] = $pos;
        }

        $offices = [
            ['office' => 'London HQ', 'country' => 'United Kingdom', 'city' => 'London'],
            ['office' => 'New York Office', 'country' => 'United States', 'city' => 'New York'],
            ['office' => 'Toronto Office', 'country' => 'Canada', 'city' => 'Toronto'],
            ['office' => 'Milan Office', 'country' => 'Italy', 'city' => 'Milan'],
            ['office' => 'Berlin HQ', 'country' => 'Germany', 'city' => 'Berlin'],
            ['office' => 'Madrid Office', 'country' => 'Spain', 'city' => 'Madrid'],
            ['office' => 'Sydney Office', 'country' => 'Australia', 'city' => 'Sydney'],
            ['office' => 'Paris Office', 'country' => 'France', 'city' => 'Paris'],
            ['office' => 'Tokyo Office', 'country' => 'Japan', 'city' => 'Tokyo'],
            ['office' => 'Dubai Office', 'country' => 'UAE', 'city' => 'Dubai'],
            ['office' => 'Amsterdam Office', 'country' => 'Netherlands', 'city' => 'Amsterdam'],
            ['office' => 'Stockholm Office', 'country' => 'Sweden', 'city' => 'Stockholm'],
        ];

        $locationModels = [];
        foreach ($offices as $o) {
            $loc = WorkLocation::firstOrCreate(
                ['name' => $o['office']],
                [
                    'organization_id' => $org?->id,
                    'code' => strtoupper(substr(preg_replace('/[^a-zA-Z]/', '', $o['office']), 0, 6)),
                    'address' => $o['city'] . ', ' . $o['country'],
                    'city' => $o['city'],
                    'country' => $o['country'],
                    'status' => 'active',
                ]
            );
            $locationModels[$o['office']] = $loc;
        }

        $names = explode('.', 'Olivia Bennett.Daniel Carter.Sophia Mitchell.Matteo Rossi.Hannah Müller.Elena Garcia.Liam Wilson.Chloe Laurent.Kenji Tanaka.Aisha Rahman.Lucas Martin.Emma Johansson.Ethan Williams.Amelia Thompson.Charlotte Dubois.Alexander Schmidt.Mia Taylor.James Anderson.Benjamin Clark.William Brown.Isabella Rossi.Noah Anderson.Grace Fischer.Henry Novak.Ava Petersen.Lucas Ferreira.Zoe Marchetti.Samuel Okafor.Freya Larsen.Adam Kowalski');
        
        $types = ['Full-time', 'Full-time', 'Full-time', 'Contract', 'Part-time', 'Intern'];
        $statuses = ['active', 'active', 'active', 'active', 'probation', 'inactive'];
        $managers = ['Olivia Bennett', 'Daniel Carter', 'Sophia Mitchell', 'Hannah Müller', 'Liam Wilson'];

        $empTypeModels = [];
        foreach (['Full-time', 'Contract', 'Part-time', 'Intern'] as $tName) {
            $empTypeModels[$tName] = EmploymentType::firstOrCreate(
                ['name' => $tName],
                ['code' => strtoupper(substr($tName, 0, 2)), 'is_active' => true]
            );
        }

        $deptKeys = array_keys($deptTitles);

        foreach ($names as $idx => $fullName) {
            $parts = explode(' ', $fullName, 2);
            $firstName = $parts[0];
            $lastName = $parts[1] ?? 'Staff';
            $empCode = sprintf('EMP-%04d', 1001 + $idx);

            $deptName = $deptKeys[$idx % count($deptKeys)];
            $dept = $deptModels[$deptName];
            $pos = $posModels[$deptName];
            $office = $offices[$idx % count($offices)];
            $loc = $locationModels[$office['office']];
            $empTypeStr = $types[$idx % count($types)];
            $empType = $empTypeModels[$empTypeStr];
            $status = $statuses[$idx % count($statuses)];
            $managerName = $managers[$idx % count($managers)];

            $year = 2020 + ($idx % 6);
            $month = str_pad(($idx % 12) + 1, 2, '0', STR_PAD_LEFT);
            $day = str_pad(($idx % 27) + 1, 2, '0', STR_PAD_LEFT);
            $joinDate = "{$year}-{$month}-{$day}";

            $emailSlug = strtolower(preg_replace('/[^a-z]/', '', $firstName) . '.' . preg_replace('/[^a-z]/', '', $lastName));
            $email = "{$emailSlug}@northstarglobal.com";

            $baseSalaryAmount = $posSalaries[$title]['salary'] ?? 1600.00;

            // Check if employee already exists
            $employee = Employee::where('email', $email)->orWhere('employee_code', $empCode)->first();
            if (!$employee) {
                $user = User::firstOrCreate(
                    ['email' => $email],
                    [
                        'name' => $fullName,
                        'password' => Hash::make('1234567'),
                        'email_verified_at' => now(),
                    ]
                );
                $user->assignRole('Employee');

                $employee = Employee::create([
                    'user_id' => $user->id,
                    'employee_code' => $empCode,
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'gender' => ($idx % 2 === 0) ? 'female' : 'male',
                    'date_of_birth' => '199' . ($idx % 10) . '-04-15',
                    'marital_status' => 'single',
                    'nationality' => $office['country'],
                    'national_id' => 'ID-' . (200000 + $idx),
                    'email' => $email,
                    'phone' => '+' . (10 + ($idx % 80)) . ' ' . (100 + $idx) . ' 555 ' . (1000 + $idx),
                    'personal_email' => "{$emailSlug}.personal@gmail.com",
                    'join_date' => $joinDate,
                    'probation_end_date' => Carbon::parse($joinDate)->addMonths(3)->toDateString(),
                    'contract_end_date' => Carbon::parse($joinDate)->addYears(2)->toDateString(),
                    'employment_status' => $status,
                    'address' => $office['city'] . ', ' . $office['country'],
                    'city' => $office['city'],
                    'bank_name' => 'Global Horizon Bank',
                    'bank_account_name' => strtoupper($fullName),
                    'bank_account_number' => 'ACC-' . (880000 + $idx),
                    'qr_code_token' => bin2hex(random_bytes(16)),
                ]);

                EmployeeAssignment::create([
                    'employee_id' => $employee->id,
                    'department_id' => $dept->id,
                    'position_id' => $pos->id,
                    'work_location_id' => $loc->id,
                    'supervisor_id' => null,
                    'employment_type_id' => $empType->id,
                    'start_date' => $joinDate,
                    'end_date' => null,
                    'is_primary' => true,
                    'status' => 'active',
                    'notes' => 'Primary assignment created by seeder. Manager: ' . $managerName,
                ]);

                EmployeeSalary::create([
                    'employee_id' => $employee->id,
                    'salary_structure_id' => $salaryStructure->id,
                    'base_salary' => $baseSalaryAmount,
                    'currency' => 'USD',
                    'effective_date' => $joinDate,
                    'payment_frequency' => 'monthly',
                    'status' => 'active',
                ]);
            } else {
                // Ensure existing employee has salary record
                if (!$employee->currentSalary) {
                    EmployeeSalary::firstOrCreate(
                        ['employee_id' => $employee->id, 'status' => 'active'],
                        [
                            'salary_structure_id' => $salaryStructure->id,
                            'base_salary' => $baseSalaryAmount,
                            'currency' => 'USD',
                            'effective_date' => $employee->join_date ? $employee->join_date->toDateString() : $joinDate,
                            'payment_frequency' => 'monthly',
                        ]
                    );
                }
            }
        }
    }
}
