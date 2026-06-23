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

    // Test with a different month (Should NOT reset)
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

    $expected3 = '0003/DP/'.$otherDate->format('m/Y');
    expect($invoice3->invoice_number)->toBe($expected3);

    // Test with a different year (Should reset)
    $nextYearDate = now()->addYear();
    $invoice4 = Invoice::create([
        'rental_id' => $rental->id,
        'invoice_number' => Invoice::generateInvoiceNumber($nextYearDate),
        'date' => $nextYearDate,
        'type' => 'Loyer',
        'amount_ht' => 1000,
        'total_amount' => 1000,
        'status' => 'pending',
    ]);

    $expected4 = '0001/DP/'.$nextYearDate->format('m/Y');
    expect($invoice4->invoice_number)->toBe($expected4);
});

test('it formats invoice numbers with leading zeros up to 9999', function () {
    $category = PropertyCategory::firstOrCreate(['slug' => 'appartement'], ['name' => 'Appartement']);
    $property = Property::create([
        'property_category_id' => $category->id,
        'title' => 'Test Property',
        'address' => '123 Test St',
        'type' => 'apartment',
        'status' => 'available',
    ]);
    $tenant = Tenant::create(['first_name' => 'John', 'last_name' => 'Doe', 'email' => 'john2@example.com', 'phone' => '123456789']);
    $rental = Rental::create(['property_id' => $property->id, 'tenant_id' => $tenant->id, 'rent_amount' => 1000, 'start_date' => now(), 'status' => 'active']);

    $date = now();

    // Create 9 invoices to reach 0010
    for ($i = 1; $i <= 10; $i++) {
        $invoice = Invoice::create([
            'rental_id' => $rental->id,
            'invoice_number' => Invoice::generateInvoiceNumber($date),
            'date' => $date,
            'type' => 'Loyer',
            'amount_ht' => 1000,
            'total_amount' => 1000,
            'status' => 'pending',
        ]);

        $expectedNumber = str_pad($i, 4, '0', STR_PAD_LEFT).'/DP/'.$date->format('m/Y');
        expect($invoice->invoice_number)->toBe($expectedNumber);
    }
});
