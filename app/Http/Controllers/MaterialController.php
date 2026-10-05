<?php

namespace App\Http\Controllers;

use App\Enums\MaterialCategory;
use App\Http\Requests\MaterialRequest;
use App\Models\Material;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MaterialController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->toString();

        $materials = Material::query()
            ->when($search, fn ($query) => $query->where(fn ($query) => $query
                ->where('name', 'like', "%{$search}%")
                ->orWhere('code', 'like', "%{$search}%")))
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('materials/index', [
            'materials' => $materials,
            'filters' => ['search' => $search],
            'categories' => MaterialCategory::options(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('materials/create', $this->formOptions());
    }

    public function store(MaterialRequest $request): RedirectResponse
    {
        Material::create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Material created.')]);

        return to_route('materials.index');
    }

    public function edit(Material $material): Response
    {
        return Inertia::render('materials/edit', [
            'material' => $material,
            ...$this->formOptions(),
        ]);
    }

    public function update(MaterialRequest $request, Material $material): RedirectResponse
    {
        $material->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Material updated.')]);

        return to_route('materials.index');
    }

    public function destroy(Material $material): RedirectResponse
    {
        $material->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Material deleted.')]);

        return to_route('materials.index');
    }

    /**
     * @return array<string, mixed>
     */
    protected function formOptions(): array
    {
        return [
            'categories' => MaterialCategory::options(),
            'units' => Material::UNITS,
        ];
    }
}
