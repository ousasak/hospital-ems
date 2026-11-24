<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Candidate extends Model
{
    use HasFactory;

    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'phone',
        'resume_path',
        'portfolio_url',
        'source',
        'current_company',
        'current_salary',
        'expected_salary',
        'status',
        'hired_employee_id',
    ];

    protected $casts = [
        'current_salary' => 'decimal:2',
        'expected_salary' => 'decimal:2',
    ];

    protected $appends = ['full_name'];

    public function applications(): HasMany
    {
        return $this->hasMany(JobApplication::class);
    }

    public function hiredEmployee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'hired_employee_id');
    }

    protected function fullName(): Attribute
    {
        return Attribute::make(
            get: fn () => trim($this->first_name . ' ' . $this->last_name),
        );
    }
}

