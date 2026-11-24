<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 32. Performance reviews
        Schema::create('performance_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->foreignId('reviewer_id')->nullable()->constrained('employees')->nullOnDelete();
            $table->string('review_period', 50); // e.g. Q1 2026, Mid-Year 2026, Annual 2026
            $table->date('start_date');
            $table->date('end_date');
            $table->decimal('self_rating', 3, 2)->nullable(); // 1.00 - 5.00
            $table->decimal('reviewer_rating', 3, 2)->nullable();
            $table->decimal('final_rating', 3, 2)->nullable();
            $table->text('strengths')->nullable();
            $table->text('improvements')->nullable();
            $table->text('goals')->nullable();
            $table->string('status', 30)->default('draft'); // draft, submitted, acknowledged, completed
            $table->timestamps();

            $table->index(['employee_id', 'review_period']);
        });

        // 33. Performance criteria / KPI items
        Schema::create('performance_criteria', function (Blueprint $table) {
            $table->id();
            $table->foreignId('performance_review_id')->constrained('performance_reviews')->cascadeOnDelete();
            $table->string('title');
            $table->integer('weight')->default(20); // percentage weight
            $table->decimal('score', 3, 2)->default(0.00); // 1.00 to 5.00
            $table->text('comments')->nullable();
            $table->timestamps();
        });

        // 34. Training programs
        Schema::create('training_programs', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('instructor_name')->nullable();
            $table->integer('duration_hours')->default(8);
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->integer('max_participants')->default(20);
            $table->string('location')->nullable();
            $table->string('status', 30)->default('upcoming'); // upcoming, in_progress, completed, cancelled
            $table->timestamps();
        });

        // 35. Employee trainings / enrollment
        Schema::create('employee_trainings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->foreignId('training_program_id')->constrained('training_programs')->cascadeOnDelete();
            $table->date('enrollment_date');
            $table->string('attendance_status', 30)->default('registered'); // registered, attended, absent
            $table->string('completion_status', 30)->default('enrolled'); // enrolled, completed, failed, dropped
            $table->string('certificate_number', 50)->nullable();
            $table->string('certificate_file')->nullable();
            $table->text('feedback')->nullable();
            $table->timestamps();

            $table->unique(['employee_id', 'training_program_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_trainings');
        Schema::dropIfExists('training_programs');
        Schema::dropIfExists('performance_criteria');
        Schema::dropIfExists('performance_reviews');
    }
};

