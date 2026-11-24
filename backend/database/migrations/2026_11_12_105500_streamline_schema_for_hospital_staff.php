<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations to streamline database to pure Hospital Staff scope.
     */
    public function up(): void
    {
        // 1. Drop Work Location FK & column from employee_assignments
        if (Schema::hasColumn('employee_assignments', 'work_location_id')) {
            Schema::table('employee_assignments', function (Blueprint $table) {
                $table->dropForeign(['work_location_id']);
                $table->dropColumn('work_location_id');
            });
        }

        // 2. Drop Location table
        Schema::dropIfExists('work_locations');

        // 3. Drop Payroll module tables (in reverse FK dependency order)
        Schema::dropIfExists('payslips');
        Schema::dropIfExists('payroll_items');
        Schema::dropIfExists('payrolls');
        Schema::dropIfExists('employee_salaries');
        Schema::dropIfExists('salary_structures');

        // 4. Drop Leave Balance Transactions
        Schema::dropIfExists('leave_balance_transactions');

        // 5. Drop Internal Announcements table
        Schema::dropIfExists('announcements');

        // 6. Drop unused Laravel Framework infrastructure tables
        Schema::dropIfExists('failed_jobs');
        Schema::dropIfExists('job_batches');
        Schema::dropIfExists('jobs');
        Schema::dropIfExists('cache_locks');
        Schema::dropIfExists('cache');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // One-way optimization for Hospital Staff EMS scope
    }
};

