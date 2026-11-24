<?php

namespace App\Enums;

enum AttendanceStatus: string
{
    case PRESENT = 'present';
    case LATE = 'late';
    case EARLY_DEPARTURE = 'early_departure';
    case HALF_DAY = 'half_day';
    case ABSENT = 'absent';
    case ON_LEAVE = 'on_leave';
    case HOLIDAY = 'holiday';

    public function label(): string
    {
        return match ($this) {
            self::PRESENT => 'Present',
            self::LATE => 'Late Arrival',
            self::EARLY_DEPARTURE => 'Early Departure',
            self::HALF_DAY => 'Half Day',
            self::ABSENT => 'Absent',
            self::ON_LEAVE => 'On Approved Leave',
            self::HOLIDAY => 'Official Holiday',
        };
    }
}

