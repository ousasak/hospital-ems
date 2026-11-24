<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Organization profile
        Schema::create('organizations', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('legal_name')->nullable();
            $table->string('registration_number')->nullable();
            $table->string('tax_id')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('website')->nullable();
            $table->string('logo_path')->nullable();
            $table->text('address')->nullable();
            $table->string('city')->nullable();
            $table->string('country')->default('Cambodia');
            $table->string('default_currency', 10)->default('USD');
            $table->string('fiscal_year_start', 10)->default('01-01');
            $table->timestamps();
        });

        // 2. Work locations
        Schema::create('work_locations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->nullable()->constrained('organizations')->nullOnDelete();
            $table->string('name');
            $table->string('code', 50)->unique();
            $table->text('address')->nullable();
            $table->string('city')->nullable();
            $table->string('country')->default('Cambodia');
            $table->string('timezone')->default('Asia/Phnom_Penh');
            $table->boolean('is_headquarters')->default(false);
            $table->string('status')->default('active'); // active, inactive
            $table->timestamps();
        });

        // 3. Employment types
        Schema::create('employment_types', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code', 50)->unique();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 4. Departments (hierarchical)
        Schema::create('departments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->nullable()->constrained('organizations')->nullOnDelete();
            $table->foreignId('parent_id')->nullable()->constrained('departments')->nullOnDelete();
            $table->string('name');
            $table->string('code', 50)->unique();
            $table->text('description')->nullable();
            $table->unsignedBigInteger('manager_id')->nullable(); // will reference employees
            $table->string('status')->default('active'); // active, inactive
            $table->timestamps();
            $table->softDeletes();
        });

        // 5. Positions
        Schema::create('positions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete();
            $table->string('title');
            $table->string('code', 50)->unique();
            $table->text('description')->nullable();
            $table->string('level')->default('mid'); // entry, mid, senior, lead, executive
            $table->decimal('min_salary', 12, 2)->nullable();
            $table->decimal('max_salary', 12, 2)->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('positions');
        Schema::dropIfExists('departments');
        Schema::dropIfExists('employment_types');
        Schema::dropIfExists('work_locations');
        Schema::dropIfExists('organizations');
    }
};

