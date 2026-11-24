<?php

namespace Database\Seeders;

use App\Models\Announcement;
use App\Models\AttendanceRecord;
use App\Models\Candidate;
use App\Models\Department;
use App\Models\Employee;
use App\Models\EmployeeAssignment;
use App\Models\EmployeeContact;
use App\Models\EmployeeEducation;
use App\Models\EmployeeEmergencyContact;
use App\Models\EmployeeExperience;
use App\Models\EmployeeQrCode;
use App\Models\EmployeeSalary;
use App\Models\EmploymentType;
use App\Models\Holiday;
use App\Models\HospitalGeofence;
use App\Models\HospitalNetwork;
use App\Models\JobApplication;
use App\Models\JobVacancy;
use App\Models\LeaveBalance;
use App\Models\LeaveBalanceTransaction;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\Organization;
use App\Models\Payroll;
use App\Models\PayrollItem;
use App\Models\Payslip;
use App\Models\Position;
use App\Models\SalaryStructure;
use App\Models\SystemSetting;
use App\Models\TrainingProgram;
use App\Models\User;
use App\Models\WorkLocation;
use App\Models\WorkShift;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Roles & Permissions setup
        $roles = [
            'Super Admin',
            'HR Manager',
            'HR Staff',
            'Department Manager',
            'Accountant',
            'Employee',
        ];

        foreach ($roles as $roleName) {
            Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
        }

        $permissions = [
            'view dashboard',
            'manage organization',
            'manage employees',
            'manage assignments',
            'view attendance',
            'manage attendance',
            'approve attendance',
            'view leaves',
            'request leaves',
            'approve leaves supervisor',
            'approve leaves hr',
            'view payroll',
            'process payroll',
            'view recruitment',
            'manage recruitment',
            'view performance',
            'manage performance',
            'view training',
            'manage training',
            'view reports',
            'export reports',
            'manage users',
            'manage roles',
            'view audit logs',
            'manage settings',
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
        }

        $superAdminRole = Role::findByName('Super Admin');
        $superAdminRole->syncPermissions(Permission::all());

        $hrManagerRole = Role::findByName('HR Manager');
        $hrManagerRole->syncPermissions([
            'view dashboard', 'manage organization', 'manage employees', 'manage assignments',
            'view attendance', 'manage attendance', 'approve attendance',
            'view leaves', 'request leaves', 'approve leaves supervisor', 'approve leaves hr',
            'view recruitment', 'manage recruitment', 'view performance', 'manage performance',
            'view training', 'manage training', 'view reports', 'export reports',
        ]);

        $hrStaffRole = Role::findByName('HR Staff');
        $hrStaffRole->syncPermissions([
            'view dashboard', 'manage employees', 'manage assignments', 'view attendance',
            'manage attendance', 'view leaves', 'request leaves', 'view recruitment',
            'view training', 'view reports',
        ]);

        $deptManagerRole = Role::findByName('Department Manager');
        $deptManagerRole->syncPermissions([
            'view dashboard', 'view attendance', 'approve attendance',
            'view leaves', 'request leaves', 'approve leaves supervisor',
            'view performance', 'manage performance',
        ]);

        $accountantRole = Role::findByName('Accountant');
        $accountantRole->syncPermissions([
            'view dashboard', 'view payroll', 'process payroll', 'view reports', 'export reports',
        ]);

        $employeeRole = Role::findByName('Employee');
        $employeeRole->syncPermissions([
            'view dashboard', 'view attendance', 'view leaves', 'request leaves',
        ]);

        // 2. Organization Profile
        $org = Organization::create([
            'name' => 'មន្ទីរពេទ្យមិត្តភាពកម្ពុជា-ចិនត្បូងឃ្មុំ',
            'legal_name' => 'មន្ទីរពេទ្យមិត្តភាពកម្ពុជា-ចិនត្បូងឃ្មុំ (Tbong Khmum Cambodia-China Friendship Hospital)',
            'registration_number' => 'MOH-TBK-001',
            'tax_id' => 'K002-98475632',
            'email' => 'contact@tbongkhmum-hospital.gov.kh',
            'phone' => '+855 42 941 234',
            'website' => 'https://tbongkhmum-hospital.gov.kh',
            'address' => 'ផ្លូវជាតិលេខ ៧, ភូមិនិគមលើ, ឃុំស្រឡប់, ស្រុកត្បូងឃ្មុំ',
            'city' => 'ត្បូងឃ្មុំ',
            'country' => 'Cambodia',
            'default_currency' => 'USD',
            'fiscal_year_start' => '01-01',
        ]);

        // 2b. Hospital Wi-Fi Networks (Public Egress & Internal Hospital Subnets)
        if (Schema::hasTable('hospital_networks')) {
            HospitalNetwork::create([
                'organization_id' => $org->id,
                'branch_name' => 'Tbong Khmum Main Hospital',
                'network_name' => 'Hospital Medical Staff Wi-Fi (Primary Egress)',
                'allowed_ip' => '203.144.68.100',
                'allowed_cidr' => '203.144.68.0/24',
                'description' => 'Dedicated high-speed fiber egress for hospital clinical staff & doctors',
                'status' => 'active',
            ]);

            HospitalNetwork::create([
                'organization_id' => $org->id,
                'branch_name' => 'Tbong Khmum Main Hospital',
                'network_name' => 'Hospital Emergency & Internal VLAN (Private Subnet)',
                'allowed_cidr' => '192.168.10.0/24',
                'description' => 'Internal medical intranet for clinical wards and nursing stations',
                'status' => 'active',
            ]);

            HospitalNetwork::create([
                'organization_id' => $org->id,
                'branch_name' => 'Local Development & Testing Gateway',
                'network_name' => 'Authorized Local Test Loopback',
                'allowed_ip' => '127.0.0.1',
                'allowed_cidr' => '127.0.0.1/32',
                'description' => 'Development and local testing access for hospital system administrators',
                'status' => 'active',
            ]);
        }

        // 2c. Hospital Geofence Locations (Authorized GPS Attendance Zones)
        if (Schema::hasTable('hospital_geofences')) {
            HospitalGeofence::create([
                'organization_id' => $org->id,
                'name' => 'Tbong Khmum Hospital Main Medical Center',
                'branch_name' => 'Main Campus',
                'latitude' => 11.8891000,
                'longitude' => 105.8762000,
                'radius_meters' => 200,
                'max_accuracy_meters' => 80,
                'status' => 'active',
                'description' => 'Main inpatient building, outpatient clinics, and ICU pavilion',
            ]);

            HospitalGeofence::create([
                'organization_id' => $org->id,
                'name' => 'Emergency & Trauma Pavilion',
                'branch_name' => 'Emergency Wing',
                'latitude' => 11.8894500,
                'longitude' => 105.8766000,
                'radius_meters' => 150,
                'max_accuracy_meters' => 80,
                'status' => 'active',
                'description' => '24/7 Emergency room, surgical theater, and ambulance bay',
            ]);
        }

        // 3. Work Locations
        $hqLocation = null;
        $srLocation = null;
        if (Schema::hasTable('work_locations')) {
            $hqLocation = WorkLocation::create([
                'organization_id' => $org->id,
                'name' => 'មន្ទីរពេទ្យមិត្តភាពកម្ពុជា-ចិនត្បូងឃ្មុំ (ទីស្នាក់ការ)',
                'code' => 'LOC-TBK-HQ',
                'address' => 'ផ្លូវជាតិលេខ ៧, ភូមិនិគមលើ, ឃុំស្រឡប់, ស្រុកត្បូងឃ្មុំ',
                'city' => 'ត្បូងឃ្មុំ',
                'country' => 'Cambodia',
                'timezone' => 'Asia/Phnom_Penh',
                'is_headquarters' => true,
                'status' => 'active',
            ]);

            $srLocation = WorkLocation::create([
                'organization_id' => $org->id,
                'name' => 'Siem Reap Innovation Hub',
                'code' => 'LOC-REP-HUB',
                'address' => 'Charles de Gaulle Boulevard, Krong Siem Reap',
                'city' => 'Siem Reap',
                'country' => 'Cambodia',
                'timezone' => 'Asia/Phnom_Penh',
                'is_headquarters' => false,
                'status' => 'active',
            ]);
        }

        // 4. Employment Types
        $ftType = EmploymentType::create(['name' => 'Full-time Permanent', 'code' => 'FULL_TIME', 'description' => 'Standard 40 hours per week contract']);
        $probType = EmploymentType::create(['name' => 'Probationary', 'code' => 'PROBATION', 'description' => 'Initial 3-month evaluation period']);
        $contractType = EmploymentType::create(['name' => 'Fixed-Term Contract', 'code' => 'CONTRACT', 'description' => '12-month renewable engagement']);
        $internType = EmploymentType::create(['name' => 'Internship', 'code' => 'INTERN', 'description' => 'University student placement program']);

        // 5. Work Shifts
        $regularShift = WorkShift::create([
            'name' => 'Standard Office Hours',
            'code' => 'SHIFT-STD',
            'start_time' => '08:00:00',
            'end_time' => '17:00:00',
            'break_minutes' => 60,
            'grace_period_minutes' => 15,
            'half_day_hours' => 4.00,
            'full_day_hours' => 8.00,
            'is_overnight' => false,
            'status' => 'active',
        ]);

        $flexShift = WorkShift::create([
            'name' => 'Engineering Flex Shift',
            'code' => 'SHIFT-FLEX',
            'start_time' => '09:00:00',
            'end_time' => '18:00:00',
            'break_minutes' => 60,
            'grace_period_minutes' => 30,
            'half_day_hours' => 4.00,
            'full_day_hours' => 8.00,
            'is_overnight' => false,
            'status' => 'active',
        ]);

        // 6. Leave Types
        $annualLeave = LeaveType::create([
            'name' => 'Annual Leave',
            'code' => 'AL',
            'default_days_per_year' => 18,
            'is_paid' => true,
            'requires_attachment' => false,
            'carry_forward_days' => 5,
            'status' => 'active',
        ]);

        $sickLeave = LeaveType::create([
            'name' => 'Sick Leave',
            'code' => 'SL',
            'default_days_per_year' => 15,
            'is_paid' => true,
            'requires_attachment' => true,
            'carry_forward_days' => 0,
            'status' => 'active',
        ]);

        $specialLeave = LeaveType::create([
            'name' => 'Special Personal Leave',
            'code' => 'SPL',
            'default_days_per_year' => 7,
            'is_paid' => true,
            'requires_attachment' => false,
            'carry_forward_days' => 0,
            'status' => 'active',
        ]);

        $unpaidLeave = LeaveType::create([
            'name' => 'Unpaid Leave',
            'code' => 'UL',
            'default_days_per_year' => 30,
            'is_paid' => false,
            'requires_attachment' => false,
            'carry_forward_days' => 0,
            'status' => 'active',
        ]);

        // 7. Salary Structures
        $standardSalaryStructure = null;
        if (Schema::hasTable('salary_structures')) {
            $standardSalaryStructure = SalaryStructure::create([
                'name' => 'Standard Executive & Professional USD',
                'code' => 'SAL-USD-STD',
                'description' => 'Base USD structure for professional and corporate roles',
                'currency' => 'USD',
                'is_active' => true,
            ]);

            $khrSalaryStructure = SalaryStructure::create([
                'name' => 'Cambodian Riel Professional (KHR)',
                'code' => 'SAL-KHR-STD',
                'description' => 'Salaries denominated in Khmer Riel',
                'currency' => 'KHR',
                'is_active' => true,
            ]);
        }

        // 8. Departments
        $deptExec = Department::create([
            'organization_id' => $org->id,
            'name' => 'Executive Office',
            'code' => 'EXEC',
            'description' => 'Executive governance, vision, and strategic direction',
            'status' => 'active',
        ]);

        $deptHR = Department::create([
            'organization_id' => $org->id,
            'name' => 'Human Resources & People',
            'code' => 'HR',
            'description' => 'Talent acquisition, employee welfare, performance, and compliance',
            'status' => 'active',
        ]);

        $deptEng = Department::create([
            'organization_id' => $org->id,
            'name' => 'Engineering & Technology',
            'code' => 'ENG',
            'description' => 'Software engineering, cloud infrastructure, and technical innovation',
            'status' => 'active',
        ]);

        $deptFinance = Department::create([
            'organization_id' => $org->id,
            'name' => 'Finance & Accounting',
            'code' => 'FIN',
            'description' => 'Financial operations, audits, payroll, and fiscal controls',
            'status' => 'active',
        ]);

        $deptMarketing = Department::create([
            'organization_id' => $org->id,
            'name' => 'Marketing & Growth',
            'code' => 'MKT',
            'description' => 'Brand strategy, enterprise partnerships, and corporate outreach',
            'status' => 'active',
        ]);

        // 9. Positions
        $posCEO = Position::create(['department_id' => $deptExec->id, 'title' => 'Chief Executive Officer', 'code' => 'POS-CEO', 'level' => 'executive', 'min_salary' => 5000, 'max_salary' => 12000]);
        $posHRDirector = Position::create(['department_id' => $deptHR->id, 'title' => 'HR Director', 'code' => 'POS-HR-DIR', 'level' => 'lead', 'min_salary' => 2500, 'max_salary' => 4500]);
        $posHRSpecialist = Position::create(['department_id' => $deptHR->id, 'title' => 'Senior HR Specialist', 'code' => 'POS-HR-SPEC', 'level' => 'mid', 'min_salary' => 1000, 'max_salary' => 2000]);
        $posVPTech = Position::create(['department_id' => $deptEng->id, 'title' => 'VP of Engineering', 'code' => 'POS-VP-ENG', 'level' => 'executive', 'min_salary' => 4000, 'max_salary' => 8000]);
        $posSeniorDev = Position::create(['department_id' => $deptEng->id, 'title' => 'Senior Full-Stack Architect', 'code' => 'POS-SR-DEV', 'level' => 'senior', 'min_salary' => 2000, 'max_salary' => 3800]);
        $posFrontendDev = Position::create(['department_id' => $deptEng->id, 'title' => 'React Frontend Developer', 'code' => 'POS-FE-DEV', 'level' => 'mid', 'min_salary' => 1200, 'max_salary' => 2200]);
        $posFinanceLead = Position::create(['department_id' => $deptFinance->id, 'title' => 'Finance Director', 'code' => 'POS-FIN-DIR', 'level' => 'lead', 'min_salary' => 2500, 'max_salary' => 4500]);
        $posSeniorAccountant = Position::create(['department_id' => $deptFinance->id, 'title' => 'Senior Payroll Accountant', 'code' => 'POS-ACC-SR', 'level' => 'senior', 'min_salary' => 1200, 'max_salary' => 2200]);

        // 10. Users & Core Employees
        $userSeedData = [
            [
                'email' => 'admin@gmail.com',
                'name' => 'Sokha Meng (Super Admin)',
                'role' => 'Super Admin',
                'emp_code' => 'EMP-001',
                'first_name' => 'Sokha',
                'last_name' => 'Meng',
                'gender' => 'male',
                'position' => $posCEO,
                'department' => $deptExec,
                'salary' => 8500.00,
                'join_date' => '2021-01-15',
            ],
            [
                'email' => 'hrmanager@gmail.com',
                'name' => 'Chanthy Vorn (HR Manager)',
                'role' => 'HR Manager',
                'emp_code' => 'EMP-002',
                'first_name' => 'Chanthy',
                'last_name' => 'Vorn',
                'gender' => 'female',
                'position' => $posHRDirector,
                'department' => $deptHR,
                'salary' => 3600.00,
                'join_date' => '2021-03-01',
            ],
            [
                'email' => 'hrstaff@gmail.com',
                'name' => 'Sreyneath Khem (HR Staff)',
                'role' => 'HR Staff',
                'emp_code' => 'EMP-003',
                'first_name' => 'Sreyneath',
                'last_name' => 'Khem',
                'gender' => 'female',
                'position' => $posHRSpecialist,
                'department' => $deptHR,
                'salary' => 1600.00,
                'join_date' => '2022-06-15',
            ],
            [
                'email' => 'deptmanager@gmail.com',
                'name' => 'Rithy Dara (VP Engineering)',
                'role' => 'Department Manager',
                'emp_code' => 'EMP-004',
                'first_name' => 'Rithy',
                'last_name' => 'Dara',
                'gender' => 'male',
                'position' => $posVPTech,
                'department' => $deptEng,
                'salary' => 5200.00,
                'join_date' => '2021-04-10',
            ],
            [
                'email' => 'accountant@gmail.com',
                'name' => 'Kosal Som (Chief Accountant)',
                'role' => 'Accountant',
                'emp_code' => 'EMP-005',
                'first_name' => 'Kosal',
                'last_name' => 'Som',
                'gender' => 'male',
                'position' => $posSeniorAccountant,
                'department' => $deptFinance,
                'salary' => 2100.00,
                'join_date' => '2022-01-20',
            ],
            [
                'email' => 'employee@gmail.com',
                'name' => 'Bopha Pich (Frontend Developer)',
                'role' => 'Employee',
                'emp_code' => 'EMP-006',
                'first_name' => 'Bopha',
                'last_name' => 'Pich',
                'gender' => 'female',
                'position' => $posFrontendDev,
                'department' => $deptEng,
                'salary' => 1800.00,
                'join_date' => '2023-02-01',
            ],
            [
                'email' => 'sovann@gmail.com',
                'name' => 'Sovann Keo (Full-Stack Engineer)',
                'role' => 'Employee',
                'emp_code' => 'EMP-007',
                'first_name' => 'Sovann',
                'last_name' => 'Keo',
                'gender' => 'male',
                'position' => $posSeniorDev,
                'department' => $deptEng,
                'salary' => 2800.00,
                'join_date' => '2022-09-01',
            ],
        ];

        $createdEmployees = [];

        foreach ($userSeedData as $item) {
            $user = User::create([
                'name' => $item['name'],
                'email' => $item['email'],
                'password' => Hash::make('1234567'),
                'email_verified_at' => now(),
            ]);
            $user->assignRole($item['role']);

            $employee = Employee::create([
                'user_id' => $user->id,
                'employee_code' => $item['emp_code'],
                'first_name' => $item['first_name'],
                'last_name' => $item['last_name'],
                'gender' => $item['gender'],
                'date_of_birth' => '1992-05-18',
                'marital_status' => 'married',
                'nationality' => 'Cambodian',
                'national_id' => '010' . rand(100000, 999999),
                'email' => $item['email'],
                'phone' => '+855 ' . rand(10, 99) . ' ' . rand(100, 999) . ' ' . rand(100, 999),
                'personal_email' => strtolower($item['first_name']) . '.personal@gmail.com',
                'join_date' => $item['join_date'],
                'employment_status' => 'active',
                'address' => 'Street 271, Boeng Tumpun, Khan Mean Chey',
                'city' => 'Phnom Penh',
                'bank_name' => 'ABA Bank',
                'bank_account_name' => strtoupper($item['first_name'] . ' ' . $item['last_name']),
                'bank_account_number' => '00' . rand(100000, 999999) . 'ABA',
                'qr_code_token' => $rawToken = bin2hex(random_bytes(32)),
            ]);

            if (Schema::hasTable('employee_qr_codes')) {
                EmployeeQrCode::create([
                    'employee_id' => $employee->id,
                    'token_hash' => hash('sha256', $rawToken),
                    'status' => 'active',
                    'generated_at' => now(),
                    'generated_by' => $user->id,
                ]);
            }

            $createdEmployees[$item['emp_code']] = $employee;

            // Primary Assignment (Module 04)
            $assignmentData = [
                'employee_id' => $employee->id,
                'department_id' => $item['department']->id,
                'position_id' => $item['position']->id,
                'supervisor_id' => null, // will update below
                'employment_type_id' => $ftType->id,
                'start_date' => $item['join_date'],
                'end_date' => null,
                'is_primary' => true,
                'status' => 'active',
                'notes' => 'Primary assignment created on onboarding',
            ];
            if (Schema::hasColumn('employee_assignments', 'work_location_id')) {
                $assignmentData['work_location_id'] = $hqLocation?->id;
            }
            EmployeeAssignment::create($assignmentData);

            // Salary record if table exists
            if ($standardSalaryStructure && Schema::hasTable('employee_salaries')) {
                EmployeeSalary::create([
                    'employee_id' => $employee->id,
                    'salary_structure_id' => $standardSalaryStructure->id,
                    'base_salary' => $item['salary'],
                    'currency' => 'USD',
                    'effective_date' => $item['join_date'],
                    'payment_frequency' => 'monthly',
                    'status' => 'active',
                ]);
            }

            // Emergency contact
            EmployeeEmergencyContact::create([
                'employee_id' => $employee->id,
                'name' => 'Kolap ' . $item['last_name'],
                'relationship' => 'Spouse',
                'phone' => '+855 12 345 678',
                'address' => 'Phnom Penh, Cambodia',
                'is_primary' => true,
            ]);

            // Education
            EmployeeEducation::create([
                'employee_id' => $employee->id,
                'degree_level' => "Bachelor's Degree",
                'institution_name' => 'Royal University of Phnom Penh (RUPP)',
                'field_of_study' => 'Computer Science & Information Technology',
                'start_year' => 2010,
                'end_year' => 2014,
                'grade_or_gpa' => '3.80',
            ]);

            // Leave Balances for 2026
            foreach ([$annualLeave, $sickLeave, $specialLeave] as $lt) {
                LeaveBalance::create([
                    'employee_id' => $employee->id,
                    'leave_type_id' => $lt->id,
                    'year' => 2026,
                    'total_days' => $lt->default_days_per_year,
                    'used_days' => 2.00,
                    'pending_days' => 1.00,
                    'remaining_days' => $lt->default_days_per_year - 3.00,
                ]);
            }
        }

        // Set Department Managers & Supervisors
        $deptExec->update(['manager_id' => $createdEmployees['EMP-001']->id]);
        $deptHR->update(['manager_id' => $createdEmployees['EMP-002']->id]);
        $deptEng->update(['manager_id' => $createdEmployees['EMP-004']->id]);
        $deptFinance->update(['manager_id' => $createdEmployees['EMP-005']->id]);

        // Update supervisors for team members
        EmployeeAssignment::where('employee_id', $createdEmployees['EMP-002']->id)->update(['supervisor_id' => $createdEmployees['EMP-001']->id]);
        EmployeeAssignment::where('employee_id', $createdEmployees['EMP-003']->id)->update(['supervisor_id' => $createdEmployees['EMP-002']->id]);
        EmployeeAssignment::where('employee_id', $createdEmployees['EMP-004']->id)->update(['supervisor_id' => $createdEmployees['EMP-001']->id]);
        EmployeeAssignment::where('employee_id', $createdEmployees['EMP-005']->id)->update(['supervisor_id' => $createdEmployees['EMP-001']->id]);
        EmployeeAssignment::where('employee_id', $createdEmployees['EMP-006']->id)->update(['supervisor_id' => $createdEmployees['EMP-004']->id]);
        EmployeeAssignment::where('employee_id', $createdEmployees['EMP-007']->id)->update(['supervisor_id' => $createdEmployees['EMP-004']->id]);

        // Add a historical assignment demonstrating assignment history/transfers (Module 04 requirement)
        $histAssignment = [
            'employee_id' => $createdEmployees['EMP-007']->id,
            'department_id' => $deptEng->id,
            'position_id' => $posFrontendDev->id,
            'supervisor_id' => $createdEmployees['EMP-004']->id,
            'employment_type_id' => $ftType->id,
            'start_date' => '2022-09-01',
            'end_date' => '2024-01-01',
            'is_primary' => false,
            'status' => 'ended',
            'notes' => 'Promoted from Junior Frontend Developer at Siem Reap to Senior Full-Stack in Phnom Penh HQ',
        ];
        if (Schema::hasColumn('employee_assignments', 'work_location_id')) {
            $histAssignment['work_location_id'] = $srLocation?->id;
        }
        EmployeeAssignment::create($histAssignment);

        // 11. Sample Attendance for the current month
        $today = Carbon::today();
        foreach ($createdEmployees as $emp) {
            $assignment = $emp->primaryAssignment;
            // Generate last 7 days of attendance
            for ($i = 0; $i < 7; $i++) {
                $attDate = $today->copy()->subDays($i);
                if ($attDate->isWeekend()) {
                    continue;
                }

                $status = ($i === 1 && $emp->employee_code === 'EMP-006') ? 'late' : 'present';
                $checkIn = $attDate->copy()->setTime(8, ($status === 'late' ? 25 : rand(0, 10)), 0);
                $checkOut = $attDate->copy()->setTime(17, rand(0, 30), 0);
                $workingHours = 8.00;
                $lateMinutes = $status === 'late' ? 25 : 0;

                AttendanceRecord::create([
                    'employee_id' => $emp->id,
                    'assignment_id' => $assignment?->id,
                    'work_shift_id' => $regularShift->id,
                    'attendance_date' => $attDate->toDateString(),
                    'check_in_time' => $checkIn,
                    'check_out_time' => $checkOut,
                    'working_hours' => $workingHours,
                    'late_minutes' => $lateMinutes,
                    'early_leaving_minutes' => 0,
                    'overtime_hours' => 0.00,
                    'status' => $status,
                    'check_in_method' => 'manual',
                    'notes' => 'Normal workday scan',
                ]);
            }
        }

        // 12. Sample Leave Request with workflow
        $emp6 = $createdEmployees['EMP-006'];
        $leaveReq1 = LeaveRequest::create([
            'employee_id' => $emp6->id,
            'leave_type_id' => $annualLeave->id,
            'start_date' => Carbon::today()->addDays(5)->toDateString(),
            'end_date' => Carbon::today()->addDays(6)->toDateString(),
            'is_half_day' => false,
            'total_days' => 2.00,
            'reason' => 'Family annual vacation to Siem Reap',
            'status' => 'pending_supervisor',
            'supervisor_id' => $createdEmployees['EMP-004']->id,
        ]);

        $leaveReq2 = LeaveRequest::create([
            'employee_id' => $createdEmployees['EMP-007']->id,
            'leave_type_id' => $sickLeave->id,
            'start_date' => Carbon::today()->subDays(10)->toDateString(),
            'end_date' => Carbon::today()->subDays(9)->toDateString(),
            'is_half_day' => false,
            'total_days' => 2.00,
            'reason' => 'Acute flu recovery recommended by physician',
            'status' => 'approved',
            'supervisor_id' => $createdEmployees['EMP-004']->id,
            'supervisor_status' => 'approved',
            'supervisor_approved_at' => Carbon::today()->subDays(11),
            'hr_id' => 2, // HR manager user
            'hr_status' => 'approved',
            'hr_approved_at' => Carbon::today()->subDays(10),
        ]);

        // 13. Sample Payroll Batch (if payroll tables exist)
        if (Schema::hasTable('payrolls')) {
            $lastMonth = Carbon::now()->subMonth();
            $payroll = Payroll::create([
                'month' => $lastMonth->month,
                'year' => $lastMonth->year,
                'title' => 'Monthly Staff Payroll - ' . $lastMonth->format('F Y'),
                'start_date' => $lastMonth->copy()->startOfMonth()->toDateString(),
                'end_date' => $lastMonth->copy()->endOfMonth()->toDateString(),
                'payment_date' => $lastMonth->copy()->endOfMonth()->toDateString(),
                'total_gross' => 25200.00,
                'total_deductions' => 840.00,
                'total_net' => 24360.00,
                'currency' => 'USD',
                'status' => 'paid',
                'paid_at' => $lastMonth->copy()->endOfMonth()->setTime(16, 0, 0),
            ]);

            foreach ($createdEmployees as $emp) {
                $base = $emp->currentSalary?->base_salary ?? 2000.00;
                $allowance = 100.00;
                $tax = round($base * 0.05, 2);
                $net = $base + $allowance - $tax;

                $item = PayrollItem::create([
                    'payroll_id' => $payroll->id,
                    'employee_id' => $emp->id,
                    'base_salary' => $base,
                    'allowance_total' => $allowance,
                    'bonus_total' => 0.00,
                    'overtime_pay' => 0.00,
                    'deduction_total' => 0.00,
                    'tax_amount' => $tax,
                    'net_salary' => $net,
                    'currency' => 'USD',
                    'exchange_rate' => 4100.0000,
                    'status' => 'paid',
                ]);

                if (Schema::hasTable('payslips')) {
                    Payslip::create([
                        'payroll_item_id' => $item->id,
                        'payslip_number' => 'PS-' . $payroll->year . '-' . sprintf('%02d', $payroll->month) . '-' . $emp->employee_code,
                        'generated_at' => $payroll->paid_at,
                        'status' => 'sent',
                    ]);
                }
            }
        }

        // 14. Holidays
        Holiday::create(['organization_id' => $org->id, 'name' => 'Khmer New Year Day 1', 'date' => '2026-04-14', 'is_recurring' => true, 'affects_payroll' => true]);
        Holiday::create(['organization_id' => $org->id, 'name' => 'Khmer New Year Day 2', 'date' => '2026-04-15', 'is_recurring' => true, 'affects_payroll' => true]);
        Holiday::create(['organization_id' => $org->id, 'name' => 'Khmer New Year Day 3', 'date' => '2026-04-16', 'is_recurring' => true, 'affects_payroll' => true]);
        Holiday::create(['organization_id' => $org->id, 'name' => 'International Labor Day', 'date' => '2026-05-01', 'is_recurring' => true, 'affects_payroll' => true]);
        Holiday::create(['organization_id' => $org->id, 'name' => 'Pchum Ben Festival', 'date' => '2026-10-10', 'is_recurring' => false, 'affects_payroll' => true]);
        Holiday::create(['organization_id' => $org->id, 'name' => 'Independence Day', 'date' => '2026-11-09', 'is_recurring' => true, 'affects_payroll' => true]);

        // 15. Announcements (Notice Board for Hospital)
        if (Schema::hasTable('announcements')) {
            Announcement::create([
                'organization_id' => $org->id,
                'title' => 'សេចក្តីជូនដំណឹងស្តីពីកាលវិភាគបំពេញការងារ និងវេនយាមប្រចាំសប្តាហ៍',
                'content' => 'សូមជម្រាបជូនថ្នាក់ដឹកនាំ និងបុគ្គលិកសុខាភិបាលទាំងអស់នៃមន្ទីរពេទ្យមិត្តភាពកម្ពុជា-ចិនត្បូងឃ្មុំ មេត្តាជ្រាបថា កាលវិភាគវេនយាម និងវត្តមានប្រចាំខែត្រូវបានដាក់ឱ្យអនុវត្តជាផ្លូវការតាមប្រព័ន្ធ EMS។',
                'target_audience' => 'all',
                'priority' => 'high',
                'is_published' => true,
                'published_at' => Carbon::now()->subDays(2),
                'author_id' => 1,
            ]);
        }

        // 18. System Settings
        SystemSetting::set('organization_name', 'មន្ទីរពេទ្យមិត្តភាពកម្ពុជា-ចិនត្បូងឃ្មុំ', 'general', 'Organization Display Name', $org->id, 1);
        SystemSetting::set('default_currency', 'USD', 'payroll', 'Default operating currency', $org->id, 1);
        SystemSetting::set('usd_khr_exchange_rate', '4100', 'payroll', 'Official KHR to USD exchange rate', $org->id, 1);
        SystemSetting::set('grace_period_minutes', '15', 'attendance', 'Grace period before marking late arrival', $org->id, 1);
        SystemSetting::set('default_language', 'km', 'localization', 'System default interface language (Khmer)', $org->id, 1);
        SystemSetting::set('enable_qr_attendance', 'true', 'attendance', 'Enable QR code check-in on mobile', $org->id, 1);

        // 19. Extended Workforce Seeder (Hospital Medical Staff)
        $this->call(HospitalEmployeeSeeder::class);
    }
}
