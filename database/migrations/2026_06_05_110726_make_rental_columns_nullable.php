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
            $table->decimal('deposit_amount', 15, 2)->nullable()->change();
            $table->decimal('rent_amount', 15, 2)->nullable()->change();
            $table->string('payment_frequency')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rentals', function (Blueprint $table) {
            $table->decimal('deposit_amount', 15, 2)->nullable(false)->default(0)->change();
            $table->decimal('rent_amount', 15, 2)->nullable(false)->default(0)->change();
            $table->string('payment_frequency')->nullable(false)->default('monthly')->change();
        });
    }
};
