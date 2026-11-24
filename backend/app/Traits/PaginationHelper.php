<?php

namespace App\Traits;

use Illuminate\Http\Request;

class PaginationHelper
{
    public static function getPerPage(Request $request, int $default = 15, int $max = 100): int
    {
        $perPage = (int) $request->input('per_page', $default);

        if ($perPage <= 0) {
            return $default;
        }

        return min($perPage, $max);
    }
}
