<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExpenseItem extends Model
{
    protected $fillable = [
        'expense_id',
        'description',
        'quantity',
        'unit_price',
        'total',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    public function expense()
    {
        return $this->belongsTo(Expense::class);
    }
}
