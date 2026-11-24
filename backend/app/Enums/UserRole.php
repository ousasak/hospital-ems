<?php

namespace App\Enums;

enum UserRole: string
{
    case SUPER_ADMIN = 'Super Admin';
    case HR_ADMIN = 'HR Admin';
    case SUPERVISOR = 'Supervisor';
    case EMPLOYEE = 'Employee';

    public function label(): string
    {
        return match ($this) {
            self::SUPER_ADMIN => 'Super Administrator',
            self::HR_ADMIN => 'Human Resources Admin',
            self::SUPERVISOR => 'Department Supervisor',
            self::EMPLOYEE => 'General Employee',
        };
    }
}

