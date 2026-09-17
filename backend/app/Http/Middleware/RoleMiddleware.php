<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$roles
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        if ($user->role === 'admin' || in_array($user->role, $roles, true)) {
            return $next($request);
        }

        return response()->json([
            'success' => false,
            'message' => 'Unauthorized: Required role not granted.',
            'required_roles' => $roles,
            'current_role' => $user->role,
        ], 403);
    }
}
