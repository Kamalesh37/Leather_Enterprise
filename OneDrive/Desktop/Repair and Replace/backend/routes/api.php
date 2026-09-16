<?php

use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CrewController;
use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\HierarchyController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\MachineController;
use App\Http\Controllers\Api\RepairTicketController;
use App\Http\Controllers\Api\ServiceCatalogController;
use App\Http\Controllers\Api\SpareApprovalController;
use App\Http\Controllers\Api\SpareDispatchController;
use App\Http\Controllers\Api\VendorController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Enterprise Asset Maintenance & Inventory Management Platform APIs
| Leather Manufacturing Enterprise REST Service
|--------------------------------------------------------------------------
*/

Route::get('/health', [HealthController::class, 'check']);

// Authentication & Demo Role Switching
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::get('/switch-role', [AuthController::class, 'switchRole']);
    
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

// Organizational Hierarchy & Master Tables
Route::prefix('hierarchy')->group(function () {
    Route::get('/', [HierarchyController::class, 'index']);
    Route::get('/options', [HierarchyController::class, 'options']);
    Route::get('/summary', [HierarchyController::class, 'dashboardSummary']);

    // Master Tables
    Route::get('/blocks', [HierarchyController::class, 'listBlocks']);
    Route::post('/blocks', [HierarchyController::class, 'storeBlock']);
    Route::put('/blocks/{id}', [HierarchyController::class, 'updateBlock']);
    Route::delete('/blocks/{id}', [HierarchyController::class, 'destroyBlock']);

    Route::get('/floors', [HierarchyController::class, 'listFloors']);
    Route::post('/floors', [HierarchyController::class, 'storeFloor']);
    Route::put('/floors/{id}', [HierarchyController::class, 'updateFloor']);
    Route::delete('/floors/{id}', [HierarchyController::class, 'destroyFloor']);

    Route::get('/lines', [HierarchyController::class, 'listLines']);
    Route::post('/lines', [HierarchyController::class, 'storeLine']);
    Route::put('/lines/{id}', [HierarchyController::class, 'updateLine']);
    Route::delete('/lines/{id}', [HierarchyController::class, 'destroyLine']);

    Route::get('/roles', [HierarchyController::class, 'listRoles']);
    Route::post('/roles', [HierarchyController::class, 'storeRole']);
    Route::put('/roles/{id}', [HierarchyController::class, 'updateRole']);
    Route::delete('/roles/{id}', [HierarchyController::class, 'destroyRole']);
});

// Crew Management & RBAC Matrix
Route::prefix('crew')->group(function () {
    Route::get('/', [CrewController::class, 'index']);
    Route::post('/', [CrewController::class, 'store']);
    Route::put('/{id}', [CrewController::class, 'update']);
    Route::get('/mechanics/active', [CrewController::class, 'mechanics']);
});

// Vendors Catalog
Route::prefix('vendors')->group(function () {
    Route::get('/', [VendorController::class, 'index']);
    Route::post('/', [VendorController::class, 'store']);
    Route::get('/{id}', [VendorController::class, 'show']);
    Route::put('/{id}', [VendorController::class, 'update']);
});

// Machinery & QR Passport
Route::prefix('machines')->group(function () {
    Route::get('/', [MachineController::class, 'index']);
    Route::post('/', [MachineController::class, 'store']);
    Route::get('/qr/{qrHash}', [MachineController::class, 'lookupByQR']);
    Route::get('/{id}', [MachineController::class, 'show']);
    Route::put('/{id}', [MachineController::class, 'update']);
    Route::delete('/{id}', [MachineController::class, 'destroy']);
    Route::get('/{id}/qr-label', [MachineController::class, 'qrLabel']);
});

// Frequent Service Catalog Templates
Route::get('/service-catalog', [ServiceCatalogController::class, 'index']);

// Repair Breakdown & Multi-Tier Workflow
Route::prefix('tickets')->group(function () {
    Route::get('/', [RepairTicketController::class, 'index']);
    Route::post('/', [RepairTicketController::class, 'store']);
    Route::get('/{id}', [RepairTicketController::class, 'show']);
    Route::patch('/{id}/assign-mechanic', [RepairTicketController::class, 'assignMechanic']);
    Route::post('/{id}/diagnosis', [RepairTicketController::class, 'submitDiagnosis']);
    Route::patch('/{id}/complete', [RepairTicketController::class, 'completeRepair']);
    Route::patch('/{id}/sign-off', [RepairTicketController::class, 'signOff']);
});

// Tech Lead Approval Queue
Route::prefix('approvals/spares')->group(function () {
    Route::get('/', [SpareApprovalController::class, 'index']);
    Route::post('/{ticketId}/approve', [SpareApprovalController::class, 'approve']);
});

// Spare Head Dispatch Station (Atomic Deduction with lockForUpdate)
Route::prefix('dispatches/spares')->group(function () {
    Route::get('/', [SpareDispatchController::class, 'index']);
    Route::post('/{ticketId}/dispatch', [SpareDispatchController::class, 'dispatch']);
});

// Inventory Control, Bins, Restock & Audit Ledger
Route::prefix('inventory')->group(function () {
    Route::get('/parts', [InventoryController::class, 'parts']);
    Route::post('/parts', [InventoryController::class, 'createPart']);
    Route::post('/restock', [InventoryController::class, 'restock']);
    Route::post('/adjust', [InventoryController::class, 'adjustStock']);
    Route::get('/audit-logs', [InventoryController::class, 'auditLogs']);
    Route::get('/stats', [InventoryController::class, 'stats']);

    // Inventory Category Master
    Route::get('/categories', [InventoryController::class, 'listCategories']);
    Route::post('/categories', [InventoryController::class, 'storeCategory']);
    Route::put('/categories/{id}', [InventoryController::class, 'updateCategory']);
    Route::delete('/categories/{id}', [InventoryController::class, 'destroyCategory']);

    // Warehouse Storage Zone Master
    Route::get('/storage-zones', [InventoryController::class, 'listStorageZones']);
    Route::post('/storage-zones', [InventoryController::class, 'storeStorageZone']);
    Route::put('/storage-zones/{id}', [InventoryController::class, 'updateStorageZone']);
    Route::delete('/storage-zones/{id}', [InventoryController::class, 'destroyStorageZone']);
});

// Factory Performance & Analytics
Route::prefix('analytics')->group(function () {
    Route::get('/dashboard', [AnalyticsController::class, 'dashboard']);
});
