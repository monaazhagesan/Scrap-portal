<?php

namespace App\Http\Controllers;

use App\Enums\MaterialCategory;
use App\Enums\OrganizationRole;
use App\Enums\StockMovementType;
use App\Models\Material;
use App\Models\StockMovement;
use App\Support\CurrentOrganization;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class InventoryController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', Rule::enum(MaterialCategory::class)],
        ]);

        $materials = Material::query()
            ->withSum('stockMovements as stock', 'quantity')
            ->withMax('stockMovements as last_movement_at', 'created_at')
            ->when($filters['search'] ?? null, fn ($query, $search) => $query->where(fn ($query) => $query
                ->where('name', 'like', "%{$search}%")
                ->orWhere('code', 'like', "%{$search}%")))
            ->when($filters['category'] ?? null, fn ($query, $category) => $query->where('category', $category))
            ->orderBy('name')
            ->paginate(25)
            ->withQueryString()
            ->through(fn (Material $material) => $this->present($material));

        $all = Material::query()->withSum('stockMovements as stock', 'quantity')->get();

        return Inertia::render('inventory/index', [
            'materials' => $materials,
            'filters' => [
                'search' => $filters['search'] ?? '',
                'category' => $filters['category'] ?? '',
            ],
            'categories' => MaterialCategory::options(),
            'summary' => [
                'totalStock' => round((float) $all->sum('stock'), 2),
                'stockValue' => round($all->sum(fn (Material $material) => $this->value($material)), 2),
                'inStock' => $all->filter(fn (Material $material) => (float) $material->stock > 0)->count(),
                'negative' => $all->filter(fn (Material $material) => (float) $material->stock < 0)->count(),
            ],
        ]);
    }

    public function show(Request $request, Material $material, CurrentOrganization $tenant): Response
    {
        $material->loadSum('stockMovements as stock', 'quantity');
        $stock = (float) $material->stock;

        $movements = $material->stockMovements()
            ->with(['creator:id,name', 'weighment:id,ticket_no'])
            ->latest('id')
            ->paginate(25)
            ->withQueryString();

        // Running balance after each movement, newest first.
        $newestOnPage = $movements->first();
        $balance = $newestOnPage
            ? $stock - (float) $material->stockMovements()->where('id', '>', $newestOnPage->id)->sum('quantity')
            : $stock;

        $movements->through(function (StockMovement $movement) use (&$balance) {
            $row = [
                ...$movement->toArray(),
                'type_label' => $movement->type->label(),
                'balance' => round($balance, 2),
            ];
            $balance -= (float) $movement->quantity;

            return $row;
        });

        return Inertia::render('inventory/show', [
            'material' => $this->present($material),
            'movements' => $movements,
            'canAdjust' => $this->canAdjust($request, $tenant),
        ]);
    }

    public function adjust(Request $request, Material $material, CurrentOrganization $tenant): RedirectResponse
    {
        abort_unless($this->canAdjust($request, $tenant), 403);

        $validated = $request->validate([
            'action' => ['required', Rule::in(['add', 'remove'])],
            'quantity' => ['required', 'numeric', 'gt:0', 'max:99999999'],
            'reason' => ['required', 'string', 'max:255'],
        ]);

        $quantity = (float) $validated['quantity'];

        StockMovement::record($material, [
            'type' => StockMovementType::Adjustment,
            'quantity' => $validated['action'] === 'add' ? $quantity : -$quantity,
            'notes' => $validated['reason'],
            'created_by' => $request->user()->id,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Stock adjusted for :name.', ['name' => $material->name])]);

        return to_route('inventory.show', $material);
    }

    /**
     * @return array<string, mixed>
     */
    protected function present(Material $material): array
    {
        return [
            ...$material->only(['id', 'name', 'code', 'unit', 'purchase_rate', 'sale_rate', 'is_active']),
            'category' => $material->category->value,
            'category_label' => $material->category->label(),
            'stock' => round((float) $material->stock, 2),
            'stock_value' => $this->value($material),
            'last_movement_at' => $material->last_movement_at ?? null,
        ];
    }

    /**
     * Stock value at purchase rate. Stock is in kg; rates are per material unit.
     */
    protected function value(Material $material): float
    {
        $stock = (float) $material->stock;
        $quantity = $material->unit === 'ton' ? $stock / 1000 : $stock;

        return round(max($quantity, 0) * (float) $material->purchase_rate, 2);
    }

    protected function canAdjust(Request $request, CurrentOrganization $tenant): bool
    {
        $role = $tenant->get()->roleOf($request->user());

        return in_array($role, [OrganizationRole::Owner, OrganizationRole::Admin, OrganizationRole::Manager], true);
    }
}
