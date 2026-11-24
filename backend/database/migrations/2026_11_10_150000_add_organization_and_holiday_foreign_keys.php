<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. work_locations -> organizations
        Schema::table('work_locations', function (Blueprint $table) {
            if (!Schema::hasColumn('work_locations', 'organization_id')) {
                $table->foreignId('organization_id')->nullable()->after('id')->constrained('organizations')->nullOnDelete();
            }
        });

        // 2. departments -> organizations
        Schema::table('departments', function (Blueprint $table) {
            if (!Schema::hasColumn('departments', 'organization_id')) {
                $table->foreignId('organization_id')->nullable()->after('id')->constrained('organizations')->nullOnDelete();
            }
        });

        // 3. holidays -> organizations
        Schema::table('holidays', function (Blueprint $table) {
            if (!Schema::hasColumn('holidays', 'organization_id')) {
                $table->foreignId('organization_id')->nullable()->after('id')->constrained('organizations')->nullOnDelete();
            }
        });

        // 4. attendance_records -> holidays
        Schema::table('attendance_records', function (Blueprint $table) {
            if (!Schema::hasColumn('attendance_records', 'holiday_id')) {
                $table->foreignId('holiday_id')->nullable()->after('work_shift_id')->constrained('holidays')->nullOnDelete();
            }
        });

        // 5. overtime_requests -> holidays
        Schema::table('overtime_requests', function (Blueprint $table) {
            if (!Schema::hasColumn('overtime_requests', 'holiday_id')) {
                $table->foreignId('holiday_id')->nullable()->after('attendance_record_id')->constrained('holidays')->nullOnDelete();
            }
        });

        // 6. announcements -> organizations
        Schema::table('announcements', function (Blueprint $table) {
            if (!Schema::hasColumn('announcements', 'organization_id')) {
                $table->foreignId('organization_id')->nullable()->after('id')->constrained('organizations')->nullOnDelete();
            }
        });

        // 7. system_settings -> organizations, users
        Schema::table('system_settings', function (Blueprint $table) {
            if (!Schema::hasColumn('system_settings', 'organization_id')) {
                $table->foreignId('organization_id')->nullable()->after('id')->constrained('organizations')->nullOnDelete();
            }
            if (!Schema::hasColumn('system_settings', 'updated_by')) {
                $table->foreignId('updated_by')->nullable()->after('is_public')->constrained('users')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('system_settings', function (Blueprint $table) {
            if (Schema::hasColumn('system_settings', 'updated_by')) {
                $table->dropForeign(['updated_by']);
                $table->dropColumn('updated_by');
            }
            if (Schema::hasColumn('system_settings', 'organization_id')) {
                $table->dropForeign(['organization_id']);
                $table->dropColumn('organization_id');
            }
        });

        Schema::table('announcements', function (Blueprint $table) {
            if (Schema::hasColumn('announcements', 'organization_id')) {
                $table->dropForeign(['organization_id']);
                $table->dropColumn('organization_id');
            }
        });

        Schema::table('overtime_requests', function (Blueprint $table) {
            if (Schema::hasColumn('overtime_requests', 'holiday_id')) {
                $table->dropForeign(['holiday_id']);
                $table->dropColumn('holiday_id');
            }
        });

        Schema::table('attendance_records', function (Blueprint $table) {
            if (Schema::hasColumn('attendance_records', 'holiday_id')) {
                $table->dropForeign(['holiday_id']);
                $table->dropColumn('holiday_id');
            }
        });

        Schema::table('holidays', function (Blueprint $table) {
            if (Schema::hasColumn('holidays', 'organization_id')) {
                $table->dropForeign(['organization_id']);
                $table->dropColumn('organization_id');
            }
        });

        Schema::table('departments', function (Blueprint $table) {
            if (Schema::hasColumn('departments', 'organization_id')) {
                $table->dropForeign(['organization_id']);
                $table->dropColumn('organization_id');
            }
        });

        Schema::table('work_locations', function (Blueprint $table) {
            if (Schema::hasColumn('work_locations', 'organization_id')) {
                $table->dropForeign(['organization_id']);
                $table->dropColumn('organization_id');
            }
        });
    }
};

