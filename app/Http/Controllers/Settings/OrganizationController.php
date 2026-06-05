<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class OrganizationController extends Controller
{
    /**
     * Display a listing of the organizations.
     */
    public function index(): Response
    {
        $organizations = Organization::all()->map(function ($organization) {
            if ($organization->logo) {
                $organization->logo_url = asset('storage/'.$organization->logo);
            }

            return $organization;
        });

        return Inertia::render('organizations/index', [
            'organizations' => $organizations,
        ]);
    }

    /**
     * Show the form for creating a new organization.
     */
    public function create(): Response
    {
        return Inertia::render('organizations/create');
    }

    /**
     * Store a newly created organization in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'website' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'country' => 'nullable|string|max:255',
            'tax_number' => 'nullable|string|max:255',
            'registration_number' => 'nullable|string|max:255',
            'bank_details' => 'nullable|string',
            'logo' => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('organizations', 'public');
            $validated['logo'] = $path;
        }

        Organization::create($validated);

        return redirect()->route('organizations.index')->with('status', 'organization-created');
    }

    /**
     * Display the specified organization.
     */
    public function show(Organization $organization): Response
    {
        if ($organization->logo) {
            $organization->logo_url = asset('storage/'.$organization->logo);
        }

        return Inertia::render('organizations/show', [
            'organization' => $organization,
        ]);
    }

    /**
     * Show the form for editing the specified organization.
     */
    public function edit(Organization $organization): Response
    {
        if ($organization->logo) {
            $organization->logo_url = asset('storage/'.$organization->logo);
        }

        return Inertia::render('organizations/edit', [
            'organization' => $organization,
        ]);
    }

    /**
     * Update the specified organization in storage.
     */
    public function update(Request $request, Organization $organization): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'website' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'country' => 'nullable|string|max:255',
            'tax_number' => 'nullable|string|max:255',
            'registration_number' => 'nullable|string|max:255',
            'bank_details' => 'nullable|string',
            'logo' => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('logo')) {
            // Delete old logo
            if ($organization->logo) {
                Storage::disk('public')->delete($organization->logo);
            }
            $path = $request->file('logo')->store('organizations', 'public');
            $validated['logo'] = $path;
        }

        $organization->update($validated);

        return redirect()->route('organizations.index')->with('status', 'organization-updated');
    }

    /**
     * Remove the specified organization from storage.
     */
    public function destroy(Organization $organization): RedirectResponse
    {
        if ($organization->logo) {
            Storage::disk('public')->delete($organization->logo);
        }

        $organization->delete();

        return redirect()->route('organizations.index')->with('status', 'organization-deleted');
    }
}
