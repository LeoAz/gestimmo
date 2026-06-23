<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // No schema changes needed as columns are strings, but we document the new options.
        // payment_frequency: monthly, bimonthly, quarterly, bisessional, semiannual, annual
        // billing_cycle: monthly, bimonthly, quarterly, bisessional, semiannual, annual
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
