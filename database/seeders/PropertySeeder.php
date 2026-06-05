<?php

namespace Database\Seeders;

use App\Models\Property;
use App\Models\PropertyCategory;
use Illuminate\Database\Seeder;

class PropertySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $villaCategory = PropertyCategory::where('name', 'Villa')->first();
        $immeubleCategory = PropertyCategory::where('name', 'Immeuble')->first();
        $batimentCategory = PropertyCategory::where('name', 'Bâtiment')->first();
        $appartementCategory = PropertyCategory::where('name', 'Appartement')->first();

        // 1. Créer quelques Villas
        if ($villaCategory) {
            $villasTypes = ['RDC', 'R+1', 'R+2', 'R+3'];
            foreach ($villasTypes as $type) {
                Property::factory()->create([
                    'property_category_id' => $villaCategory->id,
                    'title' => 'Villa '.$type.' - Quartier Chic',
                    'type' => $type,
                    'price' => rand(2000, 5000),
                ]);
            }
        }

        // 2. Créer des Immeubles avec des appartements
        if ($immeubleCategory && $appartementCategory) {
            for ($i = 1; $i <= 3; $i++) {
                $immeuble = Property::factory()->create([
                    'property_category_id' => $immeubleCategory->id,
                    'title' => "Immeuble Résidentiel $i",
                    'price' => 0, // Les immeubles n'ont pas forcément de prix global s'ils sont loués par appartements
                ]);

                // Ajouter des appartements à cet immeuble (3 étages, 2 appartements par étage)
                for ($floor = 0; $floor <= 2; $floor++) {
                    for ($apt = 1; $apt <= 2; $apt++) {
                        Property::factory()->create([
                            'property_category_id' => $appartementCategory->id,
                            'parent_id' => $immeuble->id,
                            'title' => 'Appartement '.($floor * 10 + $apt)." - Immeuble $i",
                            'floor_number' => $floor,
                            'price' => rand(500, 1500),
                            'surface_area' => rand(50, 150),
                        ]);
                    }
                }
            }
        }

        // 3. Créer des Bâtiments avec des appartements
        if ($batimentCategory && $appartementCategory) {
            $batiment = Property::factory()->create([
                'property_category_id' => $batimentCategory->id,
                'title' => 'Complexe Bâtiment A',
                'price' => 0,
            ]);

            // 5 appartements simples
            Property::factory()->count(5)->create([
                'property_category_id' => $appartementCategory->id,
                'parent_id' => $batiment->id,
                'price' => rand(400, 800),
            ]);
        }
    }
}
