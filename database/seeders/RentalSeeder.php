<?php

namespace Database\Seeders;

use App\Models\Property;
use App\Models\Rental;
use App\Models\Tenant;
use Illuminate\Database\Seeder;

class RentalSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tenants = Tenant::all();
        $properties = Property::whereDoesntHave('children') // On ne loue pas les immeubles entiers via ce seeder simple
            ->where('status', 'available')
            ->get();

        if ($tenants->isEmpty() || $properties->isEmpty()) {
            return;
        }

        // Créer des locations actives pour certains locataires et biens
        $propertiesToRent = $properties->random(min(15, $properties->count()));

        foreach ($propertiesToRent as $property) {
            Rental::factory()->create([
                'tenant_id' => $tenants->random()->id,
                'property_id' => $property->id,
                'rent_amount' => $property->price ?: 500,
            ]);
        }

        // Créer des locations passées (historique)
        foreach ($tenants as $tenant) {
            // Chaque locataire a une chance d'avoir eu une location passée
            if (fake()->boolean(40)) {
                $pastProperty = Property::whereDoesntHave('children')->get()->random();

                $startDate = fake()->dateTimeBetween('-3 years', '-1 year');

                Rental::factory()->create([
                    'tenant_id' => $tenant->id,
                    'property_id' => $pastProperty->id,
                    'start_date' => $startDate->format('Y-m-d'),
                    'next_payment_date' => $startDate->modify('+1 year')->format('Y-m-d'), // Simule une fin ou renouvellement non actif
                    'rent_amount' => $pastProperty->price ?: 450,
                    'status' => 'completed',
                ]);
            }
        }
    }
}
