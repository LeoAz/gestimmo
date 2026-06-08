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

        // Déterminer la période actuelle
        $periodStart = $rental->next_payment_date;
        $periodEnd = $this->calculateNextPaymentDate($periodStart, $rental->payment_frequency)->subDay();

        $payment = Payment::create([
            'rental_id' => $rental->id,
            'amount' => $validated['amount'],
            'payment_date' => $validated['status'] === 'paid' ? ($validated['payment_date'] ?? now()) : now(),
            'payment_method' => $validated['payment_method'],
            'period_start' => $periodStart,
            'period_end' => $periodEnd,
            'type' => 'rent',
            'status' => $validated['status'],
            'invoice_number' => 'INV-'.strtoupper(uniqid('', true)),
            'notes' => $validated['notes'] ?? null,
        ]);

        // Si le paiement est effectué, recalculer la prochaine date de paiement
        if ($payment->status === 'paid') {
            $this->updateRentalNextPaymentDate($rental);
        }

        $message = $payment->status === 'paid' ? 'Paiement enregistré.' : 'Facture (créance) générée.';

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

        // Recalculer la prochaine date de paiement de la location
        $this->updateRentalNextPaymentDate($payment->rental);

        return back()->with('success', 'La facture a été marquée comme payée.');
    }

    /**
     * Met à jour la date de prochain paiement en fonction du total payé.
     */
    public function updateRentalNextPaymentDate(Rental $rental)
    {
        // On commence par la date de début de la location
        $currentDate = $rental->start_date;

        // Total de tous les paiements "payés"
        $totalPaid = Payment::where('rental_id', $rental->id)
            ->where('status', 'paid')
            ->where('type', 'rent')
            ->sum('amount');

        $rentAmount = $rental->rent_amount;

        if ($rentAmount <= 0) {
            return;
        }

        // On avance la date tant que le total payé couvre le loyer des périodes successives
        while ($totalPaid >= $rentAmount) {
            $totalPaid -= $rentAmount;
            $currentDate = $this->calculateNextPaymentDate($currentDate, $rental->payment_frequency);
        }

        $rental->update([
            'next_payment_date' => $currentDate,
        ]);
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
