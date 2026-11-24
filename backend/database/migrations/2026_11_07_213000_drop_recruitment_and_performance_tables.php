<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Drop Recruitment tables (in reverse foreign key order)
        Schema::dropIfExists('interviews');
        Schema::dropIfExists('job_applications');
        Schema::dropIfExists('candidates');
        Schema::dropIfExists('job_vacancies');

        // 2. Drop Performance & Training tables (in reverse foreign key order)
        Schema::dropIfExists('employee_trainings');
        Schema::dropIfExists('training_programs');
        Schema::dropIfExists('performance_criteria');
        Schema::dropIfExists('performance_reviews');

        // 3. Drop non-essential Employee experiences table
        Schema::dropIfExists('employee_experiences');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No need to reverse as these modules are explicitly removed from the Hospital EMS scope.
    }
};

