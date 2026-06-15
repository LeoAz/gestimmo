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
            'rooms_count' => 'nullable|integer',
            'bedrooms_count' => 'nullable|integer',
            'bathrooms_count' => 'nullable|integer',
            'living_rooms_count' => 'nullable|integer',
            'balconies_count' => 'nullable|integer',
            'kitchens_count' => 'nullable|integer',
            'has_kitchen' => 'nullable|boolean',
            'has_solar_panels' => 'nullable|boolean',
            'has_generator' => 'nullable|boolean',
            'status' => 'nullable|in:available,sold,rented',
        ]);

        $property = Property::create($validated);

        return redirect()->route('properties.show', $property)
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

        return Inertia::render('properties/show', [
            'property' => $property,
            'rentals' => $rentals,
            'categories' => PropertyCategory::all(),
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
            'rooms_count' => 'nullable|integer',
            'bedrooms_count' => 'nullable|integer',
            'bathrooms_count' => 'nullable|integer',
            'living_rooms_count' => 'nullable|integer',
            'balconies_count' => 'nullable|integer',
            'kitchens_count' => 'nullable|integer',
            'has_kitchen' => 'nullable|boolean',
            'has_solar_panels' => 'nullable|boolean',
            'has_generator' => 'nullable|boolean',
            'status' => 'nullable|in:available,sold,rented',
        ]);

        $property->update($validated);

        return redirect()->route('properties.show', $property)
            ->with('success', 'Bien immobilier mis à jour avec succès.');
    }

    /**
     * Add an apartment to a property.
     */
    public function addApartment(Request $request, Property $property)
    {
        $this->sanitizePropertyData($request);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'floor_number' => 'required|integer',
            'price' => 'nullable|numeric',
            'rooms_count' => 'nullable|integer',
            'bedrooms_count' => 'nullable|integer',
            'bathrooms_count' => 'nullable|integer',
            'living_rooms_count' => 'nullable|integer',
            'balconies_count' => 'nullable|integer',
            'kitchens_count' => 'nullable|integer',
            'has_kitchen' => 'nullable|boolean',
            'status' => 'required|in:available,sold,rented',
        ]);

        $property->apartments()->create(array_merge($validated, [
            'property_category_id' => PropertyCategory::where('slug', 'appartement')->first()?->id ?? $property->property_category_id,
        ]));

        return back()->with('success', 'Appartement ajouté avec succès.');
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
            'price', 'floor_number', 'rooms_count',
            'bedrooms_count', 'bathrooms_count', 'living_rooms_count',
            'balconies_count', 'kitchens_count',
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
