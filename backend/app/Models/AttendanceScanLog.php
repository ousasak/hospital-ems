<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AttendanceScanLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'user_id',
        'qr_code_id',
        'event_type', // qr_validate, check_in, check_out, rejected
        'source_ip',
        'latitude',
        'longitude',
        'accuracy',
        'geofence_distance',
        'network_validation_status', // passed, failed
        'location_validation_status', // passed, failed, skipped
        'overall_status', // success, rejected
        'failure_reason',
        'device_metadata',
    ];

    protected $casts = [
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'accuracy' => 'decimal:2',
        'geofence_distance' => 'decimal:2',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function qrCode(): BelongsTo
    {
        return $this->belongsTo(EmployeeQrCode::class, 'qr_code_id');
    }
}

