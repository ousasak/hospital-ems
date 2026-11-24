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
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Role;

class HospitalEmployeeSeeder extends Seeder
{
    public function run(): void
    {
        $org = Organization::first();
        if (!$org) {
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
        } else {
            $org->update([
                'name' => 'មន្ទីរពេទ្យមិត្តភាពកម្ពុជា-ចិនត្បូងឃ្មុំ',
                'legal_name' => 'មន្ទីរពេទ្យមិត្តភាពកម្ពុជា-ចិនត្បូងឃ្មុំ (Tbong Khmum Cambodia-China Friendship Hospital)',
                'city' => 'ត្បូងឃ្មុំ',
                'country' => 'Cambodia',
            ]);
        }

        $location = null;
        if (Schema::hasTable('work_locations')) {
            $location = WorkLocation::firstOrCreate(
                ['code' => 'LOC-TBK-HQ'],
                [
                    'organization_id' => $org->id,
                    'name' => 'មន្ទីរពេទ្យមិត្តភាពកម្ពុជា-ចិនត្បូងឃ្មុំ (ទីស្នាក់ការកណ្តាល)',
                    'address' => 'ផ្លូវជាតិលេខ ៧, ភូមិនិគមលើ, ឃុំស្រឡប់, ស្រុកត្បូងឃ្មុំ',
                    'city' => 'ត្បូងឃ្មុំ',
                    'country' => 'Cambodia',
                    'timezone' => 'Asia/Phnom_Penh',
                    'is_headquarters' => true,
                    'status' => 'active',
                ]
            );
        }

        $fullTimeType = EmploymentType::firstOrCreate(
            ['code' => 'FT'],
            ['name' => 'Full-time', 'is_active' => true]
        );

        $contractType = EmploymentType::firstOrCreate(
            ['code' => 'CT'],
            ['name' => 'Contract', 'is_active' => true]
        );

        $salaryStructure = null;
        if (Schema::hasTable('salary_structures')) {
            $salaryStructure = SalaryStructure::firstOrCreate(
                ['code' => 'SAL-USD-MED'],
                [
                    'name' => 'Hospital Medical Staff Structure USD',
                    'description' => 'Clinical, nursing, technical and administrative medical compensation structure',
                    'currency' => 'USD',
                    'is_active' => true,
                ]
            );
        }

        // Departments definition
        $deptDefs = [
            'DIR' => ['name' => 'ថ្នាក់ដឹកនាំមន្ទីរពេទ្យ', 'desc' => 'Hospital Executive Directorate & Strategic Oversight'],
            'ADMIN' => ['name' => 'ផ្នែករដ្ឋបាល និងបុគ្គលិក', 'desc' => 'Administration and Personnel Department'],
            'FIN' => ['name' => 'ផ្នែកថវិកា-គណនេយ្យ', 'desc' => 'Financial, Budgeting and Accounting Department'],
            'PHYS' => ['name' => 'ផ្នែកបច្ចេកទេស', 'desc' => 'Physical & Technical Operations Department'],
            'DENT' => ['name' => 'ផ្នែកទន្តសាស្ត្រ', 'desc' => 'Dentistry and Oral Healthcare Department'],
            'EMERG' => ['name' => 'ផ្នែកសង្គ្រោះបន្ទាន់', 'desc' => 'Emergency and Urgent Care Department'],
            'ENT' => ['name' => 'ផ្នែកត្រចៀក ច្រមុះ និងបំពង់ក', 'desc' => 'Ear, Nose and Throat (ENT) Department'],
            'ENDO' => ['name' => 'ផ្នែកចក្ខុ (Endoscopy)', 'desc' => 'Endoscopy and Internal Diagnostic Unit'],
            'GENMED' => ['name' => 'ផ្នែកជំងឺទូទៅមនុស្សចាស់', 'desc' => 'General Adult Medicine Department'],
            'IMAGE' => ['name' => 'ផ្នែករូបភាពវេជ្ជសាស្ត្រ', 'desc' => 'Medical Imagery, Radiology & Sonography Department'],
            'INFECT' => ['name' => 'ផ្នែកជំងឺឆ្លង', 'desc' => 'Infectious Diseases & Epidemic Control Department'],
            'ICU' => ['name' => 'ផ្នែកប្រពោធនកម្ម/សង្គ្រោះបន្ទាន់កម្រិតធ្ងន់ (ICU)', 'desc' => 'Intensive Care Unit (ICU) and Critical Resuscitation'],
            'LAB' => ['name' => 'ផ្នែកមន្ទីរពិសោធន៍', 'desc' => 'Medical Laboratory & Diagnostic Testing Department'],
            'BLOOD' => ['name' => 'ផ្នែកធនាគារឈាម', 'desc' => 'Blood Transfusion and Blood Bank Department'],
            'OBGYN' => ['name' => 'ផ្នែកសម្ភព និងរោគស្ត្រី', 'desc' => 'Obstetrics and Gynecology Department'],
            'OPANESTH' => ['name' => 'ផ្នែកសល្យាកាត់ និងដាក់ថ្នាំសន្លប់', 'desc' => 'Operating Theaters and Anesthesiology Department'],
            'OPHTHAL' => ['name' => 'ផ្នែកចក្ខុរោគ', 'desc' => 'Ophthalmology & Vision Care Department'],
            'OPD' => ['name' => 'ផ្នែកពិគ្រោះជំងឺក្រៅ', 'desc' => 'OutPatient Department (OPD) Consultation'],
            'PED' => ['name' => 'ផ្នែកជំងឺកុមារ និងទារក', 'desc' => 'Pediatric and Neonatal Intensive Care Department'],
            'PHARM' => ['name' => 'ផ្នែកឱសថស្ថាន', 'desc' => 'Hospital Pharmacy & Medication Dispensary Department'],
            'PSYCH' => ['name' => 'ផ្នែកសុខភាពផ្លូវចិត្ត', 'desc' => 'Psychology and Mental Health Counseling Department'],
            'SURG' => ['name' => 'ផ្នែកសល្យសាស្ត្រ', 'desc' => 'General and Specialized Surgery Department'],
        ];

        $deptModels = [];
        foreach ($deptDefs as $code => $info) {
            $deptModels[$code] = Department::firstOrCreate(
                ['code' => $code],
                [
                    'organization_id' => $org->id,
                    'name' => $info['name'],
                    'description' => $info['desc'],
                    'status' => 'active',
                ]
            );
        }

        $posSalaryMap = [
            'ប្រធានមន្ទីរពេទ្យ' => ['level' => 'executive', 'min' => 2500, 'max' => 4000, 'salary' => 3500],
            'អនុប្រធានមន្ទីរពេទ្យ' => ['level' => 'executive', 'min' => 2000, 'max' => 3200, 'salary' => 2600],
            'ប្រធានអគារផ្នែកសម្ភពនិងរោគស្ត្រី' => ['level' => 'lead', 'min' => 1600, 'max' => 2600, 'salary' => 2100],
            'ប្រធានអគារជំងឺកុមារ និងទារក' => ['level' => 'lead', 'min' => 1600, 'max' => 2600, 'salary' => 2100],
            'ប្រធានផ្នែក' => ['level' => 'lead', 'min' => 1400, 'max' => 2400, 'salary' => 1800],
            'ប្រធានផ្នែកវិទ្យាសាស្ត្រ' => ['level' => 'lead', 'min' => 1400, 'max' => 2400, 'salary' => 1800],
            'ប្រធានផ្នែករោគស្ត្រី' => ['level' => 'lead', 'min' => 1400, 'max' => 2400, 'salary' => 1800],
            'ប្រធានផ្នែកជំងឺកុមារ' => ['level' => 'lead', 'min' => 1400, 'max' => 2400, 'salary' => 1800],
            'ប្រធានផ្នែកជំងឺទារក' => ['level' => 'lead', 'min' => 1400, 'max' => 2400, 'salary' => 1800],
            'ប្រធានផ្នែកវះកាត់ទូទៅ និងទ្រូង' => ['level' => 'lead', 'min' => 1500, 'max' => 2500, 'salary' => 1900],
            'ប្រធានផ្នែកវះកាត់បាក់បែកឆ្អឹង' => ['level' => 'lead', 'min' => 1500, 'max' => 2500, 'salary' => 1900],
            'អនុប្រធានផ្នែក' => ['level' => 'lead', 'min' => 1200, 'max' => 2000, 'salary' => 1500],
            'អនុប្រធានផ្នែកសម្ភព' => ['level' => 'lead', 'min' => 1200, 'max' => 2000, 'salary' => 1500],
            'អនុប្រធានផ្នែករោគស្ត្រី' => ['level' => 'lead', 'min' => 1200, 'max' => 2000, 'salary' => 1500],
            'អនុប្រធានផ្នែកជំងឺទារក' => ['level' => 'lead', 'min' => 1200, 'max' => 2000, 'salary' => 1500],
            'នាយសាល' => ['level' => 'senior', 'min' => 1000, 'max' => 1600, 'salary' => 1250],
            'នាយសាលផ្នែកជំងឺកុមារ' => ['level' => 'senior', 'min' => 1000, 'max' => 1600, 'salary' => 1250],
            'នាយសាលផ្នែកជំងឺទារក' => ['level' => 'senior', 'min' => 1000, 'max' => 1600, 'salary' => 1250],
            'នាយសាលរង' => ['level' => 'mid', 'min' => 800, 'max' => 1300, 'salary' => 1000],
            'នាយសាលរងផ្នែកជំងឺកុមារ' => ['level' => 'mid', 'min' => 800, 'max' => 1300, 'salary' => 1000],
            'គ្រូពេទ្យព្យាបាល' => ['level' => 'senior', 'min' => 1100, 'max' => 1900, 'salary' => 1400],
            'ទន្តបណ្ឌិត' => ['level' => 'senior', 'min' => 1200, 'max' => 2000, 'salary' => 1500],
            'ឱសថការី' => ['level' => 'senior', 'min' => 1000, 'max' => 1700, 'salary' => 1300],
            'ឱសថការីឧត្តម' => ['level' => 'senior', 'min' => 1200, 'max' => 1900, 'salary' => 1500],
            'ផ្នែកធនធានមនុស្សនិងបណ្តុះបណ្តាល' => ['level' => 'mid', 'min' => 750, 'max' => 1300, 'salary' => 950],
            'ផ្នែកប្រព័ន្ធព័ត៌មានវិទ្យា' => ['level' => 'mid', 'min' => 800, 'max' => 1400, 'salary' => 1050],
            'គណនេយ្យទូទាត់' => ['level' => 'mid', 'min' => 700, 'max' => 1200, 'salary' => 900],
            'គ្រប់គ្រងឃ្លាំងសម្ភារៈ' => ['level' => 'mid', 'min' => 700, 'max' => 1200, 'salary' => 900],
            'គណនេយ្យសម្ភារៈ' => ['level' => 'mid', 'min' => 700, 'max' => 1200, 'salary' => 900],
            'បេឡា' => ['level' => 'mid', 'min' => 650, 'max' => 1100, 'salary' => 850],
            'ម្ចាស់ថវិកា បោះពាក់ និងថ្លៃផ្ទះបាយ' => ['level' => 'mid', 'min' => 700, 'max' => 1200, 'salary' => 900],
            'បុគ្គលិក PMRS' => ['level' => 'entry', 'min' => 550, 'max' => 950, 'salary' => 750],
            'ជំនួយការគណនេយ្យ' => ['level' => 'entry', 'min' => 550, 'max' => 950, 'salary' => 700],
            'អ្នកបើកបរ' => ['level' => 'entry', 'min' => 450, 'max' => 750, 'salary' => 600],
            'បុគ្គលិក' => ['level' => 'entry', 'min' => 550, 'max' => 950, 'salary' => 720],
        ];

        $hospitalData = [
            ['no' => 1, 'name' => 'អេក ឃាង', 'dept_code' => 'DIR', 'pos' => 'ប្រធានមន្ទីរពេទ្យ', 'qual' => 'វេជ្ជបណ្ឌិត', 'gender' => 'male', 'role' => 'Super Admin'],
            ['no' => 2, 'name' => 'ថុន សីហា', 'dept_code' => 'DIR', 'pos' => 'អនុប្រធានមន្ទីរពេទ្យ', 'qual' => 'វេជ្ជបណ្ឌិត', 'gender' => 'male', 'role' => 'Department Manager'],
            ['no' => 3, 'name' => 'សេង បុប្ផាដែត', 'dept_code' => 'DIR', 'pos' => 'អនុប្រធានមន្ទីរពេទ្យ', 'qual' => 'ឱសថការី', 'gender' => 'female', 'role' => 'Department Manager'],
            ['no' => 4, 'name' => 'ជា សីលា', 'dept_code' => 'ADMIN', 'pos' => 'ប្រធានផ្នែក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'male', 'role' => 'Department Manager'],
            ['no' => 5, 'name' => 'ទន់ ពេជ្រ', 'dept_code' => 'ADMIN', 'pos' => 'អនុប្រធានផ្នែក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'male', 'role' => 'HR Staff'],
            ['no' => 6, 'name' => 'លៀង ច័ន្ទសុភា', 'dept_code' => 'ADMIN', 'pos' => 'ផ្នែកធនធានមនុស្សនិងបណ្តុះបណ្តាល', 'qual' => 'បរិ.គណនេយ្យ', 'gender' => 'female', 'role' => 'HR Staff'],
            ['no' => 7, 'name' => 'នួន រត្នា', 'dept_code' => 'ADMIN', 'pos' => 'ផ្នែកប្រព័ន្ធព័ត៌មានវិទ្យា', 'qual' => 'ព័ត៌មានវិទ្យា', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 8, 'name' => 'ម៉ៅ គឹមហេង', 'dept_code' => 'ADMIN', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.មន្ទីរពិសោធ', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 9, 'name' => 'ឈិន ផេងស៊ាង', 'dept_code' => 'ADMIN', 'pos' => 'អ្នកបើកបរ', 'qual' => 'បើកបរ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 10, 'name' => 'ម៉ុង លីដា', 'dept_code' => 'FIN', 'pos' => 'ប្រធានផ្នែក', 'qual' => 'បរិ.រដ្ឋបាល', 'gender' => 'female', 'role' => 'Department Manager'],
            ['no' => 11, 'name' => 'សេង សុបញ្ញា', 'dept_code' => 'FIN', 'pos' => 'គណនេយ្យទូទាត់', 'qual' => 'បរិ.គណនេយ្យ', 'gender' => 'male', 'role' => 'Accountant'],
            ['no' => 12, 'name' => 'ស៊ាង សុកន្ថាវី', 'dept_code' => 'FIN', 'pos' => 'គ្រប់គ្រងឃ្លាំងសម្ភារៈ', 'qual' => 'បរិ.គណនេយ្យ', 'gender' => 'female', 'role' => 'Accountant'],
            ['no' => 13, 'name' => 'សុខ ធានី', 'dept_code' => 'FIN', 'pos' => 'គណនេយ្យសម្ភារៈ', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'male', 'role' => 'Accountant'],
            ['no' => 14, 'name' => 'ស្រេង សុផលី', 'dept_code' => 'FIN', 'pos' => 'បេឡា', 'qual' => 'បរិ.រងមន្ទីរពិសោធ', 'gender' => 'female', 'role' => 'Accountant'],
            ['no' => 15, 'name' => 'ងួន សុភ័ក្ត្រ', 'dept_code' => 'FIN', 'pos' => 'ម្ចាស់ថវិកា បោះពាក់ និងថ្លៃផ្ទះបាយ', 'qual' => 'បរិ.ធនាគារ+បរិ.គិ', 'gender' => 'female', 'role' => 'Accountant'],
            ['no' => 16, 'name' => 'ពៅ ដាវី', 'dept_code' => 'FIN', 'pos' => 'បុគ្គលិក PMRS', 'qual' => 'បរិ.គណនេយ្យ', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 17, 'name' => 'ម៉ុង វល័ក្ខណា', 'dept_code' => 'FIN', 'pos' => 'ជំនួយការគណនេយ្យ', 'qual' => 'បរិ.គណនេយ្យ', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 18, 'name' => 'ជោគ រដ្ឋា', 'dept_code' => 'PHYS', 'pos' => 'ប្រធានផ្នែក', 'qual' => 'វេជ្ជ.ឯកទេស', 'gender' => 'male', 'role' => 'Department Manager'],
            ['no' => 19, 'name' => 'ម៉ាប់ ពិទូត', 'dept_code' => 'DENT', 'pos' => 'ប្រធានផ្នែក', 'qual' => 'ទន្តបណ្ឌិត', 'gender' => 'male', 'role' => 'Department Manager'],
            ['no' => 20, 'name' => 'ម៉េង តុលា', 'dept_code' => 'DENT', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រងទន្ត', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 21, 'name' => 'ខ្វាវ ហាក់នរ', 'dept_code' => 'EMERG', 'pos' => 'ប្រធានផ្នែក', 'qual' => 'វេជ្ជបណ្ឌិត', 'gender' => 'male', 'role' => 'Department Manager'],
            ['no' => 22, 'name' => 'កែវ គឹមសួ', 'dept_code' => 'EMERG', 'pos' => 'អនុប្រធានផ្នែក', 'qual' => 'វេជ្ជបណ្ឌិត', 'gender' => 'female', 'role' => 'Department Manager'],
            ['no' => 23, 'name' => 'ណេក សុវណ្ណារដ្ឋ', 'dept_code' => 'EMERG', 'pos' => 'អនុប្រធានផ្នែក', 'qual' => 'វេជ្ជបណ្ឌិត', 'gender' => 'male', 'role' => 'Department Manager'],
            ['no' => 24, 'name' => 'កេង វិដា', 'dept_code' => 'EMERG', 'pos' => 'នាយសាល', 'qual' => 'បរិ.គិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 25, 'name' => 'ប៉ាង លក្ខណា', 'dept_code' => 'EMERG', 'pos' => 'នាយសាលរង', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 26, 'name' => 'វ៉ាន់ ពិសិដ្ឋ', 'dept_code' => 'EMERG', 'pos' => 'នាយសាលរង', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 27, 'name' => 'ឡុង ម៉ាកែន', 'dept_code' => 'EMERG', 'pos' => 'គ្រូពេទ្យព្យាបាល', 'qual' => 'វេជ្ជបណ្ឌិត', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 28, 'name' => 'រែន សុភ័ក្ត្រា', 'dept_code' => 'EMERG', 'pos' => 'គ្រូពេទ្យព្យាបាល', 'qual' => 'វេជ្ជបណ្ឌិត', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 29, 'name' => 'សាកើត សេងហុង', 'dept_code' => 'EMERG', 'pos' => 'គ្រូពេទ្យព្យាបាល', 'qual' => 'វេជ្ជបណ្ឌិត', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 30, 'name' => 'ឈឿន សំភ័ស', 'dept_code' => 'EMERG', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 31, 'name' => 'វ៉ៃ វ៉ាត់តានា', 'dept_code' => 'EMERG', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 32, 'name' => 'ដេន វ៉ាន់ដេត', 'dept_code' => 'EMERG', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 33, 'name' => 'ចេន ចាន់ថា', 'dept_code' => 'EMERG', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 34, 'name' => 'លឹម សូរ៍', 'dept_code' => 'EMERG', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រងឆប', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 35, 'name' => 'ហាក់ ឈិនឡុង', 'dept_code' => 'EMERG', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 36, 'name' => 'ខែម សង្ហា', 'dept_code' => 'EMERG', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 37, 'name' => 'អួន សាលប់ស្រីយ៍', 'dept_code' => 'EMERG', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.ឆប', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 38, 'name' => 'សិន ច័ន្ទបូរី', 'dept_code' => 'EMERG', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 39, 'name' => 'ខុល សុក្រហិរញ្ញារៀន', 'dept_code' => 'EMERG', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 40, 'name' => 'ជែន ស្រីតូច', 'dept_code' => 'EMERG', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 41, 'name' => 'អ៊ុំ ឈុនអ៊ាន', 'dept_code' => 'EMERG', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រងឆប', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 42, 'name' => 'ឈៀន សៅ', 'dept_code' => 'EMERG', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រងឆប', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 43, 'name' => 'នេន រតនា', 'dept_code' => 'EMERG', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រងឆប', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 44, 'name' => 'ម៉ៅ ស្រីកាត់', 'dept_code' => 'EMERG', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 45, 'name' => 'ចាប គន្ធី', 'dept_code' => 'EMERG', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រងឆប', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 46, 'name' => 'យស សំណាង', 'dept_code' => 'ENT', 'pos' => 'ប្រធានផ្នែក', 'qual' => 'វេជ្ជ.ឯកទេស', 'gender' => 'male', 'role' => 'Department Manager'],
            ['no' => 47, 'name' => 'លី សារ៉ា', 'dept_code' => 'ENT', 'pos' => 'នាយសាល', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 48, 'name' => 'ប៊ិន សុណាវិ', 'dept_code' => 'ENT', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រងឆប', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 49, 'name' => 'អេង រិទ្ធី', 'dept_code' => 'ENDO', 'pos' => 'ប្រធានផ្នែក', 'qual' => 'វេជ្ជបណ្ឌិត', 'gender' => 'male', 'role' => 'Department Manager'],
            ['no' => 50, 'name' => 'ហ៊ីង សុខម៉េង', 'dept_code' => 'GENMED', 'pos' => 'ប្រធានផ្នែក', 'qual' => 'វេជ្ជបណ្ឌិត', 'gender' => 'male', 'role' => 'Department Manager'],
            ['no' => 51, 'name' => 'យឹម សុភ័ក្ត្រ', 'dept_code' => 'GENMED', 'pos' => 'អនុប្រធានផ្នែក', 'qual' => 'វេជ្ជបណ្ឌិត', 'gender' => 'male', 'role' => 'Department Manager'],
            ['no' => 52, 'name' => 'សៀ សុធា', 'dept_code' => 'GENMED', 'pos' => 'អនុប្រធានផ្នែក', 'qual' => 'វេជ្ជបណ្ឌិត', 'gender' => 'male', 'role' => 'Department Manager'],
            ['no' => 53, 'name' => 'ប្រឹង ផានិត', 'dept_code' => 'GENMED', 'pos' => 'នាយសាល', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 54, 'name' => 'ហេង មួយគា', 'dept_code' => 'GENMED', 'pos' => 'នាយសាលរង', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 55, 'name' => 'ភន សុភ័ក្ត្រ', 'dept_code' => 'GENMED', 'pos' => 'នាយសាលរង', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 56, 'name' => 'សុខ វត្ថា', 'dept_code' => 'GENMED', 'pos' => 'គ្រូពេទ្យព្យាបាល', 'qual' => 'វេជ្ជបណ្ឌិត', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 57, 'name' => 'ស្រួយ សុភក្រា', 'dept_code' => 'GENMED', 'pos' => 'គ្រូពេទ្យព្យាបាល', 'qual' => 'វេជ្ជបណ្ឌិត', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 58, 'name' => 'ហង ភែតពេជ្ររស្មី', 'dept_code' => 'GENMED', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.ឆប', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 59, 'name' => 'ខុន តារា', 'dept_code' => 'GENMED', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 60, 'name' => 'ជើម បញ្ញារិទ្ធ', 'dept_code' => 'GENMED', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 61, 'name' => 'អ៊ុង ចាន់ថា', 'dept_code' => 'GENMED', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 62, 'name' => 'ខេន សុខី', 'dept_code' => 'GENMED', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 63, 'name' => 'ពៅ ពិសិដ្ឋ', 'dept_code' => 'GENMED', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 64, 'name' => 'ពក ហាក់', 'dept_code' => 'GENMED', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 65, 'name' => 'ខឹម ស្រីនាង', 'dept_code' => 'GENMED', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 66, 'name' => 'អ៊ូច សំអាន', 'dept_code' => 'GENMED', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 67, 'name' => 'ហ៊ាន សុខហិត', 'dept_code' => 'GENMED', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 68, 'name' => 'ណាំ ជូ', 'dept_code' => 'IMAGE', 'pos' => 'ប្រធានផ្នែកវិទ្យាសាស្ត្រ', 'qual' => 'វេជ្ជបណ្ឌិត', 'gender' => 'male', 'role' => 'Department Manager'],
            ['no' => 69, 'name' => 'ជូ រ៉ាវី', 'dept_code' => 'IMAGE', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 70, 'name' => 'ហាន ចន្ធូ', 'dept_code' => 'IMAGE', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.គណនេយ្យ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 71, 'name' => 'អ៊ិន សុផា', 'dept_code' => 'IMAGE', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រងទន្ត', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 72, 'name' => 'ម៉ន សេងហាក់', 'dept_code' => 'IMAGE', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រងទន្ត', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 73, 'name' => 'ថុន ណៃយ៊ាង', 'dept_code' => 'IMAGE', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 74, 'name' => 'ងួន ធីណាង', 'dept_code' => 'IMAGE', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 75, 'name' => 'យូ គឹមស្រ៊ុន', 'dept_code' => 'INFECT', 'pos' => 'ប្រធានផ្នែក', 'qual' => 'វេជ្ជបណ្ឌិត', 'gender' => 'male', 'role' => 'Department Manager'],
            ['no' => 76, 'name' => 'មួន តុលា', 'dept_code' => 'INFECT', 'pos' => 'នាយសាល', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 77, 'name' => 'ពាន ប្រុស', 'dept_code' => 'INFECT', 'pos' => 'នាយសាលរង', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 78, 'name' => 'សួង សេរីវឌ្ឍនា', 'dept_code' => 'INFECT', 'pos' => 'គ្រូពេទ្យព្យាបាល', 'qual' => 'វេជ្ជបណ្ឌិត', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 79, 'name' => 'ដាណា សុដានី', 'dept_code' => 'INFECT', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 80, 'name' => 'កយ បុប្ផា', 'dept_code' => 'INFECT', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 81, 'name' => 'ទូក វ៉ាន់ដា', 'dept_code' => 'INFECT', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 82, 'name' => 'សំណាង រត្ននា', 'dept_code' => 'INFECT', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 83, 'name' => 'គង់ ហ្ស៊ឺរី', 'dept_code' => 'ICU', 'pos' => 'ប្រធានផ្នែក', 'qual' => 'វេជ្ជបណ្ឌិត', 'gender' => 'male', 'role' => 'Department Manager'],
            ['no' => 84, 'name' => 'យឹម សិរីរាជវុទ្ធ', 'dept_code' => 'ICU', 'pos' => 'អនុប្រធានផ្នែក', 'qual' => 'វេជ្ជបណ្ឌិត', 'gender' => 'male', 'role' => 'Department Manager'],
            ['no' => 85, 'name' => 'ជិន ធឿន', 'dept_code' => 'ICU', 'pos' => 'នាយសាល', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 86, 'name' => 'ត្រយ ម៉េងហ័រ', 'dept_code' => 'ICU', 'pos' => 'នាយសាលរង', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 87, 'name' => 'ច័ន្ទ លក្ខិណា', 'dept_code' => 'ICU', 'pos' => 'នាយសាលរង', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 88, 'name' => 'ខុំ សុខហៀង', 'dept_code' => 'ICU', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 89, 'name' => 'ថា ស្ម័គ្រ', 'dept_code' => 'ICU', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 90, 'name' => 'ស្រី សីហា', 'dept_code' => 'ICU', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 91, 'name' => 'ហ៊ិន សុដាលីន', 'dept_code' => 'ICU', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រងឆប', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 92, 'name' => 'ឈី ថេន', 'dept_code' => 'ICU', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រងឆប', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 93, 'name' => 'ហេង ស្រីឡែន', 'dept_code' => 'ICU', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រងឆប', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 94, 'name' => 'ហេង ដាលិណែត', 'dept_code' => 'ICU', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 95, 'name' => 'ចាន់ ស្រីនាង', 'dept_code' => 'ICU', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.គិ', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 96, 'name' => 'ដា លីហ្សា', 'dept_code' => 'ICU', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 97, 'name' => 'គ្លៀន ម៉ាលៃ', 'dept_code' => 'ICU', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 98, 'name' => 'ខៀវ លាងហ័ង', 'dept_code' => 'ICU', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រងឆប', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 99, 'name' => 'ម៉ុក រ៉ាមិត', 'dept_code' => 'LAB', 'pos' => 'អនុប្រធានផ្នែក', 'qual' => 'បរិ.រងមន្ទីរពិ', 'gender' => 'male', 'role' => 'Department Manager'],
            ['no' => 100, 'name' => 'ប៉ាត គឹមហៀក', 'dept_code' => 'LAB', 'pos' => 'អនុប្រធានផ្នែក', 'qual' => 'បរិ.រងមន្ទីរពិ', 'gender' => 'male', 'role' => 'Department Manager'],
            ['no' => 101, 'name' => 'ចាន់ សុជាតា', 'dept_code' => 'LAB', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រងមន្ទីរពិ', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 102, 'name' => 'សម្បត្តិ បូរី', 'dept_code' => 'LAB', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រងមន្ទីរពិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 103, 'name' => 'ជៀន ចាវី', 'dept_code' => 'LAB', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រងមន្ទីរពិ', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 104, 'name' => 'គង់ ភិរុណ', 'dept_code' => 'LAB', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រងមន្ទីរពិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 105, 'name' => 'ហោ ចន្ធី', 'dept_code' => 'LAB', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រងមន្ទីរពិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 106, 'name' => 'ឡូន ថៃយ៉ា', 'dept_code' => 'LAB', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រងមន្ទីរពិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 107, 'name' => 'ហាត ផាត់', 'dept_code' => 'LAB', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រងមន្ទីរពិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 108, 'name' => 'សាំ ឡេន', 'dept_code' => 'LAB', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រងមន្ទីរពិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 109, 'name' => 'ឈាន់ ថៃណា', 'dept_code' => 'LAB', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រងមន្ទីរពិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 110, 'name' => 'តា សុផាន', 'dept_code' => 'LAB', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.មន្ទីរពិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 111, 'name' => 'ផាន់ រដ្ឋា', 'dept_code' => 'LAB', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រងមន្ទីរពិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 112, 'name' => 'អ៊ឹង កេតប៊ុង', 'dept_code' => 'BLOOD', 'pos' => 'ប្រធានផ្នែក', 'qual' => 'បរិ.រងមន្ទីរពិ', 'gender' => 'male', 'role' => 'Department Manager'],
            ['no' => 113, 'name' => 'ប៉ុង ចតុបុណ្យកា', 'dept_code' => 'BLOOD', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រងមន្ទីរពិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 114, 'name' => 'ប៊ុន ដាម៉ិត', 'dept_code' => 'BLOOD', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រងមន្ទីរពិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 115, 'name' => 'ជុំ វណ្ណា', 'dept_code' => 'BLOOD', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រងមន្ទីរពិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 116, 'name' => 'ច័ន្ទប៊ុលឡេង តារា', 'dept_code' => 'OBGYN', 'pos' => 'ប្រធានអគារផ្នែកសម្ភពនិងរោគស្ត្រី', 'qual' => 'វេជ្ជ.ឯកទេស', 'gender' => 'male', 'role' => 'Department Manager'],
            ['no' => 117, 'name' => 'ចំណាន ដាលីណេត', 'dept_code' => 'OBGYN', 'pos' => 'ប្រធានផ្នែករោគស្ត្រី', 'qual' => 'វេជ្ជបណ្ឌិត', 'gender' => 'male', 'role' => 'Department Manager'],
            ['no' => 118, 'name' => 'ព្រំ សេងចរិយា', 'dept_code' => 'OBGYN', 'pos' => 'អនុប្រធានផ្នែកសម្ភព', 'qual' => 'វេជ្ជបណ្ឌិត', 'gender' => 'female', 'role' => 'Department Manager'],
            ['no' => 119, 'name' => 'គឹម រតនា', 'dept_code' => 'OBGYN', 'pos' => 'អនុប្រធានផ្នែករោគស្ត្រី', 'qual' => 'វេជ្ជបណ្ឌិត', 'gender' => 'female', 'role' => 'Department Manager'],
            ['no' => 120, 'name' => 'ប៉ូច សេងហុង', 'dept_code' => 'OBGYN', 'pos' => 'នាយសាល', 'qual' => 'បរិ.រងឆប', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 146, 'name' => 'សោមគិត គឹមហៀក', 'dept_code' => 'OBGYN', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រងឆប', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 147, 'name' => 'ជា គឹមហួង', 'dept_code' => 'OBGYN', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រងឆប', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 148, 'name' => 'គឹម ពៅពិសី', 'dept_code' => 'OBGYN', 'pos' => 'បុគ្គលិក', 'qual' => 'ឆបបឋម', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 149, 'name' => 'គុច សុជាតិ', 'dept_code' => 'OBGYN', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រងឆប', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 150, 'name' => 'ឈាន បូឌី', 'dept_code' => 'OBGYN', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.ឆប', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 151, 'name' => 'ចេង សុផលី', 'dept_code' => 'OBGYN', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រងឆប', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 152, 'name' => 'ធឿន សុភ័ក្តិ', 'dept_code' => 'OBGYN', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រងឆប', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 153, 'name' => 'ឈិត រីតា', 'dept_code' => 'OBGYN', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រងឆប', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 154, 'name' => 'ហាក់ ឈុនហេង', 'dept_code' => 'OBGYN', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រងឆប', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 155, 'name' => 'ហ៊ីប ស៊ាងហេង', 'dept_code' => 'OBGYN', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រងឆប', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 156, 'name' => 'លាង ស្រីល័ក្ខ', 'dept_code' => 'OBGYN', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រងគិ-ឆប', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 157, 'name' => 'ហាន ម៉េងហុង', 'dept_code' => 'OPANESTH', 'pos' => 'ប្រធានផ្នែក', 'qual' => 'វេជ្ជបណ្ឌិត', 'gender' => 'male', 'role' => 'Department Manager'],
            ['no' => 158, 'name' => 'ហ៊ិត សេងហាប់', 'dept_code' => 'OPANESTH', 'pos' => 'នាយសាល', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 159, 'name' => 'ទាំង សោភាវន់', 'dept_code' => 'OPANESTH', 'pos' => 'នាយសាលរង', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 160, 'name' => 'ប៉ូច ជូនហ៊ី', 'dept_code' => 'OPANESTH', 'pos' => 'នាយសាលរង', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 161, 'name' => 'សុត វ៉ោហៀង', 'dept_code' => 'OPANESTH', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.គិ', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 162, 'name' => 'អ៊ូ វ៉ះប៉ោឃុក', 'dept_code' => 'OPANESTH', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 163, 'name' => 'នួន ណាក់', 'dept_code' => 'OPANESTH', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 164, 'name' => 'ហែម រស្មី', 'dept_code' => 'OPANESTH', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.គិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 165, 'name' => 'សាយ សុខនីន', 'dept_code' => 'OPANESTH', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រងឆប', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 166, 'name' => 'ថៃ កុសល្យ', 'dept_code' => 'OPANESTH', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 167, 'name' => 'ខន ពិសិដ្ឋ', 'dept_code' => 'OPANESTH', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 168, 'name' => 'ប្រូញ ខែមរា', 'dept_code' => 'OPANESTH', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 169, 'name' => 'ហ៊ី សុខភីន', 'dept_code' => 'OPANESTH', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រងឆប', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 170, 'name' => 'ផាត់ ញ៉េន', 'dept_code' => 'OPANESTH', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.គិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 171, 'name' => 'អន រស្មី', 'dept_code' => 'OPANESTH', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.ឆប', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 172, 'name' => 'វ៉ៃ បុត្រា', 'dept_code' => 'OPANESTH', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 173, 'name' => 'គង់ វាសនា', 'dept_code' => 'OPANESTH', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 174, 'name' => 'ព្រុស លីនដា', 'dept_code' => 'OPANESTH', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រងឆប', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 175, 'name' => 'ស៊ុម ច័ន្ទត្រា', 'dept_code' => 'OPHTHAL', 'pos' => 'ប្រធានផ្នែក', 'qual' => 'វេជ្ជបណ្ឌិត', 'gender' => 'male', 'role' => 'Department Manager'],
            ['no' => 176, 'name' => 'ប៊ុក រស្មី', 'dept_code' => 'OPHTHAL', 'pos' => 'នាយសាល', 'qual' => 'បរិ.ឆប', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 177, 'name' => 'សៅ សុជាតិ', 'dept_code' => 'OPHTHAL', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 178, 'name' => 'ប្រេង វិច្ឆី', 'dept_code' => 'OPHTHAL', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 179, 'name' => 'ខូវ ហ្លោកហៀង', 'dept_code' => 'OPD', 'pos' => 'ប្រធានផ្នែក', 'qual' => 'វេជ្ជបណ្ឌិត', 'gender' => 'female', 'role' => 'Department Manager'],
            ['no' => 180, 'name' => 'ចេង យូអ៊', 'dept_code' => 'OPD', 'pos' => 'អនុប្រធានផ្នែក', 'qual' => 'វេជ្ជបណ្ឌិត', 'gender' => 'female', 'role' => 'Department Manager'],
            ['no' => 181, 'name' => 'នឿន សុខអេង', 'dept_code' => 'OPD', 'pos' => 'នាយសាល', 'qual' => 'បរិ.គិ', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 182, 'name' => 'ចោម សំណាង', 'dept_code' => 'OPD', 'pos' => 'នាយសាលរង', 'qual' => 'បរិ.គិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 183, 'name' => 'សេង សីហា', 'dept_code' => 'OPD', 'pos' => 'នាយសាលរង', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 184, 'name' => 'ខន ម៉ូលីកា', 'dept_code' => 'OPD', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រងឆប', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 185, 'name' => 'ស៊ិន មករា', 'dept_code' => 'OPD', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 186, 'name' => 'សោម ស៊ាងឡេង', 'dept_code' => 'PED', 'pos' => 'ប្រធានអគារជំងឺកុមារ និងទារក', 'qual' => 'វេជ្ជបណ្ឌិត', 'gender' => 'male', 'role' => 'Department Manager'],
            ['no' => 187, 'name' => 'គុយ អ៊ុយ', 'dept_code' => 'PED', 'pos' => 'ប្រធានផ្នែកជំងឺកុមារ', 'qual' => 'វេជ្ជបណ្ឌិត', 'gender' => 'male', 'role' => 'Department Manager'],
            ['no' => 188, 'name' => 'សាំង រដ្ឋា', 'dept_code' => 'PED', 'pos' => 'ប្រធានផ្នែកជំងឺទារក', 'qual' => 'វេជ្ជ.ឯកទេស', 'gender' => 'male', 'role' => 'Department Manager'],
            ['no' => 189, 'name' => 'ច័ន្ទប៊ុលឡេង សុខាលី', 'dept_code' => 'PED', 'pos' => 'អនុប្រធានផ្នែកជំងឺទារក', 'qual' => 'វេជ្ជបណ្ឌិត', 'gender' => 'female', 'role' => 'Department Manager'],
            ['no' => 190, 'name' => 'សួរ សុខធី', 'dept_code' => 'PED', 'pos' => 'នាយសាលផ្នែកជំងឺកុមារ', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 191, 'name' => 'ចេង សុមាលីន', 'dept_code' => 'PED', 'pos' => 'នាយសាលផ្នែកជំងឺទារក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 192, 'name' => 'គឹម ម៉ាក់ដែន', 'dept_code' => 'PED', 'pos' => 'នាយសាលរងផ្នែកជំងឺកុមារ', 'qual' => 'បរិ.រងឆប', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 193, 'name' => 'វ៉ាន់ តារា', 'dept_code' => 'PED', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 194, 'name' => 'តាង ស៊ីម', 'dept_code' => 'PED', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 195, 'name' => 'លី ដាវី', 'dept_code' => 'PED', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 196, 'name' => 'យន់ សាយ្យារ៉ាដេត', 'dept_code' => 'PED', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រងឆប', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 197, 'name' => 'អ៊ិន ទ្រាន់ដា', 'dept_code' => 'PED', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រងឆប', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 198, 'name' => 'ពុត សូណា', 'dept_code' => 'PED', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 199, 'name' => 'មី សំអៀន', 'dept_code' => 'PED', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 200, 'name' => 'ជុន ណៃស្រស់', 'dept_code' => 'PED', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 201, 'name' => 'រ៉ុង សុខលាង', 'dept_code' => 'PED', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 202, 'name' => 'អេង សុវណ្ណមាលា', 'dept_code' => 'PED', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 203, 'name' => 'អាត់ សុខាត', 'dept_code' => 'PED', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រងឆប', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 204, 'name' => 'កឹម មួយសេង', 'dept_code' => 'PHARM', 'pos' => 'ប្រធានផ្នែក', 'qual' => 'ឱសថការី', 'gender' => 'female', 'role' => 'Department Manager'],
            ['no' => 205, 'name' => 'ឈិន សុម៉ាល្យា', 'dept_code' => 'PHARM', 'pos' => 'អនុប្រធានផ្នែក', 'qual' => 'ឱសថការីឧត្តម', 'gender' => 'female', 'role' => 'Department Manager'],
            ['no' => 206, 'name' => 'គង់ ស្រីមុំ', 'dept_code' => 'PHARM', 'pos' => 'បុគ្គលិក', 'qual' => 'ឱសថការី', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 207, 'name' => 'ជុន រតនា', 'dept_code' => 'PHARM', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.គណនេយ្យ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 208, 'name' => 'អូន ឡេមវិចិត្រ', 'dept_code' => 'PHARM', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.គណនេយ្យ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 209, 'name' => 'វ៉ាន់ ភក្តី', 'dept_code' => 'PHARM', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រងទន្ត', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 210, 'name' => 'ប៉េង លីណា', 'dept_code' => 'PHARM', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រងទន្ត', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 211, 'name' => 'សំ នីដេត', 'dept_code' => 'PHARM', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.គណនេយ្យ', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 212, 'name' => 'នួន កក្តា', 'dept_code' => 'PSYCH', 'pos' => 'ប្រធានផ្នែក', 'qual' => 'វេជ្ជបណ្ឌិត', 'gender' => 'male', 'role' => 'Department Manager'],
            ['no' => 213, 'name' => 'ទុយ ម៉េងគី', 'dept_code' => 'PSYCH', 'pos' => 'នាយសាល', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 214, 'name' => 'ខេង គន្ធា', 'dept_code' => 'PSYCH', 'pos' => 'នាយសាលរង', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 215, 'name' => 'សេង សោភ័ណ្ឌ', 'dept_code' => 'PSYCH', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 216, 'name' => 'អ៊ុំ រដ្ឋា', 'dept_code' => 'SURG', 'pos' => 'ប្រធានផ្នែក', 'qual' => 'វេជ្ជ.ឯកទេស', 'gender' => 'male', 'role' => 'Department Manager'],
            ['no' => 217, 'name' => 'ស៊ុន ថៃ', 'dept_code' => 'SURG', 'pos' => 'ប្រធានផ្នែកវះកាត់ទូទៅ និងទ្រូង', 'qual' => 'វេជ្ជ.ឯកទេស', 'gender' => 'male', 'role' => 'Department Manager'],
            ['no' => 218, 'name' => 'ឈិន ទិត្យ', 'dept_code' => 'SURG', 'pos' => 'ប្រធានផ្នែកវះកាត់បាក់បែកឆ្អឹង', 'qual' => 'វេជ្ជ.ឯកទេស', 'gender' => 'male', 'role' => 'Department Manager'],
            ['no' => 219, 'name' => 'អាន គឹមថៃ', 'dept_code' => 'SURG', 'pos' => 'នាយសាល', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 220, 'name' => 'យេន នុន', 'dept_code' => 'SURG', 'pos' => 'នាយសាលរង', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 221, 'name' => 'ជឺ ស្រីមុំ', 'dept_code' => 'SURG', 'pos' => 'នាយសាលរង', 'qual' => 'បរិ.ឆប', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 222, 'name' => 'មូសា មូស្គីម', 'dept_code' => 'SURG', 'pos' => 'គ្រូពេទ្យព្យាបាល', 'qual' => 'វេជ្ជបណ្ឌិត', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 223, 'name' => 'ម៉ា ប៉ោឡេង', 'dept_code' => 'SURG', 'pos' => 'គ្រូពេទ្យព្យាបាល', 'qual' => 'វេជ្ជបណ្ឌិត', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 224, 'name' => 'ហៀង សេងត័ង', 'dept_code' => 'SURG', 'pos' => 'គ្រូពេទ្យព្យាបាល', 'qual' => 'វេជ្ជបណ្ឌិត', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 225, 'name' => 'សែម ស៊ីថា', 'dept_code' => 'SURG', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 226, 'name' => 'ភិន កុសល', 'dept_code' => 'SURG', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 227, 'name' => 'អូន សុគន្ធាវី', 'dept_code' => 'SURG', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 228, 'name' => 'ផាត រដ្ឋា', 'dept_code' => 'SURG', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 229, 'name' => 'ឡាយ ស្រីនាង', 'dept_code' => 'SURG', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 230, 'name' => 'ខែម សុភារ័ក្ស', 'dept_code' => 'SURG', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 231, 'name' => 'យ៉េន សុខភា', 'dept_code' => 'SURG', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រងឆប', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 232, 'name' => 'មុច ដានីម', 'dept_code' => 'SURG', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 233, 'name' => 'ឆាយ ស្រីល័ក្ខ', 'dept_code' => 'SURG', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 234, 'name' => 'ជុំ បូរ៉ា', 'dept_code' => 'SURG', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 235, 'name' => 'សុខ ណេន', 'dept_code' => 'SURG', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រងឆប', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 236, 'name' => 'ស្រុង ចាន់ធី', 'dept_code' => 'SURG', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'female', 'role' => 'Employee'],
            ['no' => 237, 'name' => 'សេង សៀកឡេង', 'dept_code' => 'SURG', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'male', 'role' => 'Employee'],
            ['no' => 238, 'name' => 'លាវ ម៉ាលី', 'dept_code' => 'SURG', 'pos' => 'បុគ្គលិក', 'qual' => 'បរិ.រដ្ឋគិ', 'gender' => 'female', 'role' => 'Employee'],
        ];

        $deptHeadMap = [];

        foreach ($hospitalData as $idx => $item) {
            $deptCode = $item['dept_code'];
            $dept = $deptModels[$deptCode];
            $posTitle = $item['pos'];
            $no = $item['no'];

            $posConfig = $posSalaryMap[$posTitle] ?? ['level' => 'mid', 'min' => 600, 'max' => 1100, 'salary' => 800];

            $posCode = 'POS-' . $deptCode . '-' . strtoupper(substr(md5($posTitle), 0, 5));
            $pos = Position::firstOrCreate(
                ['code' => $posCode],
                [
                    'department_id' => $dept->id,
                    'title' => $posTitle,
                    'description' => "{$posTitle} នៃ {$dept->name}",
                    'level' => $posConfig['level'],
                    'min_salary' => $posConfig['min'],
                    'max_salary' => $posConfig['max'],
                    'status' => 'active',
                ]
            );

            $parts = explode(' ', $item['name'], 2);
            $firstName = $parts[0];
            $lastName = $parts[1] ?? 'Staff';
            $empCode = sprintf('TKH-%04d', $no);
            $email = sprintf('staff%03d@tbongkhmum-hospital.gov.kh', $no);

            $year = 2020 + ($no % 5);
            $month = str_pad(($no % 12) + 1, 2, '0', STR_PAD_LEFT);
            $day = str_pad(($no % 26) + 1, 2, '0', STR_PAD_LEFT);
            $joinDate = "{$year}-{$month}-{$day}";

            $dobYear = 1970 + ($no % 28);
            $dobMonth = str_pad((($no * 3) % 12) + 1, 2, '0', STR_PAD_LEFT);
            $dobDay = str_pad((($no * 7) % 27) + 1, 2, '0', STR_PAD_LEFT);
            $dob = "{$dobYear}-{$dobMonth}-{$dobDay}";

            $phone = sprintf('+855 %02d %03d %03d', (12 + ($no % 70)), (100 + ($no % 890)), (200 + ($no % 790)));
            $personalEmail = sprintf('staff%03d.personal@gmail.com', $no);

            $employee = Employee::where('employee_code', $empCode)->first();
            if (!$employee) {
                $user = User::firstOrCreate(
                    ['email' => $email],
                    [
                        'name' => $item['name'],
                        'password' => Hash::make('1234567'),
                        'email_verified_at' => now(),
                    ]
                );

                $userRole = $item['role'];
                if (Role::where('name', $userRole)->exists()) {
                    $user->syncRoles([$userRole]);
                } else {
                    $user->syncRoles(['Employee']);
                }

                $employee = Employee::create([
                    'user_id' => $user->id,
                    'employee_code' => $empCode,
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'gender' => $item['gender'],
                    'date_of_birth' => $dob,
                    'marital_status' => ($no % 3 === 0) ? 'single' : 'married',
                    'nationality' => 'Cambodian',
                    'national_id' => sprintf('030%06d', 100000 + $no),
                    'email' => $email,
                    'phone' => $phone,
                    'personal_email' => $personalEmail,
                    'join_date' => $joinDate,
                    'probation_end_date' => Carbon::parse($joinDate)->addMonths(3)->toDateString(),
                    'contract_end_date' => Carbon::parse($joinDate)->addYears(3)->toDateString(),
                    'employment_status' => 'active',
                    'address' => 'ភូមិនិគមលើ, ឃុំស្រឡប់, ស្រុកត្បូងឃ្មុំ, ខេត្តត្បូងឃ្មុំ',
                    'city' => 'ត្បូងឃ្មុំ',
                    'bank_name' => 'ABA Bank',
                    'bank_account_name' => $item['name'],
                    'bank_account_number' => sprintf('00%06d%03d', 123456 + $no, 888),
                    'qr_code_token' => bin2hex(random_bytes(16)),
                ]);

                $assignmentData = [
                    'employee_id' => $employee->id,
                    'department_id' => $dept->id,
                    'position_id' => $pos->id,
                    'supervisor_id' => null,
                    'employment_type_id' => ($no % 7 === 0) ? $contractType->id : $fullTimeType->id,
                    'start_date' => $joinDate,
                    'end_date' => null,
                    'is_primary' => true,
                    'status' => 'active',
                ];
                if (Schema::hasColumn('employee_assignments', 'work_location_id')) {
                    $assignmentData['work_location_id'] = $location?->id;
                }
                EmployeeAssignment::create($assignmentData);

                if ($salaryStructure && Schema::hasTable('employee_salaries')) {
                    EmployeeSalary::create([
                        'employee_id' => $employee->id,
                        'salary_structure_id' => $salaryStructure->id,
                        'base_salary' => $posConfig['salary'],
                        'currency' => 'USD',
                        'payment_frequency' => 'monthly',
                        'effective_date' => $joinDate,
                        'status' => 'active',
                    ]);
                }

                if (str_contains($posTitle, 'ប្រធានផ្នែក') || str_contains($posTitle, 'ប្រធានមន្ទីរពេទ្យ') || str_contains($posTitle, 'ប្រធានអគារ')) {
                    if (!isset($deptHeadMap[$dept->id])) {
                        $deptHeadMap[$dept->id] = $employee->id;
                    }
                }
            }
        }

        // Set department managers
        foreach ($deptHeadMap as $deptId => $empId) {
            Department::where('id', $deptId)->update(['manager_id' => $empId]);
        }
    }
}
