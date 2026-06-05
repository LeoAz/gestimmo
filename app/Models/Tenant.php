<?php

namespace App\Models;

use Database\Factories\TenantFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tenant extends Model
{
    use HasFactory;

    /** @use HasFactory<TenantFactory> */
    protected $fillable = [
        'first_name',
        'last_name',
        'phone',
        'address',
        'photo',
        'id_card',
    ];

    public function rentals()
    {
        return $this->hasMany(Rental::class);
    }

    public function getFullNameAttribute()
    {
        return "{$this->first_name} {$this->last_name}";
    }
}
