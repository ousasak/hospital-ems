<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'avatar_url',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = [
        'status',
        'avatar_url',
    ];

    /**
     * Get user status computed from employee profile or email verification
     */
    public function getStatusAttribute(): string
    {
        if ($this->relationLoaded('employee') && $this->employee) {
            $empStatus = $this->employee->employment_status;
            if (!empty($empStatus)) {
                return strtolower($empStatus) === 'active' ? 'active' : 'inactive';
            }
        }
        return $this->email_verified_at ? 'active' : 'inactive';
    }

    /**
     * Get avatar url from associated employee
     */
    public function getAvatarUrlAttribute(): ?string
    {
        if (!empty($this->attributes['avatar_url'])) {
            return $this->attributes['avatar_url'];
        }
        if ($this->relationLoaded('employee') && $this->employee) {
            return $this->employee->avatar_url;
        }
        return null;
    }

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Associated employee profile
     */
    public function employee(): HasOne
    {
        return $this->hasOne(Employee::class);
    }

    public function announcements(): HasMany
    {
        return $this->hasMany(Announcement::class, 'author_id');
    }

    public function updatedSystemSettings(): HasMany
    {
        return $this->hasMany(SystemSetting::class, 'updated_by');
    }

    public function approvedOvertimeRequests(): HasMany
    {
        return $this->hasMany(OvertimeRequest::class, 'approver_id');
    }
}
