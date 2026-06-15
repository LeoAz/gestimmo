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
            $table->string('status')->nullable()->change();
        });

        Schema::table('rentals', function (Blueprint $table) {
            $table->string('billing_cycle')->default('monthly')->after('payment_frequency'); // annual, quarterly, semiannual, monthly
            // rent_amount is already there, we will use it as the contract price
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->integer('months_count')->default(1)->after('amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            $table->string('status')->nullable(false)->change();
        });

        Schema::table('rentals', function (Blueprint $table) {
            $table->dropColumn('billing_cycle');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn('months_count');
        });
    }
};
