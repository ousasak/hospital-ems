<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('departments') && Schema::hasColumn('departments', 'khmer_name')) {
            Schema::table('departments', function (Blueprint $table) {
                $table->dropColumn('khmer_name');
            });
        }

        if (Schema::hasTable('positions') && Schema::hasColumn('positions', 'khmer_title')) {
            Schema::table('positions', function (Blueprint $table) {
                $table->dropColumn('khmer_title');
            });
        }

        if (Schema::hasTable('employees') && Schema::hasColumn('employees', 'khmer_name')) {
            Schema::table('employees', function (Blueprint $table) {
                $table->dropColumn('khmer_name');
            });
        }

        if (Schema::hasTable('holidays') && Schema::hasColumn('holidays', 'khmer_name')) {
            Schema::table('holidays', function (Blueprint $table) {
                $table->dropColumn('khmer_name');
            });
        }

        if (Schema::hasTable('leave_types') && Schema::hasColumn('leave_types', 'khmer_name')) {
            Schema::table('leave_types', function (Blueprint $table) {
                $table->dropColumn('khmer_name');
            });
        }

        if (Schema::hasTable('announcements')) {
            Schema::table('announcements', function (Blueprint $table) {
                $columnsToDrop = [];
                if (Schema::hasColumn('announcements', 'khmer_title')) {
                    $columnsToDrop[] = 'khmer_title';
                }
                if (Schema::hasColumn('announcements', 'khmer_content')) {
                    $columnsToDrop[] = 'khmer_content';
                }
                if (!empty($columnsToDrop)) {
                    $table->dropColumn($columnsToDrop);
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('departments') && !Schema::hasColumn('departments', 'khmer_name')) {
            Schema::table('departments', function (Blueprint $table) {
                $table->string('khmer_name')->nullable();
            });
        }

        if (Schema::hasTable('positions') && !Schema::hasColumn('positions', 'khmer_title')) {
            Schema::table('positions', function (Blueprint $table) {
                $table->string('khmer_title')->nullable();
            });
        }

        if (Schema::hasTable('employees') && !Schema::hasColumn('employees', 'khmer_name')) {
            Schema::table('employees', function (Blueprint $table) {
                $table->string('khmer_name')->nullable();
            });
        }

        if (Schema::hasTable('holidays') && !Schema::hasColumn('holidays', 'khmer_name')) {
            Schema::table('holidays', function (Blueprint $table) {
                $table->string('khmer_name')->nullable();
            });
        }

        if (Schema::hasTable('leave_types') && !Schema::hasColumn('leave_types', 'khmer_name')) {
            Schema::table('leave_types', function (Blueprint $table) {
                $table->string('khmer_name')->nullable();
            });
        }

        if (Schema::hasTable('announcements')) {
            Schema::table('announcements', function (Blueprint $table) {
                if (!Schema::hasColumn('announcements', 'khmer_title')) {
                    $table->string('khmer_title')->nullable();
                }
                if (!Schema::hasColumn('announcements', 'khmer_content')) {
                    $table->text('khmer_content')->nullable();
                }
            });
        }
    }
};

