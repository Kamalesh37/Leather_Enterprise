<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class HealthController extends Controller
{
    public function check(): JsonResponse
    {
        $driver = config('database.default', 'mysql');
        $dbName = config("database.connections.{$driver}.database", 'database');

        try {
            DB::connection()->getPdo();
            $dbStatus = 'CONNECTED';
        } catch (\Exception $e) {
            $dbStatus = 'DISCONNECTED';
        }

        $driverDisplay = match (strtolower($driver)) {
            'mysql' => 'MySQL',
            'sqlite' => 'SQLite',
            'pgsql' => 'PostgreSQL',
            'sqlsrv' => 'SQL Server',
            default => strtoupper($driver),
        };

        return response()->json([
            'success' => true,
            'data' => [
                'status' => 'UP',
                'timestamp' => now()->toISOString(),
                'environment' => config('app.env'),
                'database' => $dbStatus,
                'driver' => $driverDisplay,
                'database_name' => $dbName,
                'framework' => 'Laravel 12 (PHP ' . PHP_VERSION . ')',
            ],
        ]);
    }
}
