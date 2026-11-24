<?php

namespace App\Enums;

enum EmploymentTypeEnum: string
{
    case FULL_TIME = 'Full-time';
    case PART_TIME = 'Part-time';
    case CONTRACT = 'Contract';
    case INTERN = 'Intern';
    case PROBATION = 'Probationary';

    public function label(): string
    {
        return match ($this) {
            self::FULL_TIME => 'Full-time Permanent',
            self::PART_TIME => 'Part-time',
            self::CONTRACT => 'Fixed-term Contract',
            self::INTERN => 'Internship',
            self::PROBATION => 'Probationary Period',
        };
    }
}

