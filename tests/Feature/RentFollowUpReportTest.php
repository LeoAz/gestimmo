<?php

use App\Models\Invoice;
use App\Models\Property;
use App\Models\PropertyCategory;
use App\Models\Rental;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;

uses(RefreshDatabase::class);

function actingAsRentFollowUpUser()
{
    $user = User::factory()->create();
    test()->actingAs($user);
}

it('groups rent invoices by tenant and billing month', function () {
    actingAsRentFollowUpUser();

    $category = PropertyCategory::create([
        'name' => 'Appartements',
        'slug' => 'appartements',
    ]);

    $building = Property::create([
        'property_category_id' => $category->id,
        'title' => 'Immeuble Résidence',
        'type' => 'building',
        'status' => 'available',
    ]);

    $apartment = Property::create([
        'property_category_id' => $category->id,
        'parent_id' => $building->id,
        'title' => 'Appt 101',
        'type' => 'apartment',
        'status' => 'rented',
        'price' => 150000,
    ]);

    $tenant = Tenant::create([
        'first_name' => 'Alice',
        'last_name' => 'Wonder',
        'phone' => '123456',
        'address' => 'Some address',
    ]);

    $rental = Rental::create([
        'property_id' => $apartment->id,
        'tenant_id' => $tenant->id,
        'rent_amount' => 150000,
        'start_date' => Carbon::create(2025, 9, 1),
        'status' => 'active',
    ]);

    $septemberInvoice = Invoice::create([
        'rental_id' => $rental->id,
        'invoice_number' => 'INV-SEP-1',
        'date' => Carbon::create(2025, 9, 1),
        'type' => 'Loyer',
        'amount_ht' => 150000,
        'total_amount' => 150000,
        'status' => 'paid',
    ]);
    $septemberInvoice->items()->create([
        'designation' => 'Loyer septembre',
        'period' => 'septembre 2025',
        'months_count' => 1,
        'total' => 150000,
    ]);

    $secondSeptemberInvoice = Invoice::create([
        'rental_id' => $rental->id,
        'invoice_number' => 'INV-SEP-2',
        'date' => Carbon::create(2025, 9, 10),
        'type' => 'Loyer',
        'amount_ht' => 50000,
        'total_amount' => 50000,
        'status' => 'paid',
    ]);
    $secondSeptemberInvoice->items()->create([
        'designation' => 'Complément de loyer',
        'period' => 'septembre 2025',
        'months_count' => 1,
        'total' => 50000,
    ]);

    $depositInvoice = Invoice::create([
        'rental_id' => $rental->id,
        'invoice_number' => 'INV-CAUTION',
        'date' => Carbon::create(2025, 9, 1),
        'type' => 'Caution',
        'amount_ht' => 300000,
        'total_amount' => 300000,
        'status' => 'pending',
    ]);
    $depositInvoice->items()->create([
        'designation' => 'Caution',
        'period' => 'septembre 2025',
        'months_count' => 1,
        'total' => 300000,
    ]);

    $secondApartment = Property::create([
        'property_category_id' => $category->id,
        'parent_id' => $building->id,
        'title' => 'Appt 102',
        'type' => 'apartment',
        'status' => 'rented',
        'price' => 100000,
    ]);
    $secondRental = Rental::create([
        'property_id' => $secondApartment->id,
        'tenant_id' => $tenant->id,
        'rent_amount' => 100000,
        'start_date' => Carbon::create(2025, 9, 1),
        'status' => 'active',
    ]);
    $octoberInvoice = Invoice::create([
        'rental_id' => $secondRental->id,
        'invoice_number' => 'INV-OCT-1',
        'date' => Carbon::create(2025, 10, 1),
        'type' => 'Loyer',
        'amount_ht' => 100000,
        'total_amount' => 100000,
        'status' => 'pending',
    ]);
    $octoberInvoice->items()->create([
        'designation' => 'Loyer octobre',
        'period' => 'octobre 2025',
        'months_count' => 1,
        'total' => 100000,
    ]);

    $quarterlyInvoice = Invoice::create([
        'rental_id' => $rental->id,
        'invoice_number' => 'INV-TRIMESTRIEL',
        'date' => Carbon::create(2025, 11, 1),
        'type' => 'Loyer',
        'amount_ht' => 450000,
        'total_amount' => 450000,
        'status' => 'pending',
    ]);
    $quarterlyInvoice->items()->create([
        'designation' => 'Loyer trimestriel',
        'period' => 'NOV-DEC-JAN 2025',
        'months_count' => 3,
        'total' => 450000,
    ]);

    $response = test()->getJson('/reports/rent-follow-up?start_date=2025-09-01&end_date=2026-03-31');

    $response->assertOk();
    $data = $response->json();

    expect($data)->toBeArray();
    expect($data)->toHaveCount(1);
    expect($data[0]['tenant_name'])->toBe('Alice Wonder');
    expect($data[0]['property_title'])->toBe('Immeuble Résidence / Appt 101 • Immeuble Résidence / Appt 102');
    expect($data[0]['months'])->toHaveKey('2025-09');
    expect($data[0]['months']['2025-09']['amount'])->toBe(200000);
    expect($data[0]['months']['2025-09']['label'])->toContain('200 000');
    expect($data[0]['months']['2025-09']['status'])->toBe('paid');
    expect($data[0]['months']['2025-10']['amount'])->toBe(100000);
    expect($data[0]['months']['2025-10']['status'])->toBe('unpaid');
    expect($data[0]['months']['2025-11']['amount'])->toBe(150000);
    expect($data[0]['months']['2025-12']['amount'])->toBe(150000);
    expect($data[0]['months']['2026-01']['amount'])->toBe(150000);
    expect($data[0]['months']['2026-02']['amount'])->toBe(250000);
    expect($data[0]['months']['2026-02']['status'])->toBe('unpaid');

    test()->get('/reports/rent-follow-up?start_date=2025-09-01&end_date=2026-03-31&export=pdf')
        ->assertOk()
        ->assertHeader('content-type', 'application/pdf');

    test()->get('/reports/rent-follow-up?start_date=2025-09-01&end_date=2026-03-31&export=excel')
        ->assertOk()
        ->assertDownload();
});

it('keeps the former tenant visible alongside the new tenant on the same unit', function () {
    actingAsRentFollowUpUser();

    $category = PropertyCategory::create([
        'name' => 'Appartements',
        'slug' => 'appartements',
    ]);

    $building = Property::create([
        'property_category_id' => $category->id,
        'title' => 'Immeuble Central',
        'type' => 'building',
        'status' => 'available',
    ]);

    $apartment = Property::create([
        'property_category_id' => $category->id,
        'parent_id' => $building->id,
        'title' => 'Appt 27',
        'type' => 'apartment',
        'status' => 'rented',
        'price' => 150000,
    ]);

    $formerTenant = Tenant::create([
        'first_name' => 'Zara',
        'last_name' => 'Ancien',
        'phone' => '111111',
        'address' => 'Some address',
    ]);

    $newTenant = Tenant::create([
        'first_name' => 'Amina',
        'last_name' => 'Nouveau',
        'phone' => '222222',
        'address' => 'Some address',
    ]);

    Rental::create([
        'property_id' => $apartment->id,
        'tenant_id' => $formerTenant->id,
        'rent_amount' => 150000,
        'start_date' => Carbon::create(2025, 9, 1),
        'end_date' => Carbon::create(2025, 12, 31),
        'status' => 'completed',
    ]);

    Rental::create([
        'property_id' => $apartment->id,
        'tenant_id' => $newTenant->id,
        'rent_amount' => 160000,
        'start_date' => Carbon::create(2026, 1, 1),
        'status' => 'active',
    ]);

    $response = test()->getJson('/reports/rent-follow-up?start_date=2025-09-01&end_date=2026-02-28');

    $response->assertOk();
    $data = $response->json();

    expect($data)->toHaveCount(2);
    expect(collect($data)->pluck('tenant_name')->all())->toBe(['Zara Ancien', 'Amina Nouveau']);
    expect($data[1]['months']['2026-01']['amount'])->toBe(160000);
    expect($data[1]['months']['2026-01']['status'])->toBe('unpaid');
});
