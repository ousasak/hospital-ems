<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 19. Leave types
        Schema::create('leave_types', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code', 50)->unique();
            $table->integer('default_days_per_year')->default(18); // Cambodian standard annual leave is 18 days
            $table->boolean('is_paid')->default(true);
            $table->boolean('requires_attachment')->default(false);
            $table->integer('carry_forward_days')->default(5);
            $table->string('status', 30)->default('active');
            $table->timestamps();
        });

        // 20. Leave balances
        Schema::create('leave_balances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->foreignId('leave_type_id')->constrained('leave_types')->cascadeOnDelete();
            $table->integer('year');
            $table->decimal('total_days', 5, 2)->default(0.00);
            $table->decimal('used_days', 5, 2)->default(0.00);
            $table->decimal('pending_days', 5, 2)->default(0.00);
            $table->decimal('remaining_days', 5, 2)->default(0.00);
            $table->timestamps();

            $table->unique(['employee_id', 'leave_type_id', 'year']);
        });

        // 21. Leave requests (Two-level approval: Supervisor -> HR)
        Schema::create('leave_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->foreignId('leave_type_id')->constrained('leave_types')->cascadeOnDelete();
            $table->date('start_date');
            $table->date('end_date');
            $table->boolean('is_half_day')->default(false);
            $table->string('half_day_type', 20)->nullable(); // morning, afternoon
            $table->decimal('total_days', 5, 2);
            $table->text('reason');
            $table->string('attachment_path')->nullable();
            $table->string('status', 30)->default('pending_supervisor'); // pending_supervisor, pending_hr, approved, rejected, cancelled
            
            // Supervisor review
            $table->foreignId('supervisor_id')->nullable()->constrained('employees')->nullOnDelete();
            $table->string('supervisor_status', 30)->nullable(); // approved, rejected
            $table->dateTime('supervisor_approved_at')->nullable();
            $table->text('supervisor_notes')->nullable();

            // HR review
            $table->foreignId('hr_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('hr_status', 30)->nullable(); // approved, rejected
            $table->dateTime('hr_approved_at')->nullable();
            $table->text('hr_notes')->nullable();

            $table->timestamps();

            $table->index(['employee_id', 'status']);
            $table->index(['start_date', 'end_date']);
        });

        // 22. Leave balance transactions
        Schema::create('leave_balance_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('leave_balance_id')->constrained('leave_balances')->cascadeOnDelete();
            $table->foreignId('leave_request_id')->nullable()->constrained('leave_requests')->nullOnDelete();
            $table->string('transaction_type', 30); // allocated, deducted, restored, carry_forward, adjustment
            $table->decimal('days', 5, 2);
            $table->decimal('balance_after', 5, 2);
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leave_balance_transactions');
        Schema::dropIfExists('leave_requests');
        Schema::dropIfExists('leave_balances');
        Schema::dropIfExists('leave_types');
    }
};

