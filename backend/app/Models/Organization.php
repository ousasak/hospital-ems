<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Organization extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'legal_name',
        'registration_number',
        'tax_id',
        'email',
        'phone',
        'website',
        'logo_path',
        'address',
        'city',
        'country',
        'default_currency',
        'fiscal_year_start',
    ];

    public function departments(): HasMany
    {
        return $this->hasMany(Department::class);
    }

    public function workLocations(): HasMany
    {
        return $this->hasMany(WorkLocation::class);
    }

    public function holidays(): HasMany
    {
        return $this->hasMany(Holiday::class);
    }

    public function announcements(): HasMany
    {
        return $this->hasMany(Announcement::class);
    }

    public function systemSettings(): HasMany
    {
        return $this->hasMany(SystemSetting::class);
    }
}
