<?php

namespace App\Providers;

use App\Services\JwtAuthService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Prevent API Resources from auto-wrapping with outer 'data' to maintain single standard envelope
        JsonResource::withoutWrapping();

        // Register custom JWT request guard for stateless API Bearer authentication
        Auth::viaRequest('custom_jwt', function (Request $request) {
            $token = $request->bearerToken();
            if ($token && count(explode('.', $token)) === 3) {
                return JwtAuthService::getUser($token);
            }
            return null;
        });
    }
}
