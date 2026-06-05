<?php

namespace App\Http\Controllers;

use App\Models\Property;
use App\Models\PropertyCategory;
use App\Models\Rental;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PropertyController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render('properties/index', [
            'properties' => Property::with('category', 'apartments')->whereNull('parent_id')->get(),
            'categories' => PropertyCategory::all(),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('properties/create', [
            'categories' => PropertyCategory::all(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $this->sanitizePropertyData($request);

        $validated = $request->validate([
            'property_category_id' => 'required|exists:property_categories,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'address' => 'nullable|string',
            'city' => 'nullable|string',
            'price' => 'nullable|numeric',
            'type' => 'nullable|string|max:255',
            'floor_number' => 'nullable|integer',
            'surface_area' => 'nullable|numeric',
            'rooms_count' => 'nullable|integer',
            'bedrooms_count' => 'nullable|integer',
            'bathrooms_count' => 'nullable|integer',
            'living_rooms_count' => 'nullable|integer',
            'has_kitchen' => 'nullable|boolean',
            'has_solar_panels' => 'nullable|boolean',
            'has_generator' => 'nullable|boolean',
            'status' => 'required|in:available,sold,rented',
            'apartments' => 'nullable|array',
            'apartments.*.title' => 'required|string|max:255',
            'apartments.*.floor_number' => 'required|integer',
            'apartments.*.price' => 'nullable|numeric',
            'apartments.*.surface_area' => 'nullable|numeric',
            'apartments.*.rooms_count' => 'nullable|integer',
            'apartments.*.bedrooms_count' => 'nullable|integer',
            'apartments.*.bathrooms_count' => 'nullable|integer',
            'apartments.*.living_rooms_count' => 'nullable|integer',
            'apartments.*.has_kitchen' => 'nullable|boolean',
        ]);

        $property = Property::create($validated);

        if ($request->has('apartments')) {
            foreach ($request->apartments as $apartmentData) {
                $property->apartments()->create(array_merge($apartmentData, [
                    'property_category_id' => PropertyCategory::where('slug', 'appartement')->first()?->id ?? $property->property_category_id,
                    'status' => 'available',
                ]));
            }
        }

        return redirect()->route('properties.index')
            ->with('success', 'Bien immobilier créé avec succès.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Property $property)
    {
        $property->load(['category', 'apartments']);

        $rentals = Rental::with(['tenant', 'payments'])
            ->where(function ($query) use ($property) {
                $query->where('property_id', $property->id)
                    ->orWhereIn('property_id', $property->apartments->pluck('id'));
            })
            ->orderByDesc('created_at')
            ->get();

        $stats = [
            'total_revenue' => $rentals->flatMap->payments->sum('amount'),
            'active_rentals_count' => $rentals->where('status', 'active')->count(),
            'total_rentals_count' => $rentals->count(),
            'monthly_revenue' => $rentals->flatMap->payments
                ->where('payment_date', '>=', now()->startOfMonth())
                ->sum('amount'),
        ];

        return Inertia::render('properties/show', [
            'property' => $property,
            'rentals' => $rentals,
            'stats' => $stats,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Property $property)
    {
        return Inertia::render('properties/edit', [
            'property' => $property->load('apartments'),
            'categories' => PropertyCategory::all(),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Property $property)
    {
        $this->sanitizePropertyData($request);

        $validated = $request->validate([
            'property_category_id' => 'required|exists:property_categories,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'address' => 'nullable|string',
            'city' => 'nullable|string',
            'price' => 'nullable|numeric',
            'type' => 'nullable|string|max:255',
            'floor_number' => 'nullable|integer',
            'surface_area' => 'nullable|numeric',
            'rooms_count' => 'nullable|integer',
            'bedrooms_count' => 'nullable|integer',
            'bathrooms_count' => 'nullable|integer',
            'living_rooms_count' => 'nullable|integer',
            'has_kitchen' => 'nullable|boolean',
            'has_solar_panels' => 'nullable|boolean',
            'has_generator' => 'nullable|boolean',
            'status' => 'required|in:available,sold,rented',
            'apartments' => 'nullable|array',
            'apartments.*.id' => 'nullable|exists:properties,id',
            'apartments.*.title' => 'required|string|max:255',
            'apartments.*.floor_number' => 'required|integer',
            'apartments.*.price' => 'nullable|numeric',
            'apartments.*.surface_area' => 'nullable|numeric',
            'apartments.*.rooms_count' => 'nullable|integer',
            'apartments.*.bedrooms_count' => 'nullable|integer',
            'apartments.*.bathrooms_count' => 'nullable|integer',
            'apartments.*.living_rooms_count' => 'nullable|integer',
            'apartments.*.has_kitchen' => 'nullable|boolean',
        ]);

        $property->update($validated);

        if ($request->has('apartments')) {
            $apartmentIds = collect($request->apartments)->pluck('id')->filter()->toArray();
            $property->apartments()->whereNotIn('id', $apartmentIds)->delete();

            foreach ($request->apartments as $apartmentData) {
                if (isset($apartmentData['id'])) {
                    $property->apartments()->where('id', $apartmentData['id'])->update($apartmentData);
                } else {
                    $property->apartments()->create(array_merge($apartmentData, [
                        'property_category_id' => PropertyCategory::where('slug', 'appartement')->first()?->id ?? $property->property_category_id,
                        'status' => 'available',
                    ]));
                }
            }
        }

        return redirect()->route('properties.index')
            ->with('success', 'Bien immobilier mis à jour avec succès.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Property $property)
    {
        $property->delete();

        return redirect()->route('properties.index')
            ->with('success', 'Bien immobilier supprimé avec succès.');
    }

    /**
     * Sanitize numeric and boolean property data.
     */
    private function sanitizePropertyData(Request $request): void
    {
        $numericFields = [
            'price', 'floor_number', 'surface_area', 'rooms_count',
            'bedrooms_count', 'bathrooms_count', 'living_rooms_count',
        ];

        foreach ($numericFields as $field) {
            if ($request->has($field) && $request->input($field) === '') {
                $request->merge([$field => null]);
            }
        }

        $booleanFields = ['has_kitchen', 'has_solar_panels', 'has_generator'];

        foreach ($booleanFields as $field) {
            if ($request->has($field)) {
                $value = $request->input($field);
                $request->merge([$field => filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE)]);
            }
        }

        if ($request->has('apartments') && is_array($request->input('apartments'))) {
            $apartments = $request->input('apartments');
            foreach ($apartments as $index => $apartment) {
                foreach ($numericFields as $field) {
                    if (isset($apartment[$field]) && $apartment[$field] === '') {
                        $apartments[$index][$field] = null;
                    }
                }
                if (isset($apartment['has_kitchen'])) {
                    $apartments[$index]['has_kitchen'] = filter_var($apartment['has_kitchen'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
                }
            }
            $request->merge(['apartments' => $apartments]);
        }
    }
}
