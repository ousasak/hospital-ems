<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class AttendanceRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'assignment_id',
        'work_shift_id',
        'holiday_id',
        'attendance_date',
        'check_in_time',
        'check_out_time',
        'working_hours',
        'late_minutes',
        'early_leaving_minutes',
        'overtime_hours',
        'status', // present, late, half_day, absent, on_leave, holiday
        'check_in_ip',
        'check_out_ip',
        'check_in_method',
        'notes',
        'qr_code_id',
        'check_in_latitude',
        'check_in_longitude',
        'check_in_accuracy',
        'check_in_distance_meters',
        'check_out_latitude',
        'check_out_longitude',
        'check_out_accuracy',
        'check_out_distance_meters',
    ];

    protected $casts = [
        'attendance_date' => 'date',
        'check_in_time' => 'datetime',
        'check_out_time' => 'datetime',
        'working_hours' => 'decimal:2',
        'late_minutes' => 'integer',
        'early_leaving_minutes' => 'integer',
        'overtime_hours' => 'decimal:2',
        'check_in_latitude' => 'decimal:8',
        'check_in_longitude' => 'decimal:8',
        'check_in_accuracy' => 'decimal:2',
        'check_in_distance_meters' => 'decimal:2',
        'check_out_latitude' => 'decimal:8',
        'check_out_longitude' => 'decimal:8',
        'check_out_accuracy' => 'decimal:2',
        'check_out_distance_meters' => 'decimal:2',
    ];

    public function qrCode(): BelongsTo
    {
        return $this->belongsTo(EmployeeQrCode::class, 'qr_code_id');
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function assignment(): BelongsTo
    {
        return $this->belongsTo(EmployeeAssignment::class);
    }

    public function workShift(): BelongsTo
    {
        return $this->belongsTo(WorkShift::class);
    }

    public function holiday(): BelongsTo
    {
        return $this->belongsTo(Holiday::class);
    }

    public function correction(): HasOne
    {
        return $this->hasOne(AttendanceCorrection::class);
    }
}
