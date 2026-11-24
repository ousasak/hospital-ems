<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HospitalNetwork extends Model
{
    use HasFactory;

    protected $fillable = [
        'organization_id',
        'branch_name',
        'network_name',
        'allowed_ip',
        'allowed_cidr',
        'description',
        'status', // active, inactive
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}

