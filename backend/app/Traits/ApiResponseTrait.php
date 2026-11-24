<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;

trait ApiResponseTrait
{
    protected function successResponse(mixed $data = null, string $message = 'Operation completed successfully.', int $status = 200, ?array $meta = null): JsonResponse
    {
        return ApiResponse::success($data, $message, $status, $meta);
    }

    protected function createdResponse(mixed $data = null, string $message = 'Resource created successfully.'): JsonResponse
    {
        return ApiResponse::created($data, $message);
    }

    protected function deletedResponse(string $message = 'Resource deleted successfully.'): JsonResponse
    {
        return ApiResponse::deleted($message);
    }

    protected function errorResponse(string $message = 'Unable to process this request.', int $status = 400, mixed $errors = null): JsonResponse
    {
        return ApiResponse::error($message, $status, $errors);
    }

    protected function validationResponse(mixed $errors, string $message = 'The given data was invalid.'): JsonResponse
    {
        return ApiResponse::validation($errors, $message);
    }

    protected function paginatedResponse(mixed $paginator, string $message = 'Data retrieved successfully.'): JsonResponse
    {
        return ApiResponse::paginated($paginator, $message);
    }

    protected function unauthorizedResponse(string $message = 'Unauthenticated.'): JsonResponse
    {
        return ApiResponse::unauthorized($message);
    }

    protected function forbiddenResponse(string $message = 'You are not authorized to perform this action.'): JsonResponse
    {
        return ApiResponse::forbidden($message);
    }

    protected function notFoundResponse(string $message = 'The requested resource was not found.'): JsonResponse
    {
        return ApiResponse::notFound($message);
    }
}
