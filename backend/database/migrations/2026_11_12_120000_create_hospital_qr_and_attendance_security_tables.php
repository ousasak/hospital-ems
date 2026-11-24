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
        // 1. Employee QR Codes table
        if (!Schema::hasTable('employee_qr_codes')) {
            Schema::create('employee_qr_codes', function (Blueprint $table) {
                $table->id();
                $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
                $table->string('token_hash', 64)->unique();
                $table->string('status', 20)->default('active'); // active, revoked, expired
                $table->dateTime('generated_at');
                $table->dateTime('expires_at')->nullable();
                $table->dateTime('revoked_at')->nullable();
                $table->foreignId('generated_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('revoked_by')->nullable()->constrained('users')->nullOnDelete();
                $table->string('revocation_reason', 255)->nullable();
                $table->timestamps();

                $table->index(['employee_id', 'status']);
            });
        }

        // 2. Hospital Networks table (Authorized Wi-Fi Public Egress IPs / CIDRs)
        if (!Schema::hasTable('hospital_networks')) {
            Schema::create('hospital_networks', function (Blueprint $table) {
                $table->id();
                $table->foreignId('organization_id')->nullable()->constrained('organizations')->nullOnDelete();
                $table->string('branch_name', 100)->default('Main Hospital Campus');
                $table->string('network_name', 100);
                $table->string('allowed_ip', 45)->nullable();
                $table->string('allowed_cidr', 50)->nullable();
                $table->text('description')->nullable();
                $table->string('status', 20)->default('active'); // active, inactive
                $table->timestamps();

                $table->index(['status']);
                $table->index(['allowed_ip']);
            });
        }

        // 3. Hospital Geofences table (Authorized Attendance Zones)
        if (!Schema::hasTable('hospital_geofences')) {
            Schema::create('hospital_geofences', function (Blueprint $table) {
                $table->id();
                $table->foreignId('organization_id')->nullable()->constrained('organizations')->nullOnDelete();
                $table->string('name', 100);
                $table->string('branch_name', 100)->default('Main Campus');
                $table->decimal('latitude', 11, 8);
                $table->decimal('longitude', 11, 8);
                $table->unsignedInteger('radius_meters')->default(150);
                $table->unsignedInteger('max_accuracy_meters')->default(80);
                $table->string('status', 20)->default('active'); // active, inactive
                $table->text('description')->nullable();
                $table->timestamps();

                $table->index(['status']);
            });
        }

        // 4. Extend attendance_records with Geolocation & QR audit fields
        if (Schema::hasTable('attendance_records')) {
            Schema::table('attendance_records', function (Blueprint $table) {
                if (!Schema::hasColumn('attendance_records', 'qr_code_id')) {
                    $table->foreignId('qr_code_id')->nullable()->after('notes')->constrained('employee_qr_codes')->nullOnDelete();
                }
                if (!Schema::hasColumn('attendance_records', 'check_in_latitude')) {
                    $table->decimal('check_in_latitude', 11, 8)->nullable()->after('check_in_ip');
                }
                if (!Schema::hasColumn('attendance_records', 'check_in_longitude')) {
                    $table->decimal('check_in_longitude', 11, 8)->nullable()->after('check_in_latitude');
                }
                if (!Schema::hasColumn('attendance_records', 'check_in_accuracy')) {
                    $table->decimal('check_in_accuracy', 8, 2)->nullable()->after('check_in_longitude');
                }
                if (!Schema::hasColumn('attendance_records', 'check_in_distance_meters')) {
                    $table->decimal('check_in_distance_meters', 8, 2)->nullable()->after('check_in_accuracy');
                }
                if (!Schema::hasColumn('attendance_records', 'check_out_latitude')) {
                    $table->decimal('check_out_latitude', 11, 8)->nullable()->after('check_out_ip');
                }
                if (!Schema::hasColumn('attendance_records', 'check_out_longitude')) {
                    $table->decimal('check_out_longitude', 11, 8)->nullable()->after('check_out_latitude');
                }
                if (!Schema::hasColumn('attendance_records', 'check_out_accuracy')) {
                    $table->decimal('check_out_accuracy', 8, 2)->nullable()->after('check_out_longitude');
                }
                if (!Schema::hasColumn('attendance_records', 'check_out_distance_meters')) {
                    $table->decimal('check_out_distance_meters', 8, 2)->nullable()->after('check_out_accuracy');
                }
            });
        }

        // 5. Attendance Scan Logs (Full Audit Trail for all QR Scans, Validations, Successes & Rejections)
        if (!Schema::hasTable('attendance_scan_logs')) {
            Schema::create('attendance_scan_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('employee_id')->nullable()->constrained('employees')->cascadeOnDelete();
                $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('qr_code_id')->nullable()->constrained('employee_qr_codes')->nullOnDelete();
                $table->string('event_type', 30); // qr_validate, check_in, check_out, rejected
                $table->string('source_ip', 45);
                $table->decimal('latitude', 11, 8)->nullable();
                $table->decimal('longitude', 11, 8)->nullable();
                $table->decimal('accuracy', 8, 2)->nullable();
                $table->decimal('geofence_distance', 8, 2)->nullable();
                $table->string('network_validation_status', 20); // passed, failed
                $table->string('location_validation_status', 20); // passed, failed, skipped
                $table->string('overall_status', 20); // success, rejected
                $table->string('failure_reason', 255)->nullable();
                $table->text('device_metadata')->nullable();
                $table->timestamps();

                $table->index(['employee_id', 'created_at']);
                $table->index(['overall_status']);
                $table->index(['event_type']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendance_scan_logs');

        if (Schema::hasTable('attendance_records')) {
            Schema::table('attendance_records', function (Blueprint $table) {
                if (Schema::hasColumn('attendance_records', 'qr_code_id')) {
                    $table->dropForeign(['qr_code_id']);
                    $table->dropColumn('qr_code_id');
                }
                $columns = [
                    'check_in_latitude',
                    'check_in_longitude',
                    'check_in_accuracy',
                    'check_in_distance_meters',
                    'check_out_latitude',
                    'check_out_longitude',
                    'check_out_accuracy',
                    'check_out_distance_meters',
                ];
                foreach ($columns as $column) {
                    if (Schema::hasColumn('attendance_records', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }

        Schema::dropIfExists('hospital_geofences');
        Schema::dropIfExists('hospital_networks');
        Schema::dropIfExists('employee_qr_codes');
    }
};

