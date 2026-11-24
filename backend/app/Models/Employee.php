<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Employee extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'employee_code',
        'first_name',
        'last_name',
        'gender',
        'date_of_birth',
        'marital_status',
        'nationality',
        'national_id',
        'passport_number',
        'medical_license_number',
        'license_expiry_date',
        'specialization',
        'email',
        'phone',
        'personal_email',
        'avatar_url',
        'join_date',
        'probation_end_date',
        'contract_end_date',
        'employment_status',
        'address',
        'city',
        'bank_name',
        'bank_account_name',
        'bank_account_number',
        'qr_code_token',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'license_expiry_date' => 'date',
        'join_date' => 'date',
        'probation_end_date' => 'date',
        'contract_end_date' => 'date',
    ];

    protected $appends = ['full_name', 'base_salary'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(EmployeeAssignment::class)->orderBy('start_date', 'desc');
    }

    public function primaryAssignment(): HasOne
    {
        return $this->hasOne(EmployeeAssignment::class)
            ->where('is_primary', true)
            ->where('status', 'active');
    }

    /**
     * Get active assignment for a specific date (Historical Source of Truth)
     */
    public function getAssignmentForDate(Carbon|string $date): ?EmployeeAssignment
    {
        $d = is_string($date) ? Carbon::parse($date)->toDateString() : $date->toDateString();

        return $this->assignments()
            ->where('start_date', '<=', $d)
            ->where(function ($query) use ($d) {
                $query->whereNull('end_date')
                    ->orWhere('end_date', '>=', $d);
            })
            ->where('is_primary', true)
            ->whereIn('status', ['active', 'ended'])
            ->first();
    }

    public function contacts(): HasMany
    {
        return $this->hasMany(EmployeeContact::class);
    }

    public function emergencyContacts(): HasMany
    {
        return $this->hasMany(EmployeeEmergencyContact::class);
    }

    public function educations(): HasMany
    {
        return $this->hasMany(EmployeeEducation::class);
    }

    public function experiences(): HasMany
    {
        return $this->hasMany(EmployeeExperience::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(EmployeeDocument::class);
    }

    public function attendanceRecords(): HasMany
    {
        return $this->hasMany(AttendanceRecord::class);
    }

    public function qrCodes(): HasMany
    {
        return $this->hasMany(EmployeeQrCode::class)->orderBy('created_at', 'desc');
    }

    public function activeQrCode(): HasOne
    {
        return $this->hasOne(EmployeeQrCode::class)
            ->where('status', 'active')
            ->latestOfMany();
    }

    public function scanLogs(): HasMany
    {
        return $this->hasMany(AttendanceScanLog::class)->orderBy('created_at', 'desc');
    }

    public function leaveBalances(): HasMany
    {
        return $this->hasMany(LeaveBalance::class);
    }

    public function leaveRequests(): HasMany
    {
        return $this->hasMany(LeaveRequest::class);
    }

    public function salaries(): HasMany
    {
        return $this->hasMany(EmployeeSalary::class);
    }

    public function currentSalary(): HasOne
    {
        return $this->hasOne(EmployeeSalary::class)
            ->where('status', 'active')
            ->latestOfMany('effective_date');
    }

    public function payrollItems(): HasMany
    {
        return $this->hasMany(PayrollItem::class);
    }

    public function performanceReviews(): HasMany
    {
        return $this->hasMany(PerformanceReview::class);
    }

    public function trainings(): HasMany
    {
        return $this->hasMany(EmployeeTraining::class);
    }

    public function managedDepartments(): HasMany
    {
        return $this->hasMany(Department::class, 'manager_id');
    }

    public function subordinates(): HasMany
    {
        return $this->hasMany(EmployeeAssignment::class, 'supervisor_id')
            ->where('status', 'active')
            ->where('is_primary', true);
    }

    protected function fullName(): Attribute
    {
        return Attribute::make(
            get: fn () => trim($this->first_name . ' ' . $this->last_name),
        );
    }

    protected function baseSalary(): Attribute
    {
        return Attribute::make(
            get: function () {
                if (\Illuminate\Support\Facades\Schema::hasTable('employee_salaries') && $this->relationLoaded('currentSalary') && $this->currentSalary) {
                    return (float) $this->currentSalary->base_salary;
                }
                $assignment = $this->relationLoaded('primaryAssignment') ? $this->primaryAssignment : null;
                if ($assignment && $assignment->position && $assignment->position->min_salary) {
                    return (float) $assignment->position->min_salary;
                }
                return null;
            }
        );
    }
}

