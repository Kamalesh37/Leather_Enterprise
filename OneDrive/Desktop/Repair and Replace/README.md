# Enterprise Repair & Inventory Management Platform

An enterprise-grade repair ticketing, component inventory, and hardware tracking platform converted to **React (Vite + TypeScript)** and **Laravel 12 (PHP 8.2)** with **Atomic Stock Deductions** and **Cryptographic QR Passports**.

---

## 🏛️ System Architecture

```
Repair and Replace/
├── 📁 backend/                       # Laravel 12 API Backend (PHP 8.2)
│   ├── app/
│   │   ├── Enums/                    # TicketStatus, ServiceType, InventoryChangeType
│   │   ├── Http/Controllers/Api/     # ProductController, TicketController, InventoryController, HealthController
│   │   ├── Models/                   # Product, ServiceTicket, Part, TicketPartUsed, InventoryAuditLog
│   │   └── Services/                 # InventoryService (atomic transactions), QRService, ProductService, TicketService
│   ├── database/
│   │   ├── migrations/               # SQLite / MySQL schema definitions
│   │   └── seeders/DatabaseSeeder.php# Seed hardware parts, devices & tickets
│   └── routes/api.php                # REST API endpoints
│
├── 📁 frontend/                      # React 19 Frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── api/client.ts             # Typed API client connecting to Laravel backend
│   │   ├── components/
│   │   │   ├── Dashboard/            # Real-time KPIs & service pipeline distribution
│   │   │   ├── QRPassport/           # Camera scanner, product intake & service history
│   │   │   ├── Repairs/              # Kanban board, workbench drawer, atomic BOM & invoice
│   │   │   ├── Inventory/            # Parts catalog, stock health pills & restock
│   │   │   ├── AuditLedger/          # Immutable movement audit trail
│   │   │   └── Common/               # Sidebar, Navbar, Modal & Toast notifications
│   │   └── styles/main.css           # Modern dark slate design system & print styles
│   └── vite.config.ts                # Vite config with API proxy to port 8000
│
├── package.json                      # Unified root management scripts
└── README.md
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **PHP 8.2+** with `pdo_sqlite` or `pdo_mysql`
- **Composer 2.x**
- **Node.js 18+** & **npm**

### 2. Start Both Frontend & Backend Concurrently
From the root directory:

```bash
npm run dev
```

- **React Frontend**: [http://localhost:5173](http://localhost:5173)
- **Laravel Backend API**: [http://localhost:8000](http://localhost:8000)

### 3. Individual Service Commands

#### Backend Only (Laravel)
```bash
cd backend
php artisan serve --port=8000
```

#### Frontend Only (React Vite)
```bash
cd frontend
npm run dev
```

#### Re-seed Database
```bash
cd backend
php artisan migrate:fresh --seed
```

---

## 🛡️ Key Features

1. **Atomic Bill of Materials (BOM) Deduction**:
   - Implemented via `DB::transaction` with row-level locks (`lockForUpdate()`) in `InventoryService.php`.
   - Prevents race conditions during simultaneous multi-part allocations and rolls back completely if any part lacks stock.

2. **Cryptographic SHA-256 QR Hardware Passports**:
   - Hardware serial numbers and model tags generate deterministic 64-character SHA-256 hashes.
   - Built-in camera scanner, image upload scanner, and printable QR label generator.

3. **Repairs Kanban & Diagnostics Workbench**:
   - 6-stage workflow stepper (`INTAKE`, `DIAGNOSING`, `WAITING_PARTS`, `IN_PROGRESS`, `COMPLETED`, `DELIVERED`).
   - Printable official service work order and invoice receipt.

4. **Immutable Audit Ledger**:
   - All part deductions, restocks, and adjustments record timestamped before/after balance records.
