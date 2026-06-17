<?php

use App\Models\Property;
use App\Models\Rental;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('a rental can be terminated', function () {
    $user = User::factory()->create();
    $property = Property::factory()->create(['status' => 'rented']);
    $tenant = Tenant::factory()->create();
    $rental = Rental::factory()->create([
        'property_id' => $property->id,
        'tenant_id' => $tenant->id,
        'status' => 'active',
    ]);

    $response = $this->actingAs($user)
        ->post(route('rentals.terminate', $rental), [
            'termination_date' => now()->format('Y-m-d'),
            'termination_reason' => 'Tenant moving out',
        ]);

    $response->assertRedirect();
    $rental->refresh();

    expect($rental->status)->toBe('completed');
    expect($rental->termination_date->format('Y-m-d'))->toBe(now()->format('Y-m-d'));
    expect($rental->termination_reason)->toBe('Tenant moving out');

    // Property should be available again
    expect($rental->property->status)->toBe('available');
});

test('a terminated rental keeps tenant and property association for history', function () {
    $user = User::factory()->create();
    $property = Property::factory()->create();
    $tenant = Tenant::factory()->create();
    $rental = Rental::factory()->create([
        'property_id' => $property->id,
        'tenant_id' => $tenant->id,
        'status' => 'active',
    ]);

    $this->actingAs($user)
        ->post(route('rentals.terminate', $rental), [
            'termination_date' => now()->format('Y-m-d'),
            'termination_reason' => 'End of contract',
        ]);

    $rental->refresh();

    // Associations should still exist
    expect($rental->tenant_id)->toBe($tenant->id);
    expect($rental->property_id)->toBe($property->id);

    // Tenant should still exist
    $this->assertDatabaseHas('tenants', ['id' => $tenant->id]);
});

test('property status is updated correctly when rental is terminated', function () {
    $user = User::factory()->create();
    $property = Property::factory()->create(['status' => 'rented']);
    $rental = Rental::factory()->create([
        'property_id' => $property->id,
        'status' => 'active',
    ]);

    $this->actingAs($user)
        ->post(route('rentals.terminate', $rental), [
            'termination_date' => now()->format('Y-m-d'),
            'termination_reason' => 'Reason',
        ]);

    expect($property->refresh()->status)->toBe('available');
});
