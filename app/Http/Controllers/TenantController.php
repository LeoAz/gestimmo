<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TenantController extends Controller
{
    public function index(Request $request)
    {
        $query = Tenant::withCount('rentals');

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

    public function show(Tenant $tenant)
    {
        $tenant->load(['rentals.property.parent']);

        return Inertia::render('tenants/show', [
            'tenant' => $tenant,
            'rentals' => $tenant->rentals()->with(['property.parent'])->latest()->get(),
        ]);
    }
}
