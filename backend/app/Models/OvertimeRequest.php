<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OvertimeRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'attendance_record_id',
        'holiday_id',
        'request_date',
        'start_time',
        'end_time',
        'planned_hours',
        'actual_hours',
        'multiplier',
        'reason',
        'status',
        'approver_id',
        'approved_at',
    ];

    protected $casts = [
        'request_date' => 'date',
        'planned_hours' => 'decimal:2',
        'actual_hours' => 'decimal:2',
        'multiplier' => 'decimal:2',
        'approved_at' => 'datetime',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function attendanceRecord(): BelongsTo
    {
        return $this->belongsTo(AttendanceRecord::class);
    }

    public function holiday(): BelongsTo
    {
        return $this->belongsTo(Holiday::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approver_id');
    }
}
