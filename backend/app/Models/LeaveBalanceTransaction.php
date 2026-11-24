<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeaveBalanceTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'leave_balance_id',
        'leave_request_id',
        'transaction_type',
        'days',
        'balance_after',
        'notes',
    ];

    protected $casts = [
        'days' => 'decimal:2',
        'balance_after' => 'decimal:2',
    ];

    public function leaveBalance(): BelongsTo
    {
        return $this->belongsTo(LeaveBalance::class);
    }

    public function leaveRequest(): BelongsTo
    {
        return $this->belongsTo(LeaveRequest::class);
    }
}

