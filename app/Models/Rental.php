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
        'billing_cycle',
        'next_payment_date',
        'termination_date',
        'termination_reason',
    ];

    protected $casts = [
        'deposit_amount' => 'decimal:2',
        'rent_amount' => 'decimal:2',
        'start_date' => 'date',
        'end_date' => 'date',
        'next_payment_date' => 'date',
        'termination_date' => 'date',
    ];

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        static::created(function (Rental $rental) {
            $rental->property->update(['status' => 'rented']);

            // Si c'est un appartement, mettre à jour le statut du bâtiment parent
            if ($rental->property->parent_id) {
                $parent = $rental->property->parent;
                if ($parent) {
                    // Le bâtiment est considéré comme "loué" si tous ses appartements le sont
                    $allRented = ! $parent->apartments()->where('status', '!=', 'rented')->exists();
                    if ($allRented) {
                        $parent->update(['status' => 'rented']);
                    }
                }
            }
        });

        static::updated(function (Rental $rental) {
            // Si le bien a changé
            if ($rental->isDirty('property_id')) {
                $oldPropertyId = $rental->getOriginal('property_id');
                $oldProperty = Property::find($oldPropertyId);
                if ($oldProperty) {
                    $oldProperty->update(['status' => 'available']);

                    // Si c'était un appartement, mettre à jour le statut du bâtiment parent
                    if ($oldProperty->parent_id) {
                        $parent = $oldProperty->parent;
                        if ($parent) {
                            $anyAvailable = $parent->apartments()->where('status', 'available')->exists();
                            if ($anyAvailable) {
                                $parent->update(['status' => 'available']);
                            }
                        }
                    }
                }

                $newProperty = $rental->property;
                if ($newProperty) {
                    $newProperty->update(['status' => 'rented']);

                    // Si c'est un appartement, mettre à jour le statut du bâtiment parent
                    if ($newProperty->parent_id) {
                        $parent = $newProperty->parent;
                        if ($parent) {
                            $allRented = ! $parent->apartments()->where('status', '!=', 'rented')->exists();
                            if ($allRented) {
                                $parent->update(['status' => 'rented']);
                            }
                        }
                    }
                }
            }

            if ($rental->isDirty('status')) {
                if ($rental->status !== 'active') {
                    $rental->property->update(['status' => 'available']);

                    // Si c'est un appartement, mettre à jour le statut du bâtiment parent
                    if ($rental->property->parent_id) {
                        $parent = $rental->property->parent;
                        if ($parent) {
                            // Si au moins un appartement est disponible, le bâtiment est disponible
                            $anyAvailable = $parent->apartments()->where('status', 'available')->exists();
                            if ($anyAvailable) {
                                $parent->update(['status' => 'available']);
                            }
                        }
                    }
                } else {
                    $rental->property->update(['status' => 'rented']);

                    // Si c'est un appartement, mettre à jour le statut du bâtiment parent
                    if ($rental->property->parent_id) {
                        $parent = $rental->property->parent;
                        if ($parent) {
                            // Le bâtiment est considéré comme "loué" si tous ses appartements le sont
                            $allRented = ! $parent->apartments()->where('status', '!=', 'rented')->exists();
                            if ($allRented) {
                                $parent->update(['status' => 'rented']);
                            }
                        }
                    }
                }
            }
        });

        static::deleted(function (Rental $rental) {
            $rental->property->update(['status' => 'available']);

            // Si c'est un appartement, mettre à jour le statut du bâtiment parent
            if ($rental->property->parent_id) {
                $parent = $rental->property->parent;
                if ($parent) {
                    // Si au moins un appartement est disponible, le bâtiment est disponible
                    $anyAvailable = $parent->apartments()->where('status', 'available')->exists();
                    if ($anyAvailable) {
                        $parent->update(['status' => 'available']);
                    }
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

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }
}
