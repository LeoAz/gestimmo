<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
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
            'payments' => Payment::with(['rental.property', 'rental.tenant', 'invoice.items'])->orderByDesc('payment_date')->get(),
            'futurePayments' => $futurePayments,
            'debts' => Invoice::with(['rental.property', 'rental.tenant', 'items'])->where('status', '!=', 'paid')->get(),
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
            'payment' => $payment->load(['rental.property', 'rental.tenant', 'invoice.items']),
            'organization' => $organization,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'invoice_id' => 'required|exists:invoices,id',
            'amount' => 'required|numeric|min:0',
            'payment_date' => 'required|date',
            'payment_method' => 'required|string|in:cash,bank_transfer,mobile_money,balance',
            'notes' => 'nullable|string',
        ]);

        $invoice = Invoice::with(['rental.tenant', 'items'])->findOrFail($validated['invoice_id']);
        $rental = $invoice->rental;

        if ($invoice->status === 'paid') {
            return back()->with('error', 'Cette facture est déjà payée.');
        }

        if ($validated['payment_method'] === 'balance') {
            if ($rental->tenant->balance < $validated['amount']) {
                return back()->with('error', 'Le solde du locataire est insuffisant.');
            }
            $rental->tenant->decrement('balance', $validated['amount']);
        }

        $payment = Payment::create([
            'rental_id' => $rental->id,
            'invoice_id' => $invoice->id,
            'amount' => $validated['amount'],
            'payment_date' => $validated['payment_date'],
            'payment_method' => $validated['payment_method'],
            'type' => $invoice->type,
            'status' => 'paid',
            'invoice_number' => $invoice->invoice_number,
            'notes' => $validated['notes'] ?? null,
            'period_start' => $invoice->items->first()?->period_start ?? null,
            'period_end' => $invoice->items->first()?->period_end ?? null,
        ]);

        // Mettre à jour le statut de la facture si le montant total est atteint
        // (Pour l'instant on considère un paiement unique pour simplifier,
        // sinon il faudrait comparer la somme des paiements au total de la facture)
        $totalPaid = $invoice->payments()->where('status', 'paid')->sum('amount') + $validated['amount'];
        if ($totalPaid >= $invoice->total_amount) {
            $invoice->update(['status' => 'paid']);
        } else {
            $invoice->update(['status' => 'partial']);
        }

        $this->updateRentalNextPaymentDate($rental);

        return back()->with('success', 'Encaissement enregistré avec succès.');
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
            'bimonthly' => $date->addMonths(2),
            'quarterly' => $date->addMonths(3),
            'bisessional' => $date->addMonths(6),
            'semiannual' => $date->addMonths(6),
            'annual' => $date->addYear(),
            default => $date->addMonth(),
        };
    }
}
