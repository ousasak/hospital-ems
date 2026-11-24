<?php

namespace App\Services\Attendance;

use App\Models\HospitalNetwork;

class NetworkValidationService
{
    /**
     * Validate client source IP against active hospital networks
     *
     * @param string $clientIp
     * @return array{valid: bool, network: ?HospitalNetwork, client_ip: string, message: string}
     */
    public function validateIp(string $clientIp): array
    {
        $clientIp = trim($clientIp);

        if (empty($clientIp)) {
            return [
                'valid' => false,
                'network' => null,
                'client_ip' => $clientIp,
                'message' => 'Client source IP could not be detected.',
            ];
        }

        // Fetch all active hospital networks
        $activeNetworks = HospitalNetwork::where('status', 'active')->get();

        if ($activeNetworks->isEmpty()) {
            return [
                'valid' => false,
                'network' => null,
                'client_ip' => $clientIp,
                'message' => 'No active hospital networks configured. Please contact HR/IT Administrator.',
            ];
        }

        foreach ($activeNetworks as $network) {
            // 1. Check exact IP match
            if (!empty($network->allowed_ip)) {
                if ($this->matchExactIp($clientIp, $network->allowed_ip)) {
                    return [
                        'valid' => true,
                        'network' => $network,
                        'client_ip' => $clientIp,
                        'message' => "Connected via authorized hospital network: {$network->network_name}",
                    ];
                }
            }

            // 2. Check CIDR range match
            if (!empty($network->allowed_cidr)) {
                if ($this->matchCidr($clientIp, $network->allowed_cidr)) {
                    return [
                        'valid' => true,
                        'network' => $network,
                        'client_ip' => $clientIp,
                        'message' => "Connected via authorized hospital network range: {$network->network_name} ({$network->allowed_cidr})",
                    ];
                }
            }
        }

        return [
            'valid' => false,
            'network' => null,
            'client_ip' => $clientIp,
            'message' => "Unauthorized network source IP: {$clientIp}. You must connect to an authorized Hospital Wi-Fi network.",
        ];
    }

    /**
     * Check exact IP match (handling IPv4-mapped IPv6 if present)
     */
    public function matchExactIp(string $clientIp, string $allowedIp): bool
    {
        $normClient = $this->normalizeIp($clientIp);
        $normAllowed = $this->normalizeIp($allowedIp);

        return $normClient === $normAllowed;
    }

    /**
     * Check if IP is in CIDR subnet
     */
    public function matchCidr(string $clientIp, string $cidr): bool
    {
        $cidr = trim($cidr);
        if (!str_contains($cidr, '/')) {
            return $this->matchExactIp($clientIp, $cidr);
        }

        [$subnet, $maskBits] = explode('/', $cidr, 2);
        $maskBits = (int) $maskBits;

        $clientPton = @inet_pton($this->normalizeIp($clientIp));
        $subnetPton = @inet_pton($this->normalizeIp($subnet));

        if ($clientPton === false || $subnetPton === false) {
            return false;
        }

        // Both must be same family (IPv4: 4 bytes, IPv6: 16 bytes)
        if (strlen($clientPton) !== strlen($subnetPton)) {
            return false;
        }

        $byteLen = strlen($clientPton);
        $maxBits = $byteLen * 8;

        if ($maskBits < 0 || $maskBits > $maxBits) {
            return false;
        }

        $fullBytes = intdiv($maskBits, 8);
        $extraBits = $maskBits % 8;

        // Check full bytes
        for ($i = 0; $i < $fullBytes; $i++) {
            if ($clientPton[$i] !== $subnetPton[$i]) {
                return false;
            }
        }

        // Check remaining bits
        if ($extraBits > 0) {
            $mask = 0xFF << (8 - $extraBits);
            if ((ord($clientPton[$fullBytes]) & $mask) !== (ord($subnetPton[$fullBytes]) & $mask)) {
                return false;
            }
        }

        return true;
    }

    private function normalizeIp(string $ip): string
    {
        $ip = trim($ip);
        // Convert IPv4-mapped IPv6 (::ffff:192.168.1.1) to IPv4
        if (str_starts_with($ip, '::ffff:')) {
            $sub = substr($ip, 7);
            if (filter_var($sub, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
                return $sub;
            }
        }
        return $ip;
    }
}

