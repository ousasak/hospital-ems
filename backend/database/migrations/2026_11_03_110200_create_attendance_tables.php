<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 13. Work shifts
        Schema::create('work_shifts', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code', 50)->unique();
            $table->time('start_time');
            $table->time('end_time');
            $table->integer('break_minutes')->default(60);
            $table->integer('grace_period_minutes')->default(15);
            $table->decimal('half_day_hours', 4, 2)->default(4.00);
            $table->decimal('full_day_hours', 4, 2)->default(8.00);
            $table->boolean('is_overnight')->default(false);
            $table->string('status', 30)->default('active');
            $table->timestamps();
        });

        // 14. Holidays
        Schema::create('holidays', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->nullable()->constrained('organizations')->nullOnDelete();
            $table->string('name');
            $table->date('date');
            $table->boolean('is_recurring')->default(false);
            $table->boolean('affects_payroll')->default(true);
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index('date');
        });

        // 15. Work shift assignments
        Schema::create('work_shift_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->foreignId('work_shift_id')->constrained('work_shifts')->cascadeOnDelete();
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['employee_id', 'is_active']);
        });

        // 16. Attendance records
        Schema::create('attendance_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->foreignId('assignment_id')->nullable()->constrained('employee_assignments')->nullOnDelete();
            $table->foreignId('work_shift_id')->nullable()->constrained('work_shifts')->nullOnDelete();
            $table->foreignId('holiday_id')->nullable()->constrained('holidays')->nullOnDelete();
            $table->date('attendance_date');
            $table->dateTime('check_in_time')->nullable();
            $table->dateTime('check_out_time')->nullable();
            $table->decimal('working_hours', 5, 2)->default(0.00);
            $table->integer('late_minutes')->default(0);
            $table->integer('early_leaving_minutes')->default(0);
            $table->decimal('overtime_hours', 5, 2)->default(0.00);
            $table->string('status', 30)->default('present'); // present, late, half_day, absent, on_leave, holiday
            $table->string('check_in_ip', 50)->nullable();
            $table->string('check_out_ip', 50)->nullable();
            $table->string('check_in_method', 30)->default('manual'); // manual, admin, qr, biometric
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['employee_id', 'attendance_date']);
            $table->index(['attendance_date', 'status']);
        });

        // 17. Attendance corrections
        Schema::create('attendance_corrections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attendance_record_id')->constrained('attendance_records')->cascadeOnDelete();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->foreignId('requester_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('approver_id')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('requested_check_in')->nullable();
            $table->dateTime('requested_check_out')->nullable();
            $table->text('reason');
            $table->string('status', 30)->default('pending'); // pending, approved, rejected
            $table->text('approver_notes')->nullable();
            $table->dateTime('approved_at')->nullable();
            $table->timestamps();
        });

        // 18. Overtime requests
        Schema::create('overtime_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->foreignId('attendance_record_id')->nullable()->constrained('attendance_records')->nullOnDelete();
            $table->foreignId('holiday_id')->nullable()->constrained('holidays')->nullOnDelete();
            $table->date('request_date');
            $table->time('start_time');
            $table->time('end_time');
            $table->decimal('planned_hours', 5, 2);
            $table->decimal('actual_hours', 5, 2)->nullable();
            $table->decimal('multiplier', 3, 2)->default(1.50); // 1.5x normal, 2.0x weekend/holiday
            $table->text('reason');
            $table->string('status', 30)->default('pending'); // pending, approved, rejected
            $table->foreignId('approver_id')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('approved_at')->nullable();
            $table->timestamps();

            $table->index(['employee_id', 'request_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('overtime_requests');
        Schema::dropIfExists('attendance_corrections');
        Schema::dropIfExists('attendance_records');
        Schema::dropIfExists('work_shift_assignments');
        Schema::dropIfExists('holidays');
        Schema::dropIfExists('work_shifts');
    }
};

