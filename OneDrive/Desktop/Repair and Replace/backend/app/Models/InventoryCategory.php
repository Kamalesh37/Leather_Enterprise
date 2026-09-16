<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InventoryCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_code',
        'name',
        'description',
        'storage_zone',
        'color',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function parts(): HasMany
    {
        return $this->hasMany(Part::class, 'category', 'name');
    }
}
