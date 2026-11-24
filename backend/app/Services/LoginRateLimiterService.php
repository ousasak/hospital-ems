<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;

class LoginRateLimiterService
{
    /**
     * Default progressive lockout policy in seconds
     * Attempt 1: 0s (no lockout)
     * Attempt 2: 0s (no lockout, warning: 1 attempt remaining)
     * Attempt 3: 30s lockout
     * Attempt 4: 60s (1m) lockout
     * Attempt 5: 120s (2m) lockout
     * Attempt 6+: 300s (5m) lockout
     */
    protected static array $defaultPolicy = [
        1 => 0,
        2 => 0,
        3 => 30,
        4 => 60,
        5 => 120,
        6 => 300,
    ];

    /**
     * Default decay window in seconds for failed attempts counter (15 minutes)
     */
    protected static int $defaultDecaySeconds = 900;

    /**
     * Threshold for IP spray protection (attempts across multiple accounts)
     */
    protected static int $defaultMaxIpAttempts = 15;
    protected static int $defaultIpLockoutSeconds = 300;

    /**
     * Get progressive lockout policy from configuration
     */
    public static function getPolicy(): array
    {
        return Config::get('auth.rate_limiting.policy', self::$defaultPolicy);
    }

    /**
     * Get lockout duration for a given attempt count
     */
    public static function getLockoutDuration(int $attempts): int
    {
        $policy = self::getPolicy();
        if ($attempts <= 0) {
            return 0;
        }

        if (isset($policy[$attempts])) {
            return (int) $policy[$attempts];
        }

        $maxKey = max(array_keys($policy));
        if ($attempts >= $maxKey) {
            return (int) $policy[$maxKey];
        }

        return 0;
    }

    /**
     * Normalize username / account identifier
     */
    public static function normalizeIdentifier(?string $identifier): string
    {
        return strtolower(trim((string) $identifier));
    }

    /**
     * Cache key generators
     */
    protected static function accountLockKey(string $normalized): string
    {
        return 'auth_lock:acc:' . sha1($normalized);
    }

    protected static function accountAttemptsKey(string $normalized): string
    {
        return 'auth_attempts:acc:' . sha1($normalized);
    }

    protected static function pairLockKey(string $normalized, string $ip): string
    {
        return 'auth_lock:pair:' . sha1($normalized) . ':' . $ip;
    }

    protected static function ipLockKey(string $ip): string
    {
        return 'auth_lock:ip:' . $ip;
    }

    protected static function ipAttemptsKey(string $ip): string
    {
        return 'auth_attempts:ip:' . $ip;
    }

    /**
     * Check if client/account is currently locked.
     * Pure read operation: does NOT modify or increment any counters.
     *
     * @param string|null $identifier Account email or username
     * @param string $ip Client IP address
     * @return array Status array
     */
    public static function checkLockout(?string $identifier, string $ip): array
    {
        $normalized = self::normalizeIdentifier($identifier);
        $currentTime = time();
        $retryAfter = 0;
        $isLocked = false;
        $reason = null;

        // 1. Check IP lockout (burst/spray protection)
        $ipLockUntil = (int) Cache::get(self::ipLockKey($ip), 0);
        if ($ipLockUntil > $currentTime) {
            $retryAfter = max($retryAfter, $ipLockUntil - $currentTime);
            $isLocked = true;
            $reason = 'ip';
        }

        // 2. Check Account lockout
        if (!empty($normalized)) {
            $accLockUntil = (int) Cache::get(self::accountLockKey($normalized), 0);
            if ($accLockUntil > $currentTime) {
                $retryAfter = max($retryAfter, $accLockUntil - $currentTime);
                $isLocked = true;
                $reason = 'account';
            }

            // Check Account + IP Pair lock
            $pairLockUntil = (int) Cache::get(self::pairLockKey($normalized, $ip), 0);
            if ($pairLockUntil > $currentTime) {
                $retryAfter = max($retryAfter, $pairLockUntil - $currentTime);
                $isLocked = true;
                $reason = $reason ?? 'pair';
            }
        }

        // Fetch failed attempts
        $accAttempts = !empty($normalized) ? (int) Cache::get(self::accountAttemptsKey($normalized), 0) : 0;
        $ipAttempts = (int) Cache::get(self::ipAttemptsKey($ip), 0);
        $currentAttempts = max($accAttempts, $reason === 'ip' ? $ipAttempts : 0);

        if ($isLocked) {
            $remainingAttempts = 0;
        } else {
            if ($currentAttempts < 3) {
                $remainingAttempts = 3 - $currentAttempts;
            } else {
                // If previous lockout duration expired, the user has 1 attempt before the next progressive lockout
                $remainingAttempts = 1;
            }
        }

        return [
            'locked' => $isLocked,
            'retry_after' => $retryAfter,
            'failed_attempts' => $currentAttempts,
            'remaining_attempts' => $remainingAttempts,
            'reason' => $reason,
            'warning' => (!$isLocked && $remainingAttempts === 1),
        ];
    }

    /**
     * Record a failed login attempt.
     * If currently locked, DOES NOT increase failed attempts, returns active lockout info.
     *
     * @param string|null $identifier Account email or username
     * @param string $ip Client IP address
     * @return array Status array
     */
    public static function recordFailedAttempt(?string $identifier, string $ip): array
    {
        // 1. Guard check: if already locked, do not increase attempt counter
        $status = self::checkLockout($identifier, $ip);
        if ($status['locked']) {
            return $status;
        }

        $normalized = self::normalizeIdentifier($identifier);
        $decay = (int) Config::get('auth.rate_limiting.decay_seconds', self::$defaultDecaySeconds);
        $currentTime = time();

        // 2. Increment IP attempts (spray prevention)
        $maxIpAttempts = (int) Config::get('auth.rate_limiting.max_ip_attempts', self::$defaultMaxIpAttempts);
        $ipLockDuration = (int) Config::get('auth.rate_limiting.ip_lockout_seconds', self::$defaultIpLockoutSeconds);

        $ipAttemptsKey = self::ipAttemptsKey($ip);
        $ipAttempts = (int) Cache::get($ipAttemptsKey, 0) + 1;
        Cache::put($ipAttemptsKey, $ipAttempts, $decay);

        if ($ipAttempts >= $maxIpAttempts) {
            $lockUntil = $currentTime + $ipLockDuration;
            Cache::put(self::ipLockKey($ip), $lockUntil, $ipLockDuration);

            return [
                'locked' => true,
                'retry_after' => $ipLockDuration,
                'failed_attempts' => $ipAttempts,
                'remaining_attempts' => 0,
                'reason' => 'ip',
                'warning' => false,
            ];
        }

        // 3. Increment Account attempts
        if (!empty($normalized)) {
            $accAttemptsKey = self::accountAttemptsKey($normalized);
            $accAttempts = (int) Cache::get($accAttemptsKey, 0) + 1;
            Cache::put($accAttemptsKey, $accAttempts, $decay);

            $duration = self::getLockoutDuration($accAttempts);

            if ($duration > 0) {
                $lockUntil = $currentTime + $duration;
                Cache::put(self::accountLockKey($normalized), $lockUntil, $duration);
                Cache::put(self::pairLockKey($normalized, $ip), $lockUntil, $duration);

                return [
                    'locked' => true,
                    'retry_after' => $duration,
                    'failed_attempts' => $accAttempts,
                    'remaining_attempts' => 0,
                    'reason' => 'account',
                    'warning' => false,
                ];
            }

            $remainingAttempts = max(0, 3 - $accAttempts);

            return [
                'locked' => false,
                'retry_after' => 0,
                'failed_attempts' => $accAttempts,
                'remaining_attempts' => $remainingAttempts,
                'reason' => null,
                'warning' => ($remainingAttempts === 1),
            ];
        }

        return [
            'locked' => false,
            'retry_after' => 0,
            'failed_attempts' => $ipAttempts,
            'remaining_attempts' => 1,
            'reason' => null,
            'warning' => false,
        ];
    }

    /**
     * Clear all failed attempts and active lockouts for an account upon successful login.
     */
    public static function clearLoginAttempts(?string $identifier, string $ip): void
    {
        $normalized = self::normalizeIdentifier($identifier);

        if (!empty($normalized)) {
            Cache::forget(self::accountLockKey($normalized));
            Cache::forget(self::accountAttemptsKey($normalized));
            Cache::forget(self::pairLockKey($normalized, $ip));
        }

        // Reset IP failed counters
        Cache::forget(self::ipLockKey($ip));
        Cache::forget(self::ipAttemptsKey($ip));
    }
}
