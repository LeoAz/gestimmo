<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Property;
use App\Models\PropertyCategory;
use App\Models\Rental;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RentalController extends Controller
{
    public function index(Request $request)
    {
        $query = Rental::with(['property', 'tenant']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('tenant', function ($t) use ($search) {
                    $t->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                })->orWhereHas('property', function ($p) use ($search) {
                    $p->where('title', 'like', "%{$search}%");
                });
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return Inertia::render('rentals/index', [
            'rentals' => $query->latest()->get(),
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function create()
    {
        $categories = PropertyCategory::all();

        $properties = Property::with('category')
            ->where('status', 'available')
            ->whereNull('parent_id')
            ->get();

        $buildings = Property::whereHas('category', function ($query) {
            $query->whereIn('slug', ['immeuble', 'batiment']);
        })->with(['apartments' => function ($query) {
            $query->where('status', 'available');
        }])->get();

        $tenants = Tenant::all();

        return Inertia::render('rentals/create', [
            'categories' => $categories,
            'properties' => $properties,
            'buildings' => $buildings,
            'tenants' => $tenants,
        ]);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'property_id' => 'required|exists:properties,id',
                'tenant_id' => 'nullable|exists:tenants,id',
                'tenant_first_name' => 'required_without:tenant_id|nullable|string|max:255',
                'tenant_last_name' => 'required_without:tenant_id|nullable|string|max:255',
                'tenant_phone' => 'required_without:tenant_id|nullable|string|max:255',
                'tenant_address' => 'nullable|string',
                'tenant_photo' => 'nullable|image|max:2048',
                'tenant_id_card' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:2048',
                'deposit_amount' => 'nullable|numeric|min:0',
                'rent_amount' => 'nullable|numeric|min:0',
                'payment_frequency' => 'nullable|string|in:monthly,quarterly,semiannual',
                'start_date' => 'required|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
            ]);

            if (! $request->tenant_id || $request->tenant_id === 'new') {
                $tenantData = [
                    'first_name' => $request->tenant_first_name,
                    'last_name' => $request->tenant_last_name,
                    'phone' => $request->tenant_phone,
                    'address' => $request->tenant_address,
                ];

                if ($request->hasFile('tenant_photo')) {
                    $tenantData['photo'] = $request->file('tenant_photo')->store('tenants/photos', 'public');
                }

                if ($request->hasFile('tenant_id_card')) {
                    $tenantData['id_card'] = $request->file('tenant_id_card')->store('tenants/id_cards', 'public');
                }

                $tenant = Tenant::create($tenantData);
                $validated['tenant_id'] = $tenant->id;
            }

            $rental = Rental::create([
                'property_id' => $validated['property_id'],
                'tenant_id' => $validated['tenant_id'],
                'deposit_amount' => $validated['deposit_amount'] ?? 0,
                'rent_amount' => $validated['rent_amount'] ?? 0,
                'payment_frequency' => $validated['payment_frequency'] ?? 'monthly',
                'start_date' => $validated['start_date'],
                'end_date' => $validated['end_date'] ?? null,
                'next_payment_date' => $validated['start_date'], // Le premier paiement est dû à la date de début
                'status' => 'active',
            ]);

            // Mettre à jour le statut du bien
            Property::where('id', $validated['property_id'])->update(['status' => 'rented']);

            // Créer automatiquement le premier paiement (caution)
            if ($rental->deposit_amount > 0) {
                Payment::create([
                    'rental_id' => $rental->id,
                    'amount' => $rental->deposit_amount,
                    'payment_date' => now(),
                    'period_start' => $rental->start_date,
                    'period_end' => $rental->start_date,
                    'type' => 'deposit',
                    'status' => 'paid',
                    'invoice_number' => 'DEP-'.strtoupper(uniqid('', true)),
                    'notes' => 'Caution initiale',
                ]);
            }

            return redirect()->route('rentals.index')
                ->with('success', 'Location enregistrée avec succès.');
        } catch (\Exception $e) {
            return back()->with('error', 'Une erreur est survenue lors de l'."'".'enregistrement de la location : '.$e->getMessage())->withInput();
        }
    }

    public function show(Rental $rental)
    {
        return Inertia::render('rentals/show', [
            'rental' => $rental->load(['property', 'tenant', 'payments' => function ($query) {
                $query->latest();
            }]),
        ]);
    }

    public function edit(Rental $rental)
    {
        $categories = PropertyCategory::all();

        $properties = Property::with('category')
            ->where(function ($query) use ($rental) {
                $query->where('status', 'available')
                    ->orWhere('id', $rental->property_id);
            })
            ->whereNull('parent_id')
            ->get();

        $buildings = Property::whereHas('category', function ($query) {
            $query->whereIn('slug', ['immeuble', 'batiment']);
        })->with(['apartments' => function ($query) use ($rental) {
            $query->where('status', 'available')
                ->orWhere('id', $rental->property_id);
        }])->get();

        $tenants = Tenant::all();

        return Inertia::render('rentals/edit', [
            'rental' => $rental->load(['property.category', 'tenant']),
            'categories' => $categories,
            'properties' => $properties,
            'buildings' => $buildings,
            'tenants' => $tenants,
        ]);
    }

    public function update(Request $request, Rental $rental)
    {
        try {
            $validated = $request->validate([
                'property_id' => 'required|exists:properties,id',
                'tenant_id' => 'required|exists:tenants,id',
                'deposit_amount' => 'nullable|numeric|min:0',
                'rent_amount' => 'nullable|numeric|min:0',
                'payment_frequency' => 'nullable|string|in:monthly,quarterly,semiannual',
                'start_date' => 'required|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
                'status' => 'required|string|in:active,completed,cancelled',
            ]);

            $oldPropertyId = $rental->property_id;

            $rental->update($validated);

            // Si le bien a changé, on met à jour les statuts
            if ($oldPropertyId != $validated['property_id']) {
                Property::where('id', $oldPropertyId)->update(['status' => 'available']);
                Property::where('id', $validated['property_id'])->update(['status' => 'rented']);
            }

            return redirect()->route('rentals.index')
                ->with('success', 'Location mise à jour avec succès.');
        } catch (\Exception $e) {
            return back()->with('error', 'Une erreur est survenue lors de la mise à jour : '.$e->getMessage())->withInput();
        }
    }

    public function destroy(Rental $rental)
    {
        try {
            $property = $rental->property;

            $rental->delete();

            // Mettre à jour le statut du bien
            $property->update(['status' => 'available']);

            return redirect()->route('rentals.index')
                ->with('success', 'Location supprimée avec succès.');
        } catch (\Exception $e) {
            return back()->with('error', 'Une erreur est survenue lors de la suppression : '.$e->getMessage());
        }
    }
}
