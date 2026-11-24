<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;

class JwtAuthService
{
    /**
     * In-memory runtime blacklist for active request execution & testing
     */
    protected static array $runtimeBlacklist = [];
    /**
     * Retrieve the cryptographic secret key for signing JWTs
     */
    public static function getSecret(): string
    {
        $secret = Config::get('jwt.secret') ?: Config::get('app.key');
        if (!$secret) {
            $secret = 'staffstream-ems-fallback-jwt-secret-key-32chars';
        }

        if (str_starts_with($secret, 'base64:')) {
            $secret = base64_decode(substr($secret, 7));
        }

        return $secret;
    }

    /**
     * Generate an RFC 7519 compliant JSON Web Token (HS256)
     */
    public static function generate(User $user, ?int $ttlSeconds = null): string
    {
        $ttl = $ttlSeconds ?? (int) Config::get('jwt.ttl', 3600);

        $header = [
            'typ' => 'JWT',
            'alg' => 'HS256',
        ];

        $roles = [];
        $permissions = [];
        try {
            if ($user->relationLoaded('roles')) {
                $roles = $user->roles->pluck('name')->toArray();
            } elseif ($user->exists && method_exists($user, 'getRoleNames')) {
                $roles = $user->getRoleNames()->toArray();
            }
            if ($user->relationLoaded('permissions')) {
                $permissions = $user->permissions->pluck('name')->toArray();
            } elseif ($user->exists && method_exists($user, 'getAllPermissions')) {
                $permissions = $user->getAllPermissions()->pluck('name')->toArray();
            }
        } catch (\Throwable $e) {
            $roles = [];
            $permissions = [];
        }

        $now = time();
        $payload = [
            'iss' => Config::get('app.url', 'http://localhost'),
            'sub' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $roles[0] ?? 'Employee',
            'roles' => $roles,
            'permissions' => $permissions,
            'jti' => bin2hex(random_bytes(16)),
            'iat' => $now,
            'exp' => $now + $ttl,
        ];

        $encodedHeader = self::base64UrlEncode(json_encode($header));
        $encodedPayload = self::base64UrlEncode(json_encode($payload));

        $secret = self::getSecret();
        $signature = self::base64UrlEncode(
            hash_hmac('sha256', "{$encodedHeader}.{$encodedPayload}", $secret, true)
        );

        return "{$encodedHeader}.{$encodedPayload}.{$signature}";
    }

    /**
     * Validate a JWT string and return its payload, or null if invalid, expired, or revoked
     */
    public static function verify(string $token): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }

        [$encodedHeader, $encodedPayload, $signature] = $parts;

        $secret = self::getSecret();
        $expectedSig = self::base64UrlEncode(
            hash_hmac('sha256', "{$encodedHeader}.{$encodedPayload}", $secret, true)
        );

        if (!hash_equals($expectedSig, $signature)) {
            return null;
        }

        $payloadJson = self::base64UrlDecode($encodedPayload);
        $payload = json_decode($payloadJson, true);

        if (!is_array($payload) || !isset($payload['sub'])) {
            return null;
        }

        // Check expiration
        if (isset($payload['exp']) && time() >= $payload['exp']) {
            return null;
        }

        // Check token revocation blacklist
        if (isset($payload['jti'])) {
            $jti = $payload['jti'];
            if (isset(self::$runtimeBlacklist[$jti])) {
                return null;
            }
            try {
                if (Cache::store('file')->has('jwt_bl_' . $jti)) {
                    return null;
                }
            } catch (\Throwable $e) {
                // Ignore cache errors in testing
            }
        }

        return $payload;
    }

    /**
     * Blacklist / Invalidate a JWT token
     */
    public static function invalidate(string $token): bool
    {
        $payload = self::verify($token);
        if (!$payload || !isset($payload['jti'])) {
            return false;
        }

        $jti = $payload['jti'];
        self::$runtimeBlacklist[$jti] = true;

        $remainingSeconds = max(1, ($payload['exp'] ?? time() + 3600) - time());
        try {
            Cache::store('file')->put('jwt_bl_' . $jti, true, $remainingSeconds);
            return true;
        } catch (\Throwable $e) {
            return true;
        }
    }

    /**
     * Resolve the authenticating user from a JWT token
     */
    public static function getUser(string $token): ?User
    {
        $payload = self::verify($token);
        if (!$payload) {
            return null;
        }

        $user = User::find($payload['sub']);
        if (!$user) {
            return null;
        }

        // Validate account status if present
        $userStatus = $user->status ?? 'active';
        $employeeStatus = $user->employee?->employment_status ?? 'active';

        if (in_array(strtolower($userStatus), ['inactive', 'suspended', 'disabled']) ||
            in_array(strtolower($employeeStatus), ['inactive', 'suspended', 'terminated', 'resigned'])) {
            return null;
        }

        return $user;
    }

    /**
     * Base64Url encode helper
     */
    public static function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    /**
     * Base64Url decode helper
     */
    public static function base64UrlDecode(string $data): string
    {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}
