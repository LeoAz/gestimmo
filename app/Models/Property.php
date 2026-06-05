<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Property extends Model
{
    use HasFactory;

    protected $fillable = [
        'property_category_id',
        'parent_id',
        'title',
        'description',
        'address',
        'city',
        'floor_number',
        'price',
        'type',
        'surface_area',
        'rooms_count',
        'bedrooms_count',
        'bathrooms_count',
        'living_rooms_count',
        'has_kitchen',
        'has_solar_panels',
        'has_generator',
        'status',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'surface_area' => 'decimal:2',
        'has_kitchen' => 'boolean',
        'has_solar_panels' => 'boolean',
        'has_generator' => 'boolean',
    ];

    public function category()
    {
        return $this->belongsTo(PropertyCategory::class, 'property_category_id');
    }

    public function parent()
    {
        return $this->belongsTo(Property::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Property::class, 'parent_id');
    }

    public function apartments()
    {
        return $this->children();
    }

    public function rentals()
    {
        return $this->hasMany(Rental::class);
    }

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        static::updated(function (Property $property) {
            // Si c'est un appartement (il a un parent)
            if ($property->parent_id) {
                $parent = $property->parent;
                if ($parent) {
                    $allRented = $parent->apartments()->where('status', '!=', 'rented')->count() === 0;

                    if ($allRented) {
                        $parent->update(['status' => 'rented']);
                    } else {
                        $parent->update(['status' => 'available']);
                    }
                }
            }
        });
    }
}
