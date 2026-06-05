<?php

namespace Database\Factories;

use App\Models\Property;
use App\Models\PropertyCategory;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Property>
 */
class PropertyFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'property_category_id' => PropertyCategory::factory(),
            'title' => $this->faker->sentence(3),
            'description' => $this->faker->paragraph(),
            'address' => $this->faker->address(),
            'city' => $this->faker->city(),
            'price' => $this->faker->randomFloat(2, 500, 5000),
            'surface_area' => $this->faker->randomFloat(2, 50, 500),
            'rooms_count' => $this->faker->numberBetween(1, 10),
            'bathrooms_count' => $this->faker->numberBetween(1, 5),
            'living_rooms_count' => $this->faker->numberBetween(1, 3),
            'has_kitchen' => $this->faker->boolean(),
            'has_solar_panels' => $this->faker->boolean(20),
            'has_generator' => $this->faker->boolean(10),
            'status' => 'available',
        ];
    }
}
