<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PermissionMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  $permissionKey
     */
    public function handle(Request $request, Closure $next, string $permissionKey): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        if ($user->hasPermission($permissionKey)) {
            return $next($request);
        }

        return response()->json([
            'success' => false,
            'message' => "Unauthorized: Missing required permission [{$permissionKey}].",
        ], 403);
    }
}
