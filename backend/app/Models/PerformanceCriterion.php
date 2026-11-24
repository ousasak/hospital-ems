<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PerformanceCriterion extends Model
{
    use HasFactory;

    protected $table = 'performance_criteria';

    protected $fillable = [
        'performance_review_id',
        'title',
        'weight',
        'score',
        'comments',
    ];

    protected $casts = [
        'weight' => 'integer',
        'score' => 'decimal:2',
    ];

    public function review(): BelongsTo
    {
        return $this->belongsTo(PerformanceReview::class, 'performance_review_id');
    }
}

