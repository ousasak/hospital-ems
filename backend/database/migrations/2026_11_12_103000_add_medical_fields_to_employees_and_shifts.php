<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('employees')) {
            Schema::table('employees', function (Blueprint $table) {
                if (!Schema::hasColumn('employees', 'medical_license_number')) {
                    $table->string('medical_license_number', 50)->nullable()->after('passport_number')->comment('លេខអាជ្ញាបណ្ណគណៈគ្រូពេទ្យ/គិលានុបដ្ឋាក');
                }
                if (!Schema::hasColumn('employees', 'license_expiry_date')) {
                    $table->date('license_expiry_date')->nullable()->after('medical_license_number')->comment('កាលបរិច្ឆេទផុតកំណត់អាជ្ញាបណ្ណ');
                }
                if (!Schema::hasColumn('employees', 'specialization')) {
                    $table->string('specialization', 100)->nullable()->after('license_expiry_date')->comment('ឯកទេសវេជ្ជសាស្ត្រ');
                }
            });
        }

        if (Schema::hasTable('work_shifts')) {
            Schema::table('work_shifts', function (Blueprint $table) {
                if (!Schema::hasColumn('work_shifts', 'shift_allowance')) {
                    $table->decimal('shift_allowance', 10, 2)->default(0.00)->after('is_overnight')->comment('ប្រាក់ឧបត្ថម្ភវេនយប់/ប្រចាំការ (Duty Allowance)');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('employees')) {
            Schema::table('employees', function (Blueprint $table) {
                $table->dropColumn(['medical_license_number', 'license_expiry_date', 'specialization']);
            });
        }

        if (Schema::hasTable('work_shifts')) {
            Schema::table('work_shifts', function (Blueprint $table) {
                $table->dropColumn(['shift_allowance']);
            });
        }
    }
};

