<?php

use App\Models\PropertyCategory;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
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

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $names = ['Villa', 'Immeuble', 'Bâtiment', 'Appartement'];
        PropertyCategory::whereIn('name', $names)->delete();
    }
};
