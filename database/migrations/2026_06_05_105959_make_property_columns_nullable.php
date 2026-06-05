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
            $table->integer('bedrooms_count')->nullable()->change();
            $table->integer('bathrooms_count')->nullable()->change();
            $table->integer('living_rooms_count')->nullable()->change();
            $table->boolean('has_kitchen')->nullable()->change();
            $table->boolean('has_solar_panels')->nullable()->change();
            $table->boolean('has_generator')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            $table->integer('bedrooms_count')->nullable(false)->change();
            $table->integer('bathrooms_count')->nullable(false)->change();
            $table->integer('living_rooms_count')->nullable(false)->change();
            $table->boolean('has_kitchen')->nullable(false)->change();
            $table->boolean('has_solar_panels')->nullable(false)->change();
            $table->boolean('has_generator')->nullable(false)->change();
        });
    }
};
