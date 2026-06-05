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
            $table->string('payment_frequency')->default('monthly'); // monthly, quarterly, semiannual
            $table->date('next_payment_date')->nullable();
            $table->decimal('rent_amount', 15, 2)->after('deposit_amount')->default(0);
        });
    }

    public function down(): void
    {
        Schema::table('rentals', function (Blueprint $table) {
            $table->dropColumn(['payment_frequency', 'next_payment_date', 'rent_amount']);
        });
    }
};
