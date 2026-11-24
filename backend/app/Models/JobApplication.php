<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JobApplication extends Model
{
    use HasFactory;

    protected $fillable = [
        'job_vacancy_id',
        'candidate_id',
        'application_date',
        'stage',
        'rating',
        'notes',
    ];

    protected $casts = [
        'application_date' => 'date',
        'rating' => 'integer',
    ];

    public function vacancy(): BelongsTo
    {
        return $this->belongsTo(JobVacancy::class, 'job_vacancy_id');
    }

    public function candidate(): BelongsTo
    {
        return $this->belongsTo(Candidate::class);
    }

    public function interviews(): HasMany
    {
        return $this->hasMany(Interview::class);
    }
}

