<?php

use App\Models\Organization;
use App\Models\Payment;
use App\Models\Property;
use App\Models\PropertyCategory;
use App\Models\Rental;
use App\Models\Tenant;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->category = PropertyCategory::firstWhere('slug', 'appartement') ?? PropertyCategory::factory()->create(['name' => 'Appartement', 'slug' => 'appartement']);
    $this->property = Property::factory()->create(['property_category_id' => $this->category->id]);
    $this->tenant = Tenant::factory()->create();
    $this->rental = Rental::factory()->create([
        'property_id' => $this->property->id,
        'tenant_id' => $this->tenant->id,
    ]);
});

test('payments index page is displayed', function () {
    $this->actingAs($this->user)
        ->get(route('payments.index'))
        ->assertOk();
});

test('invoice page includes organization info', function () {
    $organization = Organization::create([
        'name' => 'Org Test',
        'address' => 'Test Address',
    ]);

    $payment = Payment::create([
        'rental_id' => $this->rental->id,
        'amount' => 100000,
        'payment_date' => now(),
        'period_start' => now(),
        'period_end' => now()->addMonth(),
        'type' => 'rent',
        'status' => 'paid',
        'invoice_number' => 'INV-TEST',
    ]);

    $response = $this->actingAs($this->user)
        ->get(route('payments.invoice', $payment));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('payments/invoice')
            ->has('organization', fn ($json) => $json->where('name', 'Org Test')->etc())
        );
});
