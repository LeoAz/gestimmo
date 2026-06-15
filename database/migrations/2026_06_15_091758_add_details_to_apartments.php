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
            $table->integer('balconies_count')->nullable()->after('living_rooms_count');
            $table->integer('kitchens_count')->nullable()->after('balconies_count');
            // surface_area is already there, we will just stop using it in the UI/Code if needed
            // but the issue says "supprimer la surface", usually it means from UI/CRUD
            // I'll keep the column in DB for safety but I could drop it if requested.
            // "supprimer la surface, et en tenir compte dans le CRUD"
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            $table->dropColumn(['balconies_count', 'kitchens_count']);
        });
    }
};
