<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 6. Employees master table
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('employee_code', 50)->unique();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('gender', 20)->default('male'); // male, female, other
            $table->date('date_of_birth')->nullable();
            $table->string('marital_status', 30)->nullable(); // single, married, divorced, widowed
            $table->string('nationality')->default('Cambodian');
            $table->string('national_id', 50)->nullable();
            $table->string('passport_number', 50)->nullable();
            $table->string('email')->unique();
            $table->string('phone', 50)->nullable();
            $table->string('personal_email')->nullable();
            $table->string('avatar_url')->nullable();
            $table->date('join_date');
            $table->date('probation_end_date')->nullable();
            $table->date('contract_end_date')->nullable();
            $table->string('employment_status', 30)->default('active'); // active, probation, suspended, terminated, resigned
            $table->text('address')->nullable();
            $table->string('city')->nullable();
            $table->string('bank_name')->nullable();
            $table->string('bank_account_name')->nullable();
            $table->string('bank_account_number')->nullable();
            $table->string('qr_code_token')->nullable()->unique();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['first_name', 'last_name']);
            $table->index('employment_status');
            $table->index('join_date');
        });

        // Add foreign key constraint for department manager
        Schema::table('departments', function (Blueprint $table) {
            $table->foreign('manager_id')->references('id')->on('employees')->nullOnDelete();
        });

        // 7. Employee Assignments (Module 04: Source of Truth for Organizational Placement & History)
        Schema::create('employee_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->foreignId('department_id')->constrained('departments')->cascadeOnDelete();
            $table->foreignId('position_id')->constrained('positions')->cascadeOnDelete();
            $table->foreignId('work_location_id')->nullable()->constrained('work_locations')->nullOnDelete();
            $table->foreignId('supervisor_id')->nullable()->constrained('employees')->nullOnDelete();
            $table->foreignId('employment_type_id')->nullable()->constrained('employment_types')->nullOnDelete();
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->boolean('is_primary')->default(true);
            $table->string('status')->default('active'); // active, pending, ended, cancelled
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['employee_id', 'is_primary', 'status']);
            $table->index(['department_id', 'status']);
            $table->index(['position_id', 'status']);
            $table->index(['start_date', 'end_date']);
        });

        // 8. Employee Contacts
        Schema::create('employee_contacts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->string('contact_type'); // telegram, linkedin, alternate_phone, etc.
            $table->string('value');
            $table->boolean('is_primary')->default(false);
            $table->timestamps();
        });

        // 9. Employee Emergency Contacts
        Schema::create('employee_emergency_contacts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->string('name');
            $table->string('relationship', 50);
            $table->string('phone', 50);
            $table->string('secondary_phone', 50)->nullable();
            $table->text('address')->nullable();
            $table->boolean('is_primary')->default(false);
            $table->timestamps();
        });

        // 10. Employee Education History
        Schema::create('employee_educations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->string('degree_level'); // High School, Bachelor, Master, PhD, Certificate
            $table->string('institution_name');
            $table->string('field_of_study');
            $table->integer('start_year')->nullable();
            $table->integer('end_year')->nullable();
            $table->string('grade_or_gpa')->nullable();
            $table->timestamps();
        });

        // 11. Employee Work Experience History
        Schema::create('employee_experiences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->string('company_name');
            $table->string('job_title');
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->text('responsibilities')->nullable();
            $table->text('reason_for_leaving')->nullable();
            $table->timestamps();
        });

        // 12. Employee Documents
        Schema::create('employee_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->string('category', 50); // contract, id_card, degree, resume, other
            $table->string('title');
            $table->string('file_path');
            $table->unsignedBigInteger('file_size')->default(0); // in bytes
            $table->string('mime_type', 100)->nullable();
            $table->date('issue_date')->nullable();
            $table->date('expiry_date')->nullable();
            $table->string('status', 30)->default('active'); // active, expired, pending_review
            $table->timestamps();

            $table->index(['employee_id', 'category']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_documents');
        Schema::dropIfExists('employee_experiences');
        Schema::dropIfExists('employee_educations');
        Schema::dropIfExists('employee_emergency_contacts');
        Schema::dropIfExists('employee_contacts');
        Schema::dropIfExists('employee_assignments');
        
        Schema::table('departments', function (Blueprint $table) {
            $table->dropForeign(['manager_id']);
        });
        
        Schema::dropIfExists('employees');
    }
};

