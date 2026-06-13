<?php

namespace App\Http\Controllers;

use App\Exports\ExpensesExport;
use App\Models\Expense;
use App\Models\Organization;
use App\Models\Property;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class ExpenseController extends Controller
{
    public function index(Request $request)
    {
        $query = Expense::with(['property', 'items']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('reference', 'like', "%{$search}%")
                    ->orWhere('provider', 'like', "%{$search}%")
                    ->orWhereHas('property', function ($p) use ($search) {
                        $p->where('title', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('property_id')) {
            $query->where('property_id', $request->property_id);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('date', '<=', $request->date_to);
        }

        if ($request->export === 'excel') {
            return Excel::download(new ExpensesExport($query->get()), 'depenses.xlsx');
        }

        return Inertia::render('expenses/index', [
            'expenses' => $query->orderByDesc('date')->paginate(10)->withQueryString(),
            'properties' => Property::all(['id', 'title']),
            'filters' => $request->only(['search', 'property_id', 'date_from', 'date_to']),
        ]);
    }

    public function create()
    {
        return Inertia::render('expenses/create', [
            'properties' => Property::all(['id', 'title']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'property_id' => 'required|exists:properties,id',
            'date' => 'required|date',
            'provider' => 'required|string|max:255',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.description' => 'required|string|max:255',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        try {
            DB::beginTransaction();

            $expense = Expense::create([
                'property_id' => $validated['property_id'],
                'date' => $validated['date'],
                'provider' => $validated['provider'],
                'notes' => $validated['notes'],
                'reference' => 'EXP-'.strtoupper(uniqid('', true)),
                'total_amount' => 0,
            ]);

            $totalAmount = 0;
            foreach ($validated['items'] as $item) {
                $itemTotal = $item['quantity'] * $item['unit_price'];
                $expense->items()->create([
                    'description' => $item['description'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'total' => $itemTotal,
                ]);
                $totalAmount += $itemTotal;
            }

            $expense->update(['total_amount' => $totalAmount]);

            DB::commit();

            return redirect()->route('expenses.index')->with('success', 'Dépense enregistrée avec succès.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->with('error', 'Une erreur est survenue lors de l\'enregistrement : '.$e->getMessage());
        }
    }

    public function show(Expense $expense)
    {
        $organization = Organization::first();

        if ($organization && $organization->logo) {
            $organization->logo_url = asset('storage/'.$organization->logo);
        }

        return Inertia::render('expenses/show', [
            'expense' => $expense->load(['property', 'items']),
            'organization' => $organization,
        ]);
    }

    public function edit(Expense $expense)
    {
        return Inertia::render('expenses/edit', [
            'expense' => $expense->load('items'),
            'properties' => Property::all(['id', 'title']),
        ]);
    }

    public function update(Request $request, Expense $expense)
    {
        $validated = $request->validate([
            'property_id' => 'required|exists:properties,id',
            'date' => 'required|date',
            'provider' => 'required|string|max:255',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.id' => 'nullable|exists:expense_items,id',
            'items.*.description' => 'required|string|max:255',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        try {
            DB::beginTransaction();

            $expense->update([
                'property_id' => $validated['property_id'],
                'date' => $validated['date'],
                'provider' => $validated['provider'],
                'notes' => $validated['notes'],
            ]);

            $totalAmount = 0;
            $keepIds = [];

            foreach ($validated['items'] as $item) {
                $itemTotal = $item['quantity'] * $item['unit_price'];
                $totalAmount += $itemTotal;

                if (isset($item['id'])) {
                    $expenseItem = $expense->items()->find($item['id']);
                    if ($expenseItem) {
                        $expenseItem->update([
                            'description' => $item['description'],
                            'quantity' => $item['quantity'],
                            'unit_price' => $item['unit_price'],
                            'total' => $itemTotal,
                        ]);
                        $keepIds[] = $item['id'];
                    }
                } else {
                    $newItem = $expense->items()->create([
                        'description' => $item['description'],
                        'quantity' => $item['quantity'],
                        'unit_price' => $item['unit_price'],
                        'total' => $itemTotal,
                    ]);
                    $keepIds[] = $newItem->id;
                }
            }

            // Supprimer les items qui ne sont plus dans la liste
            $expense->items()->whereNotIn('id', $keepIds)->delete();

            $expense->update(['total_amount' => $totalAmount]);

            DB::commit();

            return redirect()->route('expenses.index')->with('success', 'Dépense mise à jour avec succès.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->with('error', 'Une erreur est survenue lors de la mise à jour : '.$e->getMessage());
        }
    }

    public function destroy(Expense $expense)
    {
        $expense->delete();

        return redirect()->route('expenses.index')->with('success', 'Dépense supprimée.');
    }
}
