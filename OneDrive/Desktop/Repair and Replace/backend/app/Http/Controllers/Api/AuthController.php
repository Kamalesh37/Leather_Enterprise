<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::with(['permission', 'block', 'floor', 'line'])
            ->where('email', $request->email)
            ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid email or password.',
            ], 401);
        }

        if ($user->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Your account is deactivated. Please contact an Administrator.',
            ], 403);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login successful.',
            'data' => [
                'user' => $user,
                'token' => $token,
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->load(['permission', 'block', 'floor', 'line']);

        return response()->json([
            'success' => true,
            'data' => $user,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully.',
        ]);
    }

    /**
     * Demo role switcher to easily test all 7 roles
     */
    public function switchRole(Request $request): JsonResponse
    {
        $role = $request->query('role', 'admin');

        $user = User::with(['permission', 'block', 'floor', 'line'])
            ->where('role', $role)
            ->first();

        if (!$user) {
            // fallback to first user
            $user = User::with(['permission', 'block', 'floor', 'line'])->first();
        }

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'No user found for role.',
            ], 404);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => "Switched to {$user->name} ({$user->role})",
            'data' => [
                'user' => $user,
                'token' => $token,
            ],
        ]);
    }
}
