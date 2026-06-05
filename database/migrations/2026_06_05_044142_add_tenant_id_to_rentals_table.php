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
        Schema::table('rentals', function (Blueprint $table) {
            $table->foreignId('tenant_id')->after('property_id')->constrained()->cascadeOnDelete();

            // On peut supprimer les colonnes redondantes si on migre les données,
            // mais pour simplifier dans cet environnement de dév, on va juste ajouter la relation.
            $table->dropColumn([
                'tenant_first_name',
                'tenant_last_name',
                'tenant_phone',
                'tenant_address',
                'tenant_photo',
                'tenant_id_card',
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rentals', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
            $table->dropColumn('tenant_id');

            $table->string('tenant_first_name')->nullable();
            $table->string('tenant_last_name')->nullable();
            $table->string('tenant_phone')->nullable();
            $table->string('tenant_address')->nullable();
            $table->string('tenant_photo')->nullable();
            $table->string('tenant_id_card')->nullable();
        });
    }
};
