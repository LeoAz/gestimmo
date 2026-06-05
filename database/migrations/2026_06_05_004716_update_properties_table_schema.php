<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            // New fields
            $table->integer('bedrooms_count')->default(0)->after('rooms_count');
            $table->integer('bathrooms_count')->default(0)->after('bedrooms_count');
            $table->integer('living_rooms_count')->default(0)->after('bathrooms_count');
            $table->boolean('has_kitchen')->default(false)->after('living_rooms_count');
            $table->boolean('has_solar_panels')->default(false)->after('has_kitchen');
            $table->boolean('has_generator')->default(false)->after('has_solar_panels');

            // Remove old fields that might not be needed based on the description
            // "on prendra juste: ..." suggests a restricted list, but I should be careful.
            // I will keep some useful fields like title, address, city, price if they are not explicitly asked to be removed,
            // but the issue says "on prendra juste [the list]", so I will adjust.
            // Actually, I'll keep the category and parent (for building/apartment logic).
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            $table->dropColumn([
                'bedrooms_count',
                'bathrooms_count',
                'living_rooms_count',
                'has_kitchen',
                'has_solar_panels',
                'has_generator',
            ]);
        });
    }
};
