<?php

namespace App\Http\Middleware;

use App\Support\CurrentOrganization;
use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

/**
 * Sends tenants whose trial or subscription has lapsed to the billing page.
 */
class EnsureSubscribed
{
    public function __construct(protected CurrentOrganization $tenant) {}

    public function handle(Request $request, Closure $next): Response
    {
        if (! $this->tenant->get()?->hasActiveSubscription()) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => __('Your subscription is inactive. Please choose a plan to continue.'),
            ]);

            return to_route('billing.show');
        }

        return $next($request);
    }
}
