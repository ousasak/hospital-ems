<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 23. Salary structures
        Schema::create('salary_structures', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code', 50)->unique();
            $table->text('description')->nullable();
            $table->string('currency', 10)->default('USD'); // USD, KHR
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 24. Employee salaries
        Schema::create('employee_salaries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->foreignId('salary_structure_id')->nullable()->constrained('salary_structures')->nullOnDelete();
            $table->decimal('base_salary', 12, 2);
            $table->string('currency', 10)->default('USD');
            $table->date('effective_date');
            $table->string('payment_frequency', 20)->default('monthly'); // monthly, semi-monthly
            $table->string('status', 20)->default('active'); // active, past
            $table->timestamps();

            $table->index(['employee_id', 'status']);
        });

        // 25. Payroll batches
        Schema::create('payrolls', function (Blueprint $table) {
            $table->id();
            $table->integer('month');
            $table->integer('year');
            $table->string('title');
            $table->date('start_date');
            $table->date('end_date');
            $table->date('payment_date');
            $table->decimal('total_gross', 14, 2)->default(0.00);
            $table->decimal('total_deductions', 14, 2)->default(0.00);
            $table->decimal('total_net', 14, 2)->default(0.00);
            $table->string('currency', 10)->default('USD');
            $table->string('status', 30)->default('draft'); // draft, reviewed, approved, paid
            $table->foreignId('processed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('paid_at')->nullable();
            $table->timestamps();

            $table->unique(['month', 'year', 'currency']);
        });

        // 26. Individual employee payroll line items
        Schema::create('payroll_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payroll_id')->constrained('payrolls')->cascadeOnDelete();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->decimal('base_salary', 12, 2);
            $table->decimal('allowance_total', 12, 2)->default(0.00);
            $table->decimal('bonus_total', 12, 2)->default(0.00);
            $table->decimal('overtime_pay', 12, 2)->default(0.00);
            $table->decimal('deduction_total', 12, 2)->default(0.00);
            $table->decimal('tax_amount', 12, 2)->default(0.00);
            $table->decimal('net_salary', 12, 2);
            $table->string('currency', 10)->default('USD');
            $table->decimal('exchange_rate', 10, 4)->default(4100.0000); // KHR per USD default
            $table->string('status', 20)->default('pending'); // pending, paid
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['payroll_id', 'employee_id']);
        });

        // 27. Payslips
        Schema::create('payslips', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payroll_item_id')->constrained('payroll_items')->cascadeOnDelete();
            $table->string('payslip_number', 50)->unique();
            $table->dateTime('generated_at');
            $table->string('pdf_path')->nullable();
            $table->string('status', 20)->default('draft'); // draft, sent, downloaded
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payslips');
        Schema::dropIfExists('payroll_items');
        Schema::dropIfExists('payrolls');
        Schema::dropIfExists('employee_salaries');
        Schema::dropIfExists('salary_structures');
    }
};

