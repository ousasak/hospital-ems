<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WorkShift extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'start_time',
        'end_time',
        'break_minutes',
        'grace_period_minutes',
        'half_day_hours',
        'full_day_hours',
        'is_overnight',
        'shift_allowance',
        'status',
    ];

    protected $casts = [
        'is_overnight' => 'boolean',
        'half_day_hours' => 'decimal:2',
        'full_day_hours' => 'decimal:2',
        'shift_allowance' => 'decimal:2',
    ];

    public function assignments(): HasMany
    {
        return $this->hasMany(WorkShiftAssignment::class);
    }

    public function attendanceRecords(): HasMany
    {
        return $this->hasMany(AttendanceRecord::class);
    }
}

