<?php

use App\Models\Property;
use App\Models\PropertyCategory;
use App\Models\Rental;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->categoryVilla = PropertyCategory::factory()->create(['name' => 'Villa', 'slug' => 'villa']);
    $this->categoryBuilding = PropertyCategory::factory()->create(['name' => 'Immeuble', 'slug' => 'immeuble']);
    $this->categoryApartment = PropertyCategory::factory()->create(['name' => 'Appartement', 'slug' => 'appartement']);
});

test('rentals index page is displayed', function () {
    $this->actingAs($this->user)
        ->get(route('rentals.index'))
        ->assertOk();
});

test('rentals create page is displayed', function () {
    $this->actingAs($this->user)
        ->get(route('rentals.create'))
        ->assertOk();
});

test('a rental can be created for a villa', function () {
    Storage::fake('public');

    $villa = Property::factory()->create([
        'property_category_id' => $this->categoryVilla->id,
        'status' => 'available',
    ]);

    $data = [
        'property_id' => $villa->id,
        'tenant_first_name' => 'Jean',
        'tenant_last_name' => 'Dupont',
        'tenant_phone' => '0102030405',
        'tenant_address' => '123 Rue de la Paix',
        'deposit_amount' => 500000,
        'rent_amount' => 100000,
        'payment_frequency' => 'monthly',
        'start_date' => now()->toDateString(),
        'tenant_photo' => UploadedFile::fake()->image('photo.jpg'),
    ];

    $response = $this->actingAs($this->user)
        ->post(route('rentals.store'), $data);

    $response->assertRedirect(route('rentals.index'));

    $this->assertDatabaseHas('rentals', [
        'property_id' => $villa->id,
    ]);

    $this->assertDatabaseHas('tenants', [
        'first_name' => 'Jean',
        'last_name' => 'Dupont',
    ]);

    $this->assertEquals('rented', $villa->fresh()->status);

    $rental = Rental::first();
    $tenant = $rental->tenant;
    Storage::disk('public')->assertExists($tenant->photo);
});

test('a rental can be created for an apartment', function () {
    $building = Property::factory()->create([
        'property_category_id' => $this->categoryBuilding->id,
    ]);

    $apartment = Property::factory()->create([
        'property_category_id' => $this->categoryApartment->id,
        'parent_id' => $building->id,
        'status' => 'available',
    ]);

    $data = [
        'property_id' => $apartment->id,
        'tenant_first_name' => 'Marie',
        'tenant_last_name' => 'Curie',
        'tenant_phone' => '0607080910',
        'deposit_amount' => 300000,
        'rent_amount' => 50000,
        'payment_frequency' => 'monthly',
        'start_date' => now()->toDateString(),
    ];

    $response = $this->actingAs($this->user)
        ->post(route('rentals.store'), $data);

    $response->assertRedirect(route('rentals.index'));

    $this->assertDatabaseHas('rentals', [
        'property_id' => $apartment->id,
    ]);

    $this->assertDatabaseHas('tenants', [
        'first_name' => 'Marie',
    ]);

    $this->assertEquals('rented', $apartment->fresh()->status);
});

test('a building status is updated to rented when all its apartments are rented', function () {
    $building = Property::factory()->create([
        'property_category_id' => $this->categoryBuilding->id,
        'status' => 'available',
    ]);

    $apt1 = Property::factory()->create([
        'property_category_id' => $this->categoryApartment->id,
        'parent_id' => $building->id,
        'status' => 'available',
    ]);

    $apt2 = Property::factory()->create([
        'property_category_id' => $this->categoryApartment->id,
        'parent_id' => $building->id,
        'status' => 'available',
    ]);

    // Louer le premier appartement
    $this->actingAs($this->user)
        ->post(route('rentals.store'), [
            'property_id' => $apt1->id,
            'tenant_first_name' => 'Locataire',
            'tenant_last_name' => '1',
            'tenant_phone' => '111',
            'deposit_amount' => 100,
            'rent_amount' => 50,
            'payment_frequency' => 'monthly',
            'start_date' => now()->toDateString(),
        ]);

    $this->assertEquals('available', $building->fresh()->status);

    // Louer le deuxième appartement
    $this->actingAs($this->user)
        ->post(route('rentals.store'), [
            'property_id' => $apt2->id,
            'tenant_first_name' => 'Locataire',
            'tenant_last_name' => '2',
            'tenant_phone' => '222',
            'deposit_amount' => 100,
            'rent_amount' => 50,
            'payment_frequency' => 'monthly',
            'start_date' => now()->toDateString(),
        ]);

    $this->assertEquals('rented', $building->fresh()->status);
});

test('a building status is updated back to available when one apartment becomes available', function () {
    $building = Property::factory()->create([
        'property_category_id' => $this->categoryBuilding->id,
        'status' => 'available',
    ]);

    $apt1 = Property::factory()->create([
        'property_category_id' => $this->categoryApartment->id,
        'parent_id' => $building->id,
        'status' => 'available',
    ]);

    $tenant = Tenant::create([
        'first_name' => 'Jean',
        'last_name' => 'Dupont',
        'phone' => '0102030405',
    ]);

    $rental = Rental::create([
        'property_id' => $apt1->id,
        'tenant_id' => $tenant->id,
        'deposit_amount' => 500,
        'rent_amount' => 100,
        'payment_frequency' => 'monthly',
        'start_date' => now()->toDateString(),
        'status' => 'active',
    ]);

    $this->assertEquals('rented', $building->fresh()->status);

    // Terminer la location
    $rental->update(['status' => 'completed']);

    $this->assertEquals('available', $apt1->fresh()->status);
    $this->assertEquals('available', $building->fresh()->status);
});

test('tenant history page is displayed', function () {
    $tenant = Tenant::create([
        'first_name' => 'John',
        'last_name' => 'Doe',
        'phone' => '123456789',
    ]);

    $this->actingAs($this->user)
        ->get(route('tenants.show', $tenant))
        ->assertOk()
        ->assertSee('John')
        ->assertSee('Doe');
});

test('rentals can be filtered by search', function () {
    $tenant1 = Tenant::create(['first_name' => 'Alice', 'last_name' => 'Wonderland', 'phone' => '111']);
    $tenant2 = Tenant::create(['first_name' => 'Bob', 'last_name' => 'Builder', 'phone' => '222']);

    $villa = Property::factory()->create(['title' => 'Villa Sunshine', 'property_category_id' => $this->categoryVilla->id]);

    Rental::create([
        'property_id' => $villa->id,
        'tenant_id' => $tenant1->id,
        'deposit_amount' => 100,
        'rent_amount' => 50,
        'payment_frequency' => 'monthly',
        'start_date' => now()->toDateString(),
        'status' => 'active',
    ]);

    $this->actingAs($this->user)
        ->get(route('rentals.index', ['search' => 'Alice']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('rentals', 1)
            ->where('rentals.0.tenant.first_name', 'Alice')
        );

    $this->actingAs($this->user)
        ->get(route('rentals.index', ['search' => 'Sunshine']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('rentals', 1)
            ->where('rentals.0.property.title', 'Villa Sunshine')
        );
});

test('rentals can be filtered by status', function () {
    $tenant = Tenant::create(['first_name' => 'Alice', 'last_name' => 'Wonderland', 'phone' => '111']);
    $villa = Property::factory()->create(['property_category_id' => $this->categoryVilla->id]);

    Rental::create([
        'property_id' => $villa->id,
        'tenant_id' => $tenant->id,
        'deposit_amount' => 100,
        'rent_amount' => 50,
        'payment_frequency' => 'monthly',
        'start_date' => now()->toDateString(),
        'status' => 'active',
    ]);

    Rental::create([
        'property_id' => $villa->id,
        'tenant_id' => $tenant->id,
        'deposit_amount' => 100,
        'rent_amount' => 50,
        'payment_frequency' => 'monthly',
        'start_date' => now()->toDateString(),
        'status' => 'completed',
    ]);

    $this->actingAs($this->user)
        ->get(route('rentals.index', ['status' => 'active']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('rentals', 1)
            ->where('rentals.0.status', 'active')
        );

    $this->actingAs($this->user)
        ->get(route('rentals.index', ['status' => 'completed']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('rentals', 1)
            ->where('rentals.0.status', 'completed')
        );
});
