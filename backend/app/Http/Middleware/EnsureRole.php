<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
                'detail' => 'Unauthenticated.',
            ], 401);
        }

        if (!empty($roles) && !$user->hasAnyRole($roles) && !$user->hasRole('Super Admin')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access.',
                'detail' => 'Unauthorized access.',
            ], 403);
        }

        return $next($request);
    }
}

