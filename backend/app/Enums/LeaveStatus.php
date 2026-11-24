<?php

namespace App\Enums;

enum LeaveStatus: string
{
    case PENDING = 'pending';
    case SUPERVISOR_APPROVED = 'supervisor_approved';
    case APPROVED = 'approved';
    case REJECTED = 'rejected';
    case CANCELLED = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::PENDING => 'Pending Review',
            self::SUPERVISOR_APPROVED => 'Supervisor Approved',
            self::APPROVED => 'Approved',
            self::REJECTED => 'Rejected',
            self::CANCELLED => 'Cancelled',
        };
    }
}

