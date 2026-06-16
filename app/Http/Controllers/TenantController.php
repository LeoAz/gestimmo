<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class TenantController extends Controller
{
    public function index(Request $request)
    {
        $query = Tenant::withCount(['rentals' => function ($query) {
            $query->where('status', 'active');
        }]);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%");
            });
        }

        return Inertia::render('tenants/index', [
            'tenants' => $query->latest()->get(),
            'filters' => $request->only(['search']),
        ]);
    }

    public function create()
    {
        return Inertia::render('tenants/create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'phone' => 'required|string|max:255',
            'address' => 'required|string',
            'photo' => 'nullable|image|max:2048',
            'id_card' => 'nullable|file|max:2048',
        ]);

        if ($request->hasFile('photo')) {
            $validated['photo'] = $request->file('photo')->store('tenants/photos', 'public');
        }

        if ($request->hasFile('id_card')) {
            $validated['id_card'] = $request->file('id_card')->store('tenants/id_cards', 'public');
        }

        Tenant::create($validated);

        return redirect()->route('tenants.index')->with('success', 'Locataire créé avec succès.');
    }

    public function show(Tenant $tenant)
    {
        $tenant->load(['rentals.property.parent']);

        return Inertia::render('tenants/show', [
            'tenant' => $tenant,
            'rentals' => $tenant->rentals()->with(['property.parent'])->latest()->get(),
        ]);
    }

    public function edit(Tenant $tenant)
    {
        return Inertia::render('tenants/edit', [
            'tenant' => $tenant,
        ]);
    }

    public function update(Request $request, Tenant $tenant)
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'phone' => 'required|string|max:255',
            'address' => 'required|string',
            'photo' => 'nullable|image|max:2048',
            'id_card' => 'nullable|file|max:2048',
        ]);

        if ($request->hasFile('photo')) {
            if ($tenant->photo) {
                Storage::disk('public')->delete($tenant->photo);
            }
            $validated['photo'] = $request->file('photo')->store('tenants/photos', 'public');
        }

        if ($request->hasFile('id_card')) {
            if ($tenant->id_card) {
                Storage::disk('public')->delete($tenant->id_card);
            }
            $validated['id_card'] = $request->file('id_card')->store('tenants/id_cards', 'public');
        }

        $tenant->update($validated);

        return redirect()->route('tenants.index')->with('success', 'Locataire mis à jour avec succès.');
    }

    public function destroy(Tenant $tenant)
    {
        $activeRentalsCount = $tenant->rentals()->where('status', 'active')->count();

        if ($activeRentalsCount > 0) {
            return redirect()->back()->with('error', 'Impossible de supprimer un locataire ayant une location active.');
        }

        if ($tenant->photo) {
            Storage::disk('public')->delete($tenant->photo);
        }

        if ($tenant->id_card) {
            Storage::disk('public')->delete($tenant->id_card);
        }

        $tenant->delete();

        return redirect()->route('tenants.index')->with('success', 'Locataire supprimé avec succès.');
    }
}
