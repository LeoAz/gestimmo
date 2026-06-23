<?php

use App\Models\Invoice;
use App\Models\Property;
use App\Models\PropertyCategory;
use App\Models\Rental;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('it generates unique invoice numbers', function () {
    // Setup basic data
    $category = PropertyCategory::firstOrCreate(
        ['slug' => 'appartement'],
        ['name' => 'Appartement']
    );

    $property = Property::create([
        'property_category_id' => $category->id,
        'title' => 'Test Property',
        'address' => '123 Test St',
        'type' => 'apartment',
        'status' => 'available',
    ]);

    $tenant = Tenant::create([
        'first_name' => 'John',
        'last_name' => 'Doe',
        'email' => 'john@example.com',
        'phone' => '123456789',
    ]);

    $rental = Rental::create([
        'property_id' => $property->id,
        'tenant_id' => $tenant->id,
        'rent_amount' => 1000,
        'start_date' => now(),
        'status' => 'active',
    ]);

    // Create first invoice
    $date = now();
    $invoice1 = Invoice::create([
        'rental_id' => $rental->id,
        'invoice_number' => Invoice::generateInvoiceNumber($date),
        'date' => $date,
        'type' => 'Loyer',
        'amount_ht' => 1000,
        'total_amount' => 1000,
        'status' => 'pending',
    ]);

    $expected1 = '0001/DP/'.$date->format('m/Y');
    expect($invoice1->invoice_number)->toBe($expected1);

    // Create second invoice
    $invoice2 = Invoice::create([
        'rental_id' => $rental->id,
        'invoice_number' => Invoice::generateInvoiceNumber($date),
        'date' => $date,
        'type' => 'Loyer',
        'amount_ht' => 1000,
        'total_amount' => 1000,
        'status' => 'pending',
    ]);

    $expected2 = '0002/DP/'.$date->format('m/Y');
    expect($invoice2->invoice_number)->toBe($expected2);

    // Test with a different month
    $otherDate = now()->addMonth();
    $invoice3 = Invoice::create([
        'rental_id' => $rental->id,
        'invoice_number' => Invoice::generateInvoiceNumber($otherDate),
        'date' => $otherDate,
        'type' => 'Loyer',
        'amount_ht' => 1000,
        'total_amount' => 1000,
        'status' => 'pending',
    ]);

    $expected3 = '0001/DP/'.$otherDate->format('m/Y');
    expect($invoice3->invoice_number)->toBe($expected3);
});
