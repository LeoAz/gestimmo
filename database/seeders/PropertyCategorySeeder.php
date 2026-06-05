<?php

namespace Database\Seeders;

use App\Models\PropertyCategory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class PropertyCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            ['name' => 'Villa', 'description' => 'Maison individuelle de luxe.'],
            ['name' => 'Immeuble', 'description' => 'Bâtiment comprenant plusieurs appartements.'],
            ['name' => 'Bâtiment', 'description' => 'Structure de construction générale.'],
            ['name' => 'Appartement', 'description' => 'Unité de logement dans un immeuble ou bâtiment.'],
        ];

        foreach ($categories as $category) {
            PropertyCategory::updateOrCreate(
                ['slug' => Str::slug($category['name'])],
                [
                    'name' => $category['name'],
                    'description' => $category['description'],
                ]
            );
        }
    }
}
