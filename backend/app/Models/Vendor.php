<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Vendor extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'contact_name',
        'email',
        'phone',
        'tax_id',
        'address',
        'machinery_categories',
        'rating',
    ];

    protected $casts = [
        'machinery_categories' => 'array',
        'rating' => 'decimal:2',
    ];

    public function machines(): HasMany
    {
        return $this->hasMany(Machine::class);
    }
}
