<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'rental_id',
        'invoice_id',
        'amount',
        'months_count',
        'payment_date',
        'payment_method',
        'period_start',
        'period_end',
        'type',
        'status',
        'invoice_number',
        'notes',
        'is_advance_payment',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'payment_date' => 'date',
        'period_start' => 'date',
        'period_end' => 'date',
        'is_advance_payment' => 'boolean',
    ];

    public function rental()
    {
        return $this->belongsTo(Rental::class);
    }

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }
}
