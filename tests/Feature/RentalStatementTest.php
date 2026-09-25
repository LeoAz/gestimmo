<?php

use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Rental;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

function createStatementPayment(Rental $rental, string $invoiceNumber, float $amount): Payment
{
    $invoice = Invoice::create([
        'rental_id' => $rental->id,
        'invoice_number' => $invoiceNumber,
        'date' => now(),
        'type' => 'Loyer',
        'amount_ht' => $amount,
        'total_amount' => $amount,
        'status' => 'paid',
    ]);
    $invoice->items()->create([
        'designation' => 'Loyer '.$invoiceNumber,
        'months_count' => 1,
        'total' => $amount,
    ]);

    return Payment::create([
        'rental_id' => $rental->id,
        'invoice_id' => $invoice->id,
        'amount' => $amount,
        'payment_date' => now(),
        'payment_method' => 'cash',
        'type' => 'rent',
        'status' => 'paid',
        'invoice_number' => $invoiceNumber,
    ]);
}

it('shows every payment of the rental by default', function () {
    $this->actingAs(User::factory()->create());
    $rental = Rental::factory()->create();
    createStatementPayment($rental, 'PAY-1', 1000);
    createStatementPayment($rental, 'PAY-2', 0);

    $this->get(route('rentals.statement', $rental))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('rentals/statement')
            ->has('rental.payments', 2)
            ->where('showDetails', false)
            ->where('autoPrint', false)
        );
});

it('only shows the selected payments with their details', function () {
    $this->actingAs(User::factory()->create());
    $rental = Rental::factory()->create();
    createStatementPayment($rental, 'PAY-1', 1000);
    $selectedPayment = createStatementPayment($rental, 'PAY-2', 2000);

    $this->get(route('rentals.statement', [
        'rental' => $rental,
        'payments' => [$selectedPayment->id],
        'details' => 1,
        'print' => 1,
    ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('rental.payments', 1)
            ->where('rental.payments.0.invoice_number', 'PAY-2')
            ->has('rental.payments.0.invoice.items', 1)
            ->where('showDetails', true)
            ->where('autoPrint', true)
        );
});

it('ignores payments belonging to another rental', function () {
    $this->actingAs(User::factory()->create());
    $rental = Rental::factory()->create();
    createStatementPayment($rental, 'PAY-1', 1000);
    $otherPayment = createStatementPayment(Rental::factory()->create(), 'OTHER-1', 500);

    $this->get(route('rentals.statement', [
        'rental' => $rental,
        'payments' => [$otherPayment->id],
    ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->has('rental.payments', 0));
});
