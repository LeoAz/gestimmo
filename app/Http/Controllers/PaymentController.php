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

        $payments = $query->orderByDesc('payment_date')->get();

        // Calcul des futurs paiements (ceux qui n'ont pas encore de facture mais dont la date de prochain paiement est passée ou proche)
        $futurePayments = Rental::with(['property', 'tenant'])
            ->where('status', 'active')
            ->where('next_payment_date', '<=', now()->addDays(30))
            ->get();

        // Créances à recouvrer (paiements de type 'rent' avec statut 'pending')
        $debts = Payment::with(['rental.property', 'rental.tenant'])
            ->where('status', 'pending')
            ->where('type', 'rent')
            ->get();

        $organization = Organization::first();

        if ($organization && $organization->logo) {
            $organization->logo_url = asset('storage/'.$organization->logo);
        }

        return Inertia::render('payments/index', [
            'payments' => $payments,
            'futurePayments' => $futurePayments,
            'debts' => $debts,
            'filters' => $request->only(['search', 'status']),
            'organization' => $organization,
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
            'payment_id' => 'nullable|exists:payments,id',
            'amount' => 'required|numeric|min:0',
            'months_count' => 'required|integer|min:1',
            'payment_date' => 'nullable|date',
            'payment_method' => 'nullable|string|in:cash,bank_transfer,mobile_money,balance',
            'status' => 'required|string|in:pending,paid',
            'notes' => 'nullable|string',
        ]);

        $rental = Rental::with('tenant')->findOrFail($validated['rental_id']);

        // Si on spécifie une facture existante (encaissement lié)
        if (! empty($validated['payment_id'])) {
            $payment = Payment::findOrFail($validated['payment_id']);

            if ($payment->status === 'paid') {
                return back()->with('error', 'Cette facture est déjà payée.');
            }

            if ($validated['status'] === 'paid' && $validated['payment_method'] === 'balance') {
                if ($rental->tenant->balance < $payment->amount) {
                    return back()->with('error', 'Le solde du locataire est insuffisant.');
                }
                $rental->tenant->decrement('balance', $payment->amount);
            }

            $payment->update([
                'status' => $validated['status'],
                'payment_date' => $validated['status'] === 'paid' ? ($validated['payment_date'] ?? now()) : now(),
                'payment_method' => $validated['payment_method'],
                'notes' => $validated['notes'] ?? $payment->notes,
            ]);

            $this->updateRentalNextPaymentDate($rental);

            return back()->with('success', 'Paiement de la facture enregistré.');
        }

        if ($validated['status'] === 'paid' && $validated['payment_method'] === 'balance') {
            if ($rental->tenant->balance < $validated['amount']) {
                return back()->with('error', 'Le solde du locataire est insuffisant.');
            }

            $rental->tenant->decrement('balance', $validated['amount']);
        }

        // Déterminer la période actuelle
        $periodStart = $rental->next_payment_date;
        $periodEnd = Carbon::parse($periodStart)->addMonths($validated['months_count'])->subDay();

        $payment = Payment::create([
            'rental_id' => $rental->id,
            'amount' => $validated['amount'],
            'months_count' => $validated['months_count'],
            'payment_date' => $validated['status'] === 'paid' ? ($validated['payment_date'] ?? now()) : now(),
            'payment_method' => $validated['payment_method'],
            'period_start' => $periodStart,
            'period_end' => $periodEnd,
            'type' => 'rent',
            'status' => $validated['status'],
            'invoice_number' => 'INV-'.strtoupper(uniqid('', true)),
            'notes' => $validated['notes'] ?? null,
        ]);

        // Recalculer la prochaine date de paiement de la location (incluant les factures en attente)
        $this->updateRentalNextPaymentDate($rental);

        $message = $payment->status === 'paid' ? 'Paiement enregistré.' : 'Facture (créance) générée.';

        return back()->with('success', $message);
    }

    public function markAsPaid(Request $request, Payment $payment)
    {
        $validated = $request->validate([
            'payment_date' => 'required|date',
            'payment_method' => 'required|string|in:cash,bank_transfer,mobile_money,balance',
        ]);

        if ($payment->status === 'paid') {
            return back()->with('error', 'Cette facture est déjà payée.');
        }

        $rental = $payment->rental->load('tenant');

        if ($validated['payment_method'] === 'balance') {
            if ($rental->tenant->balance < $payment->amount) {
                return back()->with('error', 'Le solde du locataire est insuffisant.');
            }

            $rental->tenant->decrement('balance', $payment->amount);
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

    public function addAdvance(Request $request)
    {
        $validated = $request->validate([
            'rental_id' => 'required|exists:rentals,id',
            'amount' => 'required|numeric|min:0.01',
            'payment_date' => 'required|date',
            'payment_method' => 'required|string|in:cash,bank_transfer,mobile_money',
            'notes' => 'nullable|string',
        ]);

        $rental = Rental::with('tenant')->findOrFail($validated['rental_id']);

        $payment = Payment::create([
            'rental_id' => $rental->id,
            'amount' => $validated['amount'],
            'months_count' => 0,
            'payment_date' => $validated['payment_date'],
            'payment_method' => $validated['payment_method'],
            'type' => 'advance',
            'status' => 'paid',
            'is_advance_payment' => true,
            'invoice_number' => 'ADV-'.strtoupper(uniqid('', true)),
            'notes' => $validated['notes'] ?? 'Avance sur compte',
        ]);

        $rental->tenant->increment('balance', $validated['amount']);

        return back()->with('success', 'Avance enregistrée avec succès.');
    }

    public function statement(Rental $rental)
    {
        $rental->load(['tenant', 'property', 'payments' => function ($query) {
            $query->orderBy('payment_date', 'asc')->orderBy('created_at', 'asc');
        }]);

        $organization = Organization::first();

        return Inertia::render('rentals/statement', [
            'rental' => $rental,
            'organization' => $organization,
        ]);
    }

    /**
     * Met à jour la date de prochain paiement en fonction du total payé.
     */
    public function updateRentalNextPaymentDate(Rental $rental)
    {
        // On commence par la date de début de la location
        $currentDate = Carbon::parse($rental->start_date);

        // Total des mois couverts (payés ou facturés)
        $totalMonthsCovered = Payment::where('rental_id', $rental->id)
            ->whereIn('status', ['paid', 'pending'])
            ->where('type', 'rent')
            ->sum('months_count');

        $rental->update([
            'next_payment_date' => $currentDate->addMonths($totalMonthsCovered),
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
