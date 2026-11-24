<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('employees') && Schema::hasColumn('employees', 'avatar_url')) {
            if (DB::getDriverName() === 'pgsql') {
                DB::statement('ALTER TABLE employees ALTER COLUMN avatar_url TYPE text');
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('employees') && Schema::hasColumn('employees', 'avatar_url')) {
            if (DB::getDriverName() === 'pgsql') {
                DB::statement('ALTER TABLE employees ALTER COLUMN avatar_url TYPE varchar(255)');
            }
        }
    }
};
