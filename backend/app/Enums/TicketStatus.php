<?php

namespace App\Enums;

enum TicketStatus: string
{
    case INTAKE = 'INTAKE';
    case DIAGNOSING = 'DIAGNOSING';
    case WAITING_PARTS = 'WAITING_PARTS';
    case IN_PROGRESS = 'IN_PROGRESS';
    case COMPLETED = 'COMPLETED';
    case DELIVERED = 'DELIVERED';
}
