<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\Rental;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class InvoiceController extends Controller
{
    public function index()
    {
        return Inertia::render('invoices/index', [
            'invoices' => Invoice::with(['rental.tenant', 'rental.property'])->latest()->paginate(10),
            'rentals' => Rental::with(['tenant', 'property'])->get(),
        ]);
    }

    public function create()
    {
        return Inertia::render('invoices/create', [
            'rentals' => Rental::with(['tenant', 'property'])->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'rental_id' => 'required|exists:rentals,id',
            'date' => 'required|date',
            'due_date' => 'nullable|date',
            'type' => 'required|string',
            'items' => 'required|array|min:1',
            'items.*.designation' => 'required|string',
            'items.*.period' => 'nullable|string',
            'items.*.months_count' => 'nullable|integer|min:1',
            'items.*.total' => 'required|numeric|min:0', // L'utilisateur peut changer le prix final
            'notes' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($validated) {
            $totalAmount = collect($validated['items'])->sum('total');

            $invoice = Invoice::create([
                'rental_id' => $validated['rental_id'],
                'invoice_number' => Invoice::generateInvoiceNumber(),
                'date' => $validated['date'],
                'due_date' => $validated['due_date'],
                'type' => $validated['type'],
                'amount_ht' => $totalAmount,
                'tax_amount' => 0,
                'total_amount' => $totalAmount,
                'status' => 'pending',
                'notes' => $validated['notes'],
            ]);

            foreach ($validated['items'] as $item) {
                $invoice->items()->create([
                    'designation' => $item['designation'],
                    'period' => $item['period'],
                    'months_count' => $item['months_count'] ?? 1,
                    'total' => $item['total'],
                    // unit_price et quantity sont optionnels maintenant
                    'unit_price' => $item['unit_price'] ?? null,
                    'quantity' => $item['quantity'] ?? null,
                ]);
            }

            return redirect()->route('invoices.index')->with('success', 'Facture créée avec succès.');
        });
    }

    public function show(Invoice $invoice)
    {
        return Inertia::render('invoices/show', [
            'invoice' => $invoice->load(['rental.tenant', 'rental.property', 'items']),
        ]);
    }

    public function edit(Invoice $invoice)
    {
        return Inertia::render('invoices/edit', [
            'invoice' => $invoice->load(['items']),
            'rentals' => Rental::with(['tenant', 'property'])->get(),
        ]);
    }

    public function update(Request $request, Invoice $invoice)
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'due_date' => 'nullable|date',
            'type' => 'required|string',
            'items' => 'required|array|min:1',
            'items.*.id' => 'nullable|exists:invoice_items,id',
            'items.*.designation' => 'required|string',
            'items.*.period' => 'nullable|string',
            'items.*.months_count' => 'nullable|integer|min:1',
            'items.*.total' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($validated, $invoice) {
            $totalAmount = collect($validated['items'])->sum('total');

            $invoice->update([
                'date' => $validated['date'],
                'due_date' => $validated['due_date'],
                'type' => $validated['type'],
                'amount_ht' => $totalAmount,
                'total_amount' => $totalAmount,
                'notes' => $validated['notes'],
            ]);

            // Simple approach: delete old items and recreate
            $invoice->items()->delete();
            foreach ($validated['items'] as $item) {
                $invoice->items()->create([
                    'designation' => $item['designation'],
                    'period' => $item['period'],
                    'months_count' => $item['months_count'] ?? 1,
                    'total' => $item['total'],
                    'unit_price' => $item['unit_price'] ?? null,
                    'quantity' => $item['quantity'] ?? null,
                ]);
            }

            return redirect()->route('invoices.index')->with('success', 'Facture mise à jour avec succès.');
        });
    }

    public function destroy(Invoice $invoice)
    {
        $invoice->delete();

        return redirect()->back()->with('success', 'Facture supprimée avec succès.');
    }
}
