<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PerformanceReview extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'reviewer_id',
        'review_period',
        'start_date',
        'end_date',
        'self_rating',
        'reviewer_rating',
        'final_rating',
        'strengths',
        'improvements',
        'goals',
        'status',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'self_rating' => 'decimal:2',
        'reviewer_rating' => 'decimal:2',
        'final_rating' => 'decimal:2',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'reviewer_id');
    }

    public function criteria(): HasMany
    {
        return $this->hasMany(PerformanceCriterion::class);
    }
}

