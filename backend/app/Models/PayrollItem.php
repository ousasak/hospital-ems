<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class PayrollItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'payroll_id',
        'employee_id',
        'base_salary',
        'allowance_total',
        'bonus_total',
        'overtime_pay',
        'deduction_total',
        'tax_amount',
        'net_salary',
        'currency',
        'exchange_rate',
        'status',
        'notes',
    ];

    protected $casts = [
        'base_salary' => 'decimal:2',
        'allowance_total' => 'decimal:2',
        'bonus_total' => 'decimal:2',
        'overtime_pay' => 'decimal:2',
        'deduction_total' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'net_salary' => 'decimal:2',
        'exchange_rate' => 'decimal:4',
    ];

    public function payroll(): BelongsTo
    {
        return $this->belongsTo(Payroll::class);
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function payslip(): HasOne
    {
        return $this->hasOne(Payslip::class);
    }
}

