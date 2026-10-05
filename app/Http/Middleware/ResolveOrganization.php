<?php

namespace App\Http\Middleware;

use App\Support\CurrentOrganization;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Resolves the authenticated user's current organization and binds it as the active tenant.
 *
 * Runs before route model binding (see bootstrap/app.php) so tenant-scoped models resolve inside the tenant.
 */
class ResolveOrganization
{
    public function __construct(protected CurrentOrganization $tenant) {}

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        $organization = $user->currentOrganization;

        if (! $organization || ! $user->belongsToOrganization($organization)) {
            $organization = $user->organizations()->first();

            if (! $organization) {
                return $user->is_super_admin
                    ? to_route('admin.organizations.index')
                    : to_route('onboarding.create');
            }

            $user->switchOrganization($organization);
        }

        $this->tenant->set($organization);

        return $next($request);
    }
}
