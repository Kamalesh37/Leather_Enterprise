<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;

class InsufficientStockException extends Exception
{
    public array $details;
    public string $errorCode;

    public function __construct(
        string $message = 'Insufficient stock for one or more requested parts.',
        array $details = [],
        string $errorCode = 'INSUFFICIENT_STOCK',
        int $code = 409,
        ?\Throwable $previous = null
    ) {
        parent::__construct($message, $code, $previous);
        $this->details = $details;
        $this->errorCode = $errorCode;
    }

    public function getDetails(): array
    {
        return $this->details;
    }

    public function getErrorCode(): string
    {
        return $this->errorCode;
    }

    /**
     * Render the exception as an HTTP response.
     */
    public function render(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'code' => $this->errorCode,
            'message' => $this->getMessage(),
            'details' => $this->details,
        ], $this->getCode() ?: 409);
    }
}
