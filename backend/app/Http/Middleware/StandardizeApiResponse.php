<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class StandardizeApiResponse
{
    /**
     * Recognized domain entity keys that controllers wrap alongside a status message
     */
    protected const DOMAIN_ENTITY_KEYS = [
        'employee',
        'user',
        'location',
        'department',
        'position',
        'announcement',
        'vacancy',
        'candidate',
        'interview',
        'review',
        'program',
        'enrollment',
        'leave_type',
        'leave_request',
        'payroll',
        'structure',
        'salary',
        'contact',
        'education',
        'experience',
        'document',
        'assignment',
        'record',
        'shift',
    ];

    /**
     * Handle an incoming request and standardize JSON responses.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (!$request->is('api/*') && !$request->expectsJson()) {
            return $response;
        }

        if (!$response instanceof JsonResponse) {
            return $response;
        }

        $data = $response->getData(true);
        $status = $response->getStatusCode();

        // 1. If already explicitly formatted with boolean 'success'
        if (is_array($data) && array_key_exists('success', $data) && is_bool($data['success'])) {
            // Ensure data key exists and is null for failed responses or delete operations
            if (!array_key_exists('data', $data) || ($request->isMethod('DELETE') && $data['data'] === [])) {
                $data['data'] = $data['success'] ? ($request->isMethod('DELETE') ? null : $data) : null;
            }
            if ($data['success'] === false && $data['data'] !== null) {
                $data['data'] = null;
            }
            $response->setData($data);
            return $response;
        }

        // 2. Handle DELETE operations (Contract: success: true, message, data: null, status 200)
        if ($request->isMethod('DELETE') && $status >= 200 && $status < 300) {
            $message = 'Resource deleted successfully.';
            if (is_array($data) && isset($data['message']) && is_string($data['message'])) {
                $message = $data['message'];
            }

            $enveloped = [
                'success' => true,
                'message' => $message,
                'data' => null,
            ];

            $response->setData($enveloped);
            return $response;
        }

        // 3. Handle Laravel LengthAwarePaginator structure
        if (
            is_array($data) &&
            array_key_exists('data', $data) &&
            array_key_exists('current_page', $data) &&
            array_key_exists('total', $data) &&
            array_key_exists('last_page', $data)
        ) {
            $enveloped = [
                'success' => true,
                'message' => 'Data retrieved successfully.',
                'data' => $data['data'],
                'meta' => [
                    'current_page' => (int) $data['current_page'],
                    'last_page' => (int) $data['last_page'],
                    'per_page' => (int) ($data['per_page'] ?? count($data['data'])),
                    'total' => (int) $data['total'],
                ],
            ];
            $response->setData($enveloped);
            return $response;
        }

        // 4. Handle Successful Responses (HTTP 200..299)
        if ($status >= 200 && $status < 300) {
            $message = 'Operation completed successfully.';
            $payload = $data;

            if (is_array($data)) {
                $hasMessage = isset($data['message']) && is_string($data['message']);
                if ($hasMessage) {
                    $message = $data['message'];
                }

                // If data is a wrapper containing an entity key alongside message (e.g. ['message' => '...', 'employee' => $employee])
                // or a wrapper array without its own primary entity attributes
                $isWrapper = $hasMessage || (!isset($data['id']) && count($data) <= 3);
                if ($isWrapper) {
                    foreach (self::DOMAIN_ENTITY_KEYS as $entityKey) {
                        if (array_key_exists($entityKey, $data)) {
                            $payload = $data[$entityKey];
                            break;
                        }
                    }
                }

                // If data has only ['message' => '...'] without an entity
                if ($payload === $data && count($data) === 1 && isset($data['message'])) {
                    $payload = null;
                }
            }

            $enveloped = [
                'success' => true,
                'message' => $message,
                'data' => $payload,
            ];

            // Retain top-level properties for associative arrays to guarantee backward compatibility with existing tests
            if (is_array($data) && !array_is_list($data)) {
                foreach ($data as $key => $val) {
                    if (!array_key_exists($key, $enveloped)) {
                        $enveloped[$key] = $val;
                    }
                }
            }

            $response->setData($enveloped);
            return $response;
        }

        // 5. Handle Error Responses (HTTP >= 400)
        $errorMessage = 'Unable to process this request.';
        if (is_array($data) && isset($data['message']) && is_string($data['message'])) {
            $errorMessage = $data['message'];
        }

        $enveloped = [
            'success' => false,
            'message' => $errorMessage,
            'data' => null,
        ];

        if (is_array($data)) {
            if (isset($data['errors'])) {
                $enveloped['errors'] = $data['errors'];
            }
            foreach ($data as $key => $val) {
                if (!array_key_exists($key, $enveloped)) {
                    $enveloped[$key] = $val;
                }
            }
        }

        $response->setData($enveloped);
        return $response;
    }
}
