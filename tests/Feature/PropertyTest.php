<?php

use App\Models\Property;
use App\Models\PropertyCategory;
use App\Models\User;

test('peut lister les biens immobiliers', function () {
    $user = User::factory()->create();
    $category = PropertyCategory::factory()->create(['name' => 'Villa', 'slug' => 'villa']);
    Property::factory()->create(['property_category_id' => $category->id, 'title' => 'Villa Test']);

    $response = $this->actingAs($user)->get(route('properties.index'));

    $response->assertStatus(200);
    $response->assertSee('Villa Test');
});

test('peut créer un bien immobilier avec les nouveaux champs', function () {
    $user = User::factory()->create();
    $category = PropertyCategory::factory()->create(['name' => 'Villa', 'slug' => 'villa']);

    $response = $this->actingAs($user)->post(route('properties.store'), [
        'property_category_id' => $category->id,
        'title' => 'Villa Moderne',
        'description' => 'Une belle villa',
        'price' => 1500000,
        'type' => 'R+1',
        'status' => 'available',
        'bedrooms_count' => 4,
        'bathrooms_count' => 3,
        'living_rooms_count' => 2,
        'has_kitchen' => true,
        'has_solar_panels' => true,
        'has_generator' => false,
    ]);

    $response->assertRedirect(route('properties.index'));
    $this->assertDatabaseHas('properties', [
        'title' => 'Villa Moderne',
        'price' => 1500000,
        'type' => 'R+1',
        'bedrooms_count' => 4,
        'has_solar_panels' => true,
    ]);
});

test('peut créer un immeuble avec des appartements et prix', function () {
    $user = User::factory()->create();
    $category = PropertyCategory::factory()->create(['name' => 'Immeuble', 'slug' => 'immeuble']);
    $aptCategory = PropertyCategory::factory()->create(['name' => 'Appartement', 'slug' => 'appartement']);

    $response = $this->actingAs($user)->post(route('properties.store'), [
        'property_category_id' => $category->id,
        'title' => 'Immeuble Horizon',
        'price' => 5000000,
        'status' => 'available',
        'apartments' => [
            [
                'title' => 'Apt 101',
                'floor_number' => 1,
                'price' => 250000,
                'bedrooms_count' => 2,
                'bathrooms_count' => 1,
            ],
            [
                'title' => 'Apt 102',
                'floor_number' => 1,
                'price' => 200000,
                'bedrooms_count' => 1,
                'bathrooms_count' => 1,
            ],
        ],
    ]);

    $response->assertRedirect(route('properties.index'));
    $this->assertDatabaseHas('properties', ['title' => 'Immeuble Horizon', 'price' => 5000000]);
    $this->assertDatabaseHas('properties', ['title' => 'Apt 101', 'floor_number' => 1, 'price' => 250000]);
    $this->assertDatabaseHas('properties', ['title' => 'Apt 102', 'floor_number' => 1, 'price' => 200000]);
});
