<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TrainingProgram extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'instructor_name',
        'duration_hours',
        'start_date',
        'end_date',
        'max_participants',
        'location',
        'status',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'duration_hours' => 'integer',
        'max_participants' => 'integer',
    ];

    public function participants(): HasMany
    {
        return $this->hasMany(EmployeeTraining::class);
    }
}

