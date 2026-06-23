<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('invoice_items', function (Blueprint $table) {
            $table->decimal('unit_price', 15, 2)->nullable()->change();
            $table->decimal('quantity', 10, 2)->nullable()->change();
            if (! Schema::hasColumn('invoice_items', 'months_count')) {
                $table->integer('months_count')->default(1)->after('period');
            }
        });

        // Supprimer les paiements orphelins (sans facture) pour permettre le NOT NULL
        DB::table('payments')->whereNull('invoice_id')->delete();

        // Pour SQLite, on évite les requêtes INFORMATION_SCHEMA
        if (DB::getDriverName() !== 'sqlite') {
            // Vérifier si la foreign key existe
            $foreignKeyExists = DB::select("
                SELECT CONSTRAINT_NAME
                FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = 'payments'
                AND CONSTRAINT_NAME = 'payments_invoice_id_foreign'
            ");

            if (! empty($foreignKeyExists)) {
                Schema::table('payments', function (Blueprint $table) {
                    $table->dropForeign(['invoice_id']);
                });
            }
        }

        Schema::table('payments', function (Blueprint $table) {
            $table->unsignedBigInteger('invoice_id')->nullable(false)->change();
            $table->foreign('invoice_id')->references('id')->on('invoices')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoice_items', function (Blueprint $table) {
            $table->decimal('unit_price', 15, 2)->nullable(false)->change();
            $table->decimal('quantity', 10, 2)->nullable(false)->change();
            $table->dropColumn('months_count');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropForeign(['invoice_id']);
            $table->unsignedBigInteger('invoice_id')->nullable()->change();
            $table->foreign('invoice_id')->references('id')->on('invoices')->onDelete('set null');
        });
    }
};
