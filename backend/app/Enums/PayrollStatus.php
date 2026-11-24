<?php

namespace App\Enums;

enum PayrollStatus: string
{
    case DRAFT = 'draft';
    case PROCESSING = 'processing';
    case APPROVED = 'approved';
    case PAID = 'paid';
    case CANCELLED = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::DRAFT => 'Draft',
            self::PROCESSING => 'Processing',
            self::APPROVED => 'Approved',
            self::PAID => 'Paid',
            self::CANCELLED => 'Cancelled',
        };
    }
}

