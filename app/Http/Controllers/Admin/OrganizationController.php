<?php

namespace App\Http\Controllers\Admin;

use App\Enums\OrganizationStatus;
use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\Plan;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Platform (super admin) management of all tenants.
 */
class OrganizationController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->toString();

        $organizations = Organization::query()
            ->with('plan:id,name')
            ->withCount('users')
            ->when($search, fn ($query) => $query->where(fn ($query) => $query
                ->where('name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('admin/organizations/index', [
            'organizations' => $organizations,
            'filters' => ['search' => $search],
            'plans' => Plan::active()->get(['id', 'name']),
            'statuses' => array_map(
                fn (OrganizationStatus $status) => ['value' => $status->value, 'label' => $status->label()],
                OrganizationStatus::cases(),
            ),
            'stats' => [
                'total' => Organization::count(),
                'trial' => Organization::where('status', OrganizationStatus::Trial)->count(),
                'active' => Organization::where('status', OrganizationStatus::Active)->count(),
            ],
        ]);
    }

    public function update(Request $request, Organization $organization): RedirectResponse
    {
        $validated = $request->validate([
            'plan_id' => ['nullable', Rule::exists('plans', 'id')],
            'status' => ['required', Rule::enum(OrganizationStatus::class)],
            'trial_ends_at' => ['nullable', 'date'],
            'subscription_ends_at' => ['nullable', 'date'],
        ]);

        $organization->update($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Organization updated.')]);

        return back();
    }
}
