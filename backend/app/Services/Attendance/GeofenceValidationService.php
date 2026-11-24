<?php

namespace App\Services\Attendance;

use App\Models\HospitalGeofence;

class GeofenceValidationService
{
    public const EARTH_RADIUS_METERS = 6371000.0;

    /**
     * Validate employee coordinates against active hospital geofences
     *
     * @param float|string|null $latitude
     * @param float|string|null $longitude
     * @param float|string|null $accuracyMeters
     * @return array{
     *     valid: bool,
     *     geofence: ?HospitalGeofence,
     *     distance_meters: ?float,
     *     accuracy: ?float,
     *     message: string,
     *     failure_reason: ?string
     * }
     */
    public function validateLocation(mixed $latitude, mixed $longitude, mixed $accuracyMeters = null): array
    {
        if ($latitude === null || $longitude === null || !is_numeric($latitude) || !is_numeric($longitude)) {
            return [
                'valid' => false,
                'geofence' => null,
                'distance_meters' => null,
                'accuracy' => null,
                'message' => 'GPS coordinates were not provided or are invalid.',
                'failure_reason' => 'missing_or_invalid_gps',
            ];
        }

        $lat = (float) $latitude;
        $lng = (float) $longitude;
        $acc = ($accuracyMeters !== null && is_numeric($accuracyMeters)) ? (float) $accuracyMeters : null;

        // Check coordinate ranges
        if ($lat < -90.0 || $lat > 90.0 || $lng < -180.0 || $lng > 180.0) {
            return [
                'valid' => false,
                'geofence' => null,
                'distance_meters' => null,
                'accuracy' => $acc,
                'message' => 'GPS coordinates are outside valid geographical bounds.',
                'failure_reason' => 'out_of_bounds_gps',
            ];
        }

        $activeGeofences = HospitalGeofence::where('status', 'active')->get();

        if ($activeGeofences->isEmpty()) {
            return [
                'valid' => false,
                'geofence' => null,
                'distance_meters' => null,
                'accuracy' => $acc,
                'message' => 'No active hospital geofences configured. Please contact HR/IT Administrator.',
                'failure_reason' => 'no_active_geofences',
            ];
        }

        $closestGeofence = null;
        $minDistance = null;
        $matchedGeofence = null;

        foreach ($activeGeofences as $geofence) {
            $dist = $this->calculateDistanceMeters(
                $lat,
                $lng,
                (float) $geofence->latitude,
                (float) $geofence->longitude
            );

            if ($minDistance === null || $dist < $minDistance) {
                $minDistance = $dist;
                $closestGeofence = $geofence;
            }

            // Accuracy check
            $maxAccuracy = $geofence->max_accuracy_meters ?? 80;
            if ($acc !== null && $acc > $maxAccuracy) {
                // Too imprecise
                continue;
            }

            $radius = $geofence->radius_meters ?? 150;
            if ($dist <= $radius) {
                $matchedGeofence = $geofence;
                $minDistance = $dist;
                break;
            }
        }

        // If matched within radius and acceptable accuracy
        if ($matchedGeofence !== null) {
            return [
                'valid' => true,
                'geofence' => $matchedGeofence,
                'distance_meters' => round($minDistance, 2),
                'accuracy' => $acc !== null ? round($acc, 2) : null,
                'message' => "Inside authorized hospital zone: {$matchedGeofence->name} ({$minDistance}m from center).",
                'failure_reason' => null,
            ];
        }

        // If accuracy was too poor
        $targetGeofence = $closestGeofence ?? $activeGeofences->first();
        $targetMaxAcc = $targetGeofence->max_accuracy_meters ?? 80;

        if ($acc !== null && $acc > $targetMaxAcc) {
            return [
                'valid' => false,
                'geofence' => $targetGeofence,
                'distance_meters' => $minDistance !== null ? round($minDistance, 2) : null,
                'accuracy' => round($acc, 2),
                'message' => "GPS accuracy is too low ({$acc}m > {$targetMaxAcc}m threshold). Please move outdoors or near a window and retry.",
                'failure_reason' => 'gps_accuracy_too_low',
            ];
        }

        // Outside geofence radius
        $radius = $targetGeofence->radius_meters ?? 150;
        $roundedDist = $minDistance !== null ? round($minDistance, 2) : 0;

        return [
            'valid' => false,
            'geofence' => $targetGeofence,
            'distance_meters' => $roundedDist,
            'accuracy' => $acc !== null ? round($acc, 2) : null,
            'message' => "Your location is {$roundedDist}m away from {$targetGeofence->name}, which is outside the authorized geofence radius ({$radius}m).",
            'failure_reason' => 'outside_hospital_geofence',
        ];
    }

    /**
     * Compute Haversine distance in meters between two lat/lng coordinates
     */
    public function calculateDistanceMeters(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLng / 2) * sin($dLng / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return self::EARTH_RADIUS_METERS * $c;
    }
}

