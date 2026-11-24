<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 28. Job vacancies
        Schema::create('job_vacancies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete();
            $table->foreignId('position_id')->nullable()->constrained('positions')->nullOnDelete();
            $table->string('title');
            $table->string('code', 50)->unique();
            $table->integer('openings_count')->default(1);
            $table->string('employment_type', 50)->default('Full-time');
            $table->string('experience_level', 50)->default('Mid-level');
            $table->string('salary_range', 100)->nullable();
            $table->text('description');
            $table->text('requirements')->nullable();
            $table->date('closing_date')->nullable();
            $table->string('status', 30)->default('open'); // draft, open, closed
            $table->timestamps();
        });

        // 29. Candidates
        Schema::create('candidates', function (Blueprint $table) {
            $table->id();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('email');
            $table->string('phone', 50)->nullable();
            $table->string('resume_path')->nullable();
            $table->string('portfolio_url')->nullable();
            $table->string('source', 50)->default('website'); // website, referral, linkedin, agency
            $table->string('current_company')->nullable();
            $table->decimal('current_salary', 12, 2)->nullable();
            $table->decimal('expected_salary', 12, 2)->nullable();
            $table->string('status', 30)->default('applied'); // applied, screening, interview, offered, hired, rejected
            $table->foreignId('hired_employee_id')->nullable()->constrained('employees')->nullOnDelete();
            $table->timestamps();

            $table->index(['first_name', 'last_name', 'email']);
        });

        // 30. Job applications
        Schema::create('job_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_vacancy_id')->constrained('job_vacancies')->cascadeOnDelete();
            $table->foreignId('candidate_id')->constrained('candidates')->cascadeOnDelete();
            $table->date('application_date');
            $table->string('stage', 30)->default('applied'); // applied, screening, interview, offer, hired, rejected
            $table->integer('rating')->default(0); // 1 to 5
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['job_vacancy_id', 'candidate_id']);
        });

        // 31. Interviews
        Schema::create('interviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_application_id')->constrained('job_applications')->cascadeOnDelete();
            $table->foreignId('interviewer_id')->nullable()->constrained('employees')->nullOnDelete();
            $table->dateTime('scheduled_at');
            $table->integer('duration_minutes')->default(45);
            $table->string('meeting_type', 30)->default('in_person'); // in_person, online, phone
            $table->string('meeting_link_or_room')->nullable();
            $table->text('feedback')->nullable();
            $table->integer('score')->nullable(); // 1 - 100
            $table->string('status', 30)->default('scheduled'); // scheduled, completed, cancelled
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('interviews');
        Schema::dropIfExists('job_applications');
        Schema::dropIfExists('candidates');
        Schema::dropIfExists('job_vacancies');
    }
};

