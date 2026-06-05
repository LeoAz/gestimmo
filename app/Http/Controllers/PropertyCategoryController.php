<?php

namespace App\Http\Controllers;

use App\Models\PropertyCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class PropertyCategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render('property-categories/index', [
            'categories' => PropertyCategory::all(),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('property-categories/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:property_categories',
            'description' => 'nullable|string',
        ]);

        $validated['slug'] = Str::slug($validated['name']);

        PropertyCategory::create($validated);

        return redirect()->route('property-categories.index')
            ->with('success', 'Catégorie créée avec succès.');
    }

    /**
     * Display the specified resource.
     */
    public function show(PropertyCategory $propertyCategory)
    {
        return Inertia::render('property-categories/show', [
            'category' => $propertyCategory,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(PropertyCategory $propertyCategory)
    {
        return Inertia::render('property-categories/edit', [
            'category' => $propertyCategory,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, PropertyCategory $propertyCategory)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:property_categories,name,'.$propertyCategory->id,
            'description' => 'nullable|string',
        ]);

        $validated['slug'] = Str::slug($validated['name']);

        $propertyCategory->update($validated);

        return redirect()->route('property-categories.index')
            ->with('success', 'Catégorie mise à jour avec succès.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(PropertyCategory $propertyCategory)
    {
        $propertyCategory->delete();

        return redirect()->route('property-categories.index')
            ->with('success', 'Catégorie supprimée avec succès.');
    }
}
