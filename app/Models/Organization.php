<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Organization extends Model
{
    protected $fillable = [
        'name',
        'address',
        'phone',
        'email',
        'website',
        'logo',
        'tax_number',
        'registration_number',
        'bank_details',
        'city',
        'country',
    ];
}
