<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LeaveRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'leave_type_id',
        'start_date',
        'end_date',
        'is_half_day',
        'half_day_type',
        'total_days',
        'reason',
        'attachment_path',
        'status', // pending_supervisor, pending_hr, approved, rejected, cancelled
        'supervisor_id',
        'supervisor_status',
        'supervisor_approved_at',
        'supervisor_notes',
        'hr_id',
        'hr_status',
        'hr_approved_at',
        'hr_notes',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'is_half_day' => 'boolean',
        'total_days' => 'decimal:2',
        'supervisor_approved_at' => 'datetime',
        'hr_approved_at' => 'datetime',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function leaveType(): BelongsTo
    {
        return $this->belongsTo(LeaveType::class);
    }

    public function supervisor(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'supervisor_id');
    }

    public function hr(): BelongsTo
    {
        return $this->belongsTo(User::class, 'hr_id');
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(LeaveBalanceTransaction::class);
    }
}

