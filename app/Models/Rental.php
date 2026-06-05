<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Rental extends Model
{
    use HasFactory;

    protected $fillable = [
        'property_id',
        'tenant_id',
        'deposit_amount',
        'rent_amount',
        'start_date',
        'end_date',
        'status',
        'payment_frequency',
        'next_payment_date',
    ];

    protected $casts = [
        'deposit_amount' => 'decimal:2',
        'rent_amount' => 'decimal:2',
        'start_date' => 'date',
        'end_date' => 'date',
        'next_payment_date' => 'date',
    ];

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        static::created(function (Rental $rental) {
            $rental->property->update(['status' => 'rented']);
        });

        static::updated(function (Rental $rental) {
            if ($rental->isDirty('status')) {
                if ($rental->status !== 'active') {
                    $rental->property->update(['status' => 'available']);
                } else {
                    $rental->property->update(['status' => 'rented']);
                }
            }
        });
    }

    public function property()
    {
        return $this->belongsTo(Property::class);
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }
}
