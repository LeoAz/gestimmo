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

    public static function generateInvoiceNumber(?\DateTimeInterface $date = null): string
    {
        $date = $date ?: now();
        $month = $date->format('m');
        $year = $date->format('Y');

        $query = self::whereYear('date', $year)
            ->whereMonth('date', $month)
            ->where('invoice_number', 'like', "%/DP/$month/$year");

        if (config('database.default') === 'sqlite') {
            $lastInvoice = $query->orderBy('invoice_number', 'desc')->first();
        } else {
            $lastInvoice = $query->orderByRaw('CAST(SUBSTRING_INDEX(invoice_number, "/", 1) AS UNSIGNED) DESC')
                ->first();
        }

        $number = 1;
        if ($lastInvoice) {
            preg_match('/^(\d+)/', $lastInvoice->invoice_number, $matches);
            if (isset($matches[1])) {
                $number = (int) $matches[1] + 1;
            }
        }

        return sprintf('%04d', $number)."/DP/$month/$year";
    }
}
