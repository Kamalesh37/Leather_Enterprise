<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ServiceCatalog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceCatalogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ServiceCatalog::query();

        if ($request->filled('category')) {
            $query->where('machine_category', $request->category);
        }

        $services = $query->orderBy('machine_category')->orderBy('title')->get();

        return response()->json([
            'success' => true,
            'data' => $services,
        ]);
    }
}
