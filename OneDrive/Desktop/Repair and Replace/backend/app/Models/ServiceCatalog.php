<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ServiceCatalog extends Model
{
    use HasFactory;

    protected $table = 'service_catalog';

    protected $fillable = [
        'machine_category',
        'title',
        'description',
        'estimated_duration_minutes',
        'recommended_frequency_days',
        'standard_procedures',
    ];

    protected $casts = [
        'standard_procedures' => 'array',
        'estimated_duration_minutes' => 'integer',
        'recommended_frequency_days' => 'integer',
    ];
}
