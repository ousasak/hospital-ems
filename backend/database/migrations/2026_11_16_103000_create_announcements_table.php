<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('announcements')) {
            Schema::create('announcements', function (Blueprint $table) {
                $table->id();
                $table->foreignId('organization_id')->nullable()->constrained('organizations')->nullOnDelete();
                $table->string('title');
                $table->text('content');
                $table->string('target_audience', 30)->default('all'); // all, department
                $table->foreignId('target_department_id')->nullable()->constrained('departments')->nullOnDelete();
                $table->string('priority', 20)->default('normal'); // normal, high, urgent
                $table->boolean('is_published')->default(true);
                $table->dateTime('published_at');
                $table->dateTime('expires_at')->nullable();
                $table->foreignId('author_id')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();

                $table->index(['is_published', 'published_at']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('announcements');
    }
};
