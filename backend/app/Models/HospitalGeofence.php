<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HospitalGeofence extends Model
{
    use HasFactory;

    protected $fillable = [
        'organization_id',
        'name',
        'branch_name',
        'latitude',
        'longitude',
        'radius_meters',
        'max_accuracy_meters',
        'status', // active, inactive
        'description',
    ];

    protected $casts = [
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'radius_meters' => 'integer',
        'max_accuracy_meters' => 'integer',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}

