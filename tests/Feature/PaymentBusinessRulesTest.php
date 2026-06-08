<?php

use App\Models\Payment;
use App\Models\Property;
use App\Models\PropertyCategory;
use App\Models\Rental;
use App\Models\Tenant;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->category = PropertyCategory::firstWhere('slug', 'appartement') ?? PropertyCategory::factory()->create(['name' => 'Appartement', 'slug' => 'appartement']);
    $this->property = Property::factory()->create(['property_category_id' => $this->category->id]);
    $this->tenant = Tenant::factory()->create();
    $this->rental = Rental::factory()->create([
        'property_id' => $this->property->id,
        'tenant_id' => $this->tenant->id,
        'rent_amount' => 100000,
        'start_date' => Carbon::parse('2026-06-01'),
        'next_payment_date' => Carbon::parse('2026-06-01'),
        'payment_frequency' => 'monthly',
    ]);
});

test('un paiement partiel ne change pas la prochaine date de paiement', function () {
    $response = $this->actingAs($this->user)
        ->post(route('payments.store'), [
            'rental_id' => $this->rental->id,
            'amount' => 40000,
            'payment_date' => '2026-06-08',
            'payment_method' => 'cash',
            'status' => 'paid',
        ]);

    $response->assertRedirect();

    $this->rental->refresh();
    expect($this->rental->next_payment_date->format('Y-m-d'))->toBe('2026-06-01');

    $payment = Payment::where('rental_id', $this->rental->id)->first();
    expect($payment)->not->toBeNull();
    expect($payment->amount)->toBe('40000.00');
});

test('un paiement complétant le loyer avance la date de prochain paiement', function () {
    // Premier paiement partiel
    Payment::create([
        'rental_id' => $this->rental->id,
        'amount' => 60000,
        'payment_date' => '2026-06-08',
        'period_start' => '2026-06-01',
        'period_end' => '2026-06-30',
        'status' => 'paid',
        'type' => 'rent',
    ]);

    // Deuxième paiement complétant le loyer (100000 total)
    $response = $this->actingAs($this->user)
        ->post(route('payments.store'), [
            'rental_id' => $this->rental->id,
            'amount' => 40000,
            'payment_date' => '2026-06-09',
            'payment_method' => 'cash',
            'status' => 'paid',
        ]);

    $response->assertSessionHasNoErrors();

    $this->rental->refresh();
    expect($this->rental->next_payment_date->format('Y-m-d'))->toBe('2026-07-01');
});

test('un paiement dépassant le loyer avance la date et gère le surplus', function () {
    // Paiement de 150000 pour un loyer de 100000
    $response = $this->actingAs($this->user)
        ->post(route('payments.store'), [
            'rental_id' => $this->rental->id,
            'amount' => 150000,
            'payment_date' => '2026-06-08',
            'payment_method' => 'cash',
            'status' => 'paid',
        ]);

    $response->assertSessionHasNoErrors();

    $this->rental->refresh();
    // Le loyer est de 100000. 150000 couvre juin (100000) et une partie de juillet (50000).
    // La date doit passer au 01-07 car juin est totalement payé.
    expect($this->rental->next_payment_date->format('Y-m-d'))->toBe('2026-07-01');
});

test('plusieurs paiements couvrant plusieurs mois avancent la date plusieurs fois', function () {
    // Paiement de 250000 pour un loyer de 100000
    $response = $this->actingAs($this->user)
        ->post(route('payments.store'), [
            'rental_id' => $this->rental->id,
            'amount' => 250000,
            'payment_date' => '2026-06-08',
            'payment_method' => 'cash',
            'status' => 'paid',
        ]);

    $response->assertSessionHasNoErrors();

    $this->rental->refresh();
    // 250000 couvre Juin (100000) et Juillet (100000), reste 50000 pour Août.
    // La date doit être 2026-08-01.
    expect($this->rental->next_payment_date->format('Y-m-d'))->toBe('2026-08-01');
});

test('un paiement marqué comme payé plus tard met à jour la date', function () {
    $payment = Payment::create([
        'rental_id' => $this->rental->id,
        'amount' => 100000,
        'payment_date' => now(),
        'period_start' => '2026-06-01',
        'period_end' => '2026-06-30',
        'status' => 'pending',
        'type' => 'rent',
    ]);

    $response = $this->actingAs($this->user)
        ->patch(route('payments.mark-as-paid', $payment), [
            'payment_date' => '2026-06-08',
            'payment_method' => 'bank_transfer',
        ]);

    $response->assertRedirect();

    $this->rental->refresh();
    expect($this->rental->next_payment_date->format('Y-m-d'))->toBe('2026-07-01');
});
