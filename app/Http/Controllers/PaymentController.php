<?php

namespace App\Http\Controllers;

use App\Models\Organization;
use App\Models\Payment;
use App\Models\Rental;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $query = Payment::with(['rental.property', 'rental.tenant']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                    ->orWhereHas('rental.tenant', function ($t) use ($search) {
                        $t->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('rental.property', function ($p) use ($search) {
                        $p->where('title', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return Inertia::render('payments/index', [
            'payments' => $query->orderByDesc('payment_date')->get(),
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function invoice(Payment $payment)
    {
        $organization = Organization::first();

        if ($organization && $organization->logo) {
            $organization->logo_url = asset('storage/'.$organization->logo);
        }

        return Inertia::render('payments/invoice', [
            'payment' => $payment->load(['rental.property', 'rental.tenant']),
            'organization' => $organization,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'rental_id' => 'required|exists:rentals,id',
            'amount' => 'required|numeric|min:0',
            'payment_date' => 'nullable|date',
            'payment_method' => 'nullable|string|in:cash,bank_transfer,mobile_money',
            'status' => 'required|string|in:pending,paid',
            'notes' => 'nullable|string',
        ]);

        $rental = Rental::findOrFail($validated['rental_id']);

        // Déterminer la période couverte par ce paiement
        $periodStart = $rental->next_payment_date;
        $periodEnd = $this->calculateNextPaymentDate($periodStart, $rental->payment_frequency);

        $payment = Payment::create([
            'rental_id' => $rental->id,
            'amount' => $validated['amount'],
            'payment_date' => $validated['status'] === 'paid' ? ($validated['payment_date'] ?? now()) : null,
            'payment_method' => $validated['payment_method'],
            'period_start' => $periodStart,
            'period_end' => $periodEnd->copy()->subDay(), // La période finit la veille du prochain paiement
            'type' => 'rent',
            'status' => $validated['status'],
            'invoice_number' => 'INV-'.strtoupper(uniqid('', true)),
            'notes' => $validated['notes'],
        ]);

        // Si le paiement est effectué, mettre à jour la prochaine date de paiement de la location
        if ($payment->status === 'paid') {
            $rental->update([
                'next_payment_date' => $periodEnd,
            ]);
        }

        $message = $payment->status === 'paid' ? 'Paiement enregistré et location reconduite.' : 'Facture (créance) générée.';

        return back()->with('success', $message);
    }

    public function markAsPaid(Request $request, Payment $payment)
    {
        $validated = $request->validate([
            'payment_date' => 'required|date',
            'payment_method' => 'required|string|in:cash,bank_transfer,mobile_money',
        ]);

        if ($payment->status === 'paid') {
            return back()->with('error', 'Cette facture est déjà payée.');
        }

        $payment->update([
            'status' => 'paid',
            'payment_date' => $validated['payment_date'],
            'payment_method' => $validated['payment_method'],
        ]);

        // Mettre à jour la prochaine date de paiement de la location
        $rental = $payment->rental;
        $periodEnd = $this->calculateNextPaymentDate($payment->period_start, $rental->payment_frequency);

        $rental->update([
            'next_payment_date' => $periodEnd,
        ]);

        return back()->with('success', 'La facture a été marquée comme payée et la location reconduite.');
    }

    private function calculateNextPaymentDate($startDate, $frequency)
    {
        $date = Carbon::parse($startDate);

        return match ($frequency) {
            'monthly' => $date->addMonth(),
            'quarterly' => $date->addMonths(3),
            'semiannual' => $date->addMonths(6),
            default => $date->addMonth(),
        };
    }
}
