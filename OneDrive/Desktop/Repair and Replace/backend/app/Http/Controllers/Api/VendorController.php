<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreVendorRequest;
use App\Models\Vendor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VendorController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Vendor::withCount('machines');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('contact_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('tax_id', 'like', "%{$search}%");
            });
        }

        if ($request->filled('category')) {
            $category = $request->category;
            $query->whereJsonContains('machinery_categories', $category);
        }

        $vendors = $query->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => $vendors,
        ]);
    }

    public function store(StoreVendorRequest $request): JsonResponse
    {
        $vendor = Vendor::create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Vendor registered successfully.',
            'data' => $vendor,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $vendor = Vendor::with(['machines.line.floor.block'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $vendor,
        ]);
    }

    public function update(StoreVendorRequest $request, int $id): JsonResponse
    {
        $vendor = Vendor::findOrFail($id);
        $vendor->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Vendor updated successfully.',
            'data' => $vendor,
        ]);
    }
}
