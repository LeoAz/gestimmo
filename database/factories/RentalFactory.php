<?php

namespace Database\Factories;

use App\Models\Property;
use App\Models\Rental;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Rental>
 */
class RentalFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $startDate = $this->faker->dateTimeBetween('-1 year', 'now');
        $paymentFrequency = $this->faker->randomElement(['monthly', 'quarterly', 'semi-annually']);

        $monthsToAdd = match ($paymentFrequency) {
            'monthly' => 1,
            'quarterly' => 3,
            'semi-annually' => 6,
        };

        return [
            'tenant_id' => Tenant::factory(),
            'property_id' => Property::factory(),
            'start_date' => $startDate->format('Y-m-d'),
            'deposit_amount' => $this->faker->randomFloat(2, 500, 2000),
            'rent_amount' => $this->faker->randomFloat(2, 300, 1500),
            'payment_frequency' => $paymentFrequency,
            'next_payment_date' => $startDate->modify("+$monthsToAdd months")->format('Y-m-d'),
        ];
    }
}
