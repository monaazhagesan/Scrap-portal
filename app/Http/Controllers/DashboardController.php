<?php

namespace App\Http\Controllers;

use App\Enums\OrganizationRole;
use App\Models\Material;
use App\Models\Party;
use App\Support\CurrentOrganization;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request, CurrentOrganization $tenant): Response
    {
        $organization = $tenant->get();

        $accounts = null;

        if ($organization->userHasRole($request->user(), OrganizationRole::Owner, OrganizationRole::Admin, OrganizationRole::Manager)) {
            $balances = Party::query()->withBalance()->get()->pluck('balance')->map(fn ($balance) => (float) $balance);

            $accounts = [
                'receivable' => round($balances->filter(fn ($balance) => $balance > 0)->sum(), 2),
                'payable' => round(abs($balances->filter(fn ($balance) => $balance < 0)->sum()), 2),
            ];
        }

        return Inertia::render('dashboard', [
            'accounts' => $accounts,
            'stats' => [
                'materials' => Material::count(),
                'activeMaterials' => Material::where('is_active', true)->count(),
                'members' => $organization->users()->count(),
            ],
            'recentMaterials' => Material::latest()->limit(5)->get(['id', 'name', 'category', 'unit', 'purchase_rate', 'sale_rate']),
        ]);
    }
}
