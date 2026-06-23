<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'rental_id',
        'invoice_number',
        'date',
        'due_date',
        'type',
        'amount_ht',
        'tax_amount',
        'total_amount',
        'status',
        'notes',
    ];

    protected $casts = [
        'date' => 'date',
        'due_date' => 'date',
        'amount_ht' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
    ];

    public function rental()
    {
        return $this->belongsTo(Rental::class);
    }

    public function items()
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public static function generateInvoiceNumber(): string
    {
        $lastInvoice = self::whereYear('date', now()->year)
            ->whereMonth('date', now()->month)
            ->orderBy('id', 'desc')
            ->first();

        $number = 1;
        if ($lastInvoice) {
            // Extraire le numéro avant /DP/
            preg_match('/^(\d+)/', $lastInvoice->invoice_number, $matches);
            if (isset($matches[1])) {
                $number = (int) $matches[1] + 1;
            }
        }

        return sprintf('%04d', $number).'/DP/'.now()->format('m/Y');
    }
}
