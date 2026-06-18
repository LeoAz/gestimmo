<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

function actingAsUser()
{
    $user = User::factory()->create();
    test()->actingAs($user);
}

it('returns billing period in revenue report JSON', function () {
    actingAsUser();

    // Seed minimal graph: property, tenant, rental, payment
    $categoryId = DB::table('property_categories')->insertGetId([
        'name' => 'Appartements',
        'slug' => 'appartements',
        'description' => null,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $propertyId = DB::table('properties')->insertGetId([
        'property_category_id' => $categoryId,
        'parent_id' => null,
        'title' => 'Appartement A1',
        'description' => null,
        'address' => 'Rue 1',
        'city' => 'Cotonou',
        'floor_number' => 1,
        'price' => 100000,
        'type' => 'apartment',
        'surface_area' => 80,
        'rooms_count' => 3,
        'bedrooms_count' => 2,
        'bathrooms_count' => 1,
        'living_rooms_count' => 1,
        'balconies_count' => 0,
        'kitchens_count' => 1,
        'has_kitchen' => true,
        'has_solar_panels' => false,
        'has_generator' => false,
        'status' => 'available',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $tenantId = DB::table('tenants')->insertGetId([
        'first_name' => 'Jean',
        'last_name' => 'Dupont',
        'phone' => '0123456789',
        'address' => 'Adresse',
        'photo' => null,
        'id_card' => null,
        'balance' => 0,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $rentalId = DB::table('rentals')->insertGetId([
        'property_id' => $propertyId,
        'tenant_id' => $tenantId,
        'deposit_amount' => 200000,
        'rent_amount' => 100000,
        'start_date' => now()->startOfMonth(),
        'end_date' => now()->addMonths(12)->endOfMonth(),
        'status' => 'active',
        'payment_frequency' => 'monthly',
        'billing_cycle' => 'postpaid',
        'next_payment_date' => now()->addMonth()->startOfMonth(),
        'termination_date' => null,
        'termination_reason' => null,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    DB::table('payments')->insert([
        'rental_id' => $rentalId,
        'amount' => 100000,
        'months_count' => 1,
        'payment_date' => now()->startOfMonth()->addDays(5),
        'payment_method' => 'cash',
        'period_start' => now()->startOfMonth(),
        'period_end' => now()->endOfMonth(),
        'type' => 'rent',
        'status' => 'paid',
        'invoice_number' => Str::uuid()->toString(),
        'is_advance_payment' => false,
        'notes' => null,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $response = test()->getJson('/reports/revenue');

    $response->assertOk();

    $json = $response->json();

    expect($json)->toBeArray()->and($json)->not()->toBeEmpty();
    expect($json[0])->toHaveKeys(['property_title', 'tenant_name', 'payment_date', 'invoice_number', 'amount', 'period_start', 'period_end', 'billing_period']);
});
