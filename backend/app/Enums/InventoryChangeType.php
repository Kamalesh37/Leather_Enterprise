<?php

namespace App\Enums;

enum InventoryChangeType: string
{
    case REPAIR_DEDUCTION = 'REPAIR_DEDUCTION';
    case RESTOCK = 'RESTOCK';
    case ADJUSTMENT = 'ADJUSTMENT';
}
