<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    protected $fillable = [
        'property_id',
        'date',
        'provider',
        'total_amount',
        'reference',
        'notes',
    ];

    protected $casts = [
        'date' => 'date',
        'total_amount' => 'decimal:2',
    ];

    public function property()
    {
        return $this->belongsTo(Property::class);
    }

    public function items()
    {
        return $this->hasMany(ExpenseItem::class);
    }
}
