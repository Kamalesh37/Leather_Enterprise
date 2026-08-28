<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class HealthController extends Controller
{
    public function check(): JsonResponse
    {
        try {
            DB::connection()->getPdo();
            $dbStatus = 'CONNECTED';
        } catch (\Exception $e) {
            $dbStatus = 'DISCONNECTED';
        }

        return response()->json([
            'success' => true,
            'data' => [
                'status' => 'UP',
                'timestamp' => now()->toISOString(),
                'environment' => config('app.env'),
                'database' => $dbStatus,
                'framework' => 'Laravel 12 (PHP ' . PHP_VERSION . ')',
            ],
        ]);
    }
}
