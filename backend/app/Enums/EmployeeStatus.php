<?php

namespace App\Enums;

enum EmployeeStatus: string
{
    case ACTIVE = 'active';
    case PROBATION = 'probation';
    case INACTIVE = 'inactive';
    case SUSPENDED = 'suspended';
    case TERMINATED = 'terminated';

    public function label(): string
    {
        return match ($this) {
            self::ACTIVE => 'Active',
            self::PROBATION => 'On Probation',
            self::INACTIVE => 'Inactive',
            self::SUSPENDED => 'Suspended',
            self::TERMINATED => 'Terminated',
        };
    }
}

