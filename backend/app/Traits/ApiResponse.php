<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;

class ApiResponse
{
    /**
     * Standard success response (200 OK)
     */
    public static function success(mixed $data = null, string $message = 'Operation completed successfully.', int $status = 200, ?array $meta = null): JsonResponse
    {
        $response = [
            'success' => true,
            'message' => $message,
            'data' => $data,
        ];

        if ($meta !== null) {
            $response['meta'] = $meta;
        }

        return response()->json($response, $status);
    }

    /**
     * Standard create response (201 Created)
     */
    public static function created(mixed $data = null, string $message = 'Resource created successfully.'): JsonResponse
    {
        return self::success($data, $message, 201);
    }

    /**
     * Standard delete response (200 OK with data: null)
     */
    public static function deleted(string $message = 'Resource deleted successfully.'): JsonResponse
    {
        return self::success(null, $message, 200);
    }

    /**
     * Standard paginated response
     */
    public static function paginated(mixed $paginator, string $message = 'Data retrieved successfully.'): JsonResponse
    {
        $items = method_exists($paginator, 'items') ? $paginator->items() : (array) $paginator;
        $currentPage = method_exists($paginator, 'currentPage') ? (int) $paginator->currentPage() : 1;
        $lastPage = method_exists($paginator, 'lastPage') ? (int) $paginator->lastPage() : 1;
        $perPage = method_exists($paginator, 'perPage') ? (int) $paginator->perPage() : count($items);
        $total = method_exists($paginator, 'total') ? (int) $paginator->total() : count($items);

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $items,
            'meta' => [
                'current_page' => $currentPage,
                'last_page' => $lastPage,
                'per_page' => $perPage,
                'total' => $total,
            ],
        ], 200);
    }

    /**
     * Standard error response
     */
    public static function error(string $message = 'Unable to process this request.', int $status = 400, mixed $errors = null): JsonResponse
    {
        $response = [
            'success' => false,
            'message' => $message,
            'data' => null,
        ];

        if ($errors !== null) {
            $response['errors'] = $errors;
        }

        return response()->json($response, $status);
    }

    /**
     * Standard validation error response (422 Unprocessable Entity)
     */
    public static function validation(mixed $errors, string $message = 'The given data was invalid.'): JsonResponse
    {
        return self::error($message, 422, $errors);
    }

    /**
     * Standard unauthenticated error response (401 Unauthorized)
     */
    public static function unauthorized(string $message = 'Unauthenticated.'): JsonResponse
    {
        return self::error($message, 401);
    }

    /**
     * Standard forbidden error response (403 Forbidden)
     */
    public static function forbidden(string $message = 'You are not authorized to perform this action.'): JsonResponse
    {
        return self::error($message, 403);
    }

    /**
     * Standard not found error response (404 Not Found)
     */
    public static function notFound(string $message = 'The requested resource was not found.'): JsonResponse
    {
        return self::error($message, 404);
    }

    /**
     * Standard server error response (500 Internal Server Error)
     */
    public static function serverError(string $message = 'An unexpected server error occurred.'): JsonResponse
    {
        return self::error($message, 500);
    }
}
