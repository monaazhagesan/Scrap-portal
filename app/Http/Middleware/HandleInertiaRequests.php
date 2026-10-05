<?php

namespace App\Http\Middleware;

use App\Support\CurrentOrganization;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user(),
            ],
            // Resolved lazily, after the `tenant` route middleware has run.
            'tenant' => fn () => $this->tenant($request),
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    protected function tenant(Request $request): ?array
    {
        // Outside `tenant` routes (e.g. profile settings), fall back to the user's current organization for display.
        $organization = app(CurrentOrganization::class)->get() ?? $request->user()?->currentOrganization;

        if (! $organization || ! $request->user()) {
            return null;
        }

        return [
            'id' => $organization->id,
            'name' => $organization->name,
            'slug' => $organization->slug,
            'plan' => $organization->plan?->name,
            'status' => $organization->status->value,
            'onTrial' => $organization->onTrial(),
            'trialDaysLeft' => $organization->trialDaysLeft(),
            'role' => $organization->roleOf($request->user())?->value,
        ];
    }
}
