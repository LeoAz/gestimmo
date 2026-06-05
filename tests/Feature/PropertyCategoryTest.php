<?php

use App\Models\PropertyCategory;
use App\Models\User;

test('peut lister les catégories', function () {
    $user = User::factory()->create();
    PropertyCategory::factory()->create(['name' => 'Villa']);

    $response = $this->actingAs($user)->get(route('property-categories.index'));

    $response->assertStatus(200);
});

test('peut créer une catégorie', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post(route('property-categories.store'), [
        'name' => 'Appartement de luxe',
        'description' => 'Un bel appartement',
    ]);

    $response->assertRedirect(route('property-categories.index'));
    $this->assertDatabaseHas('property_categories', ['name' => 'Appartement de luxe']);
});
