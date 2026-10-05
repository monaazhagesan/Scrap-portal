<?php

namespace App\Http\Middleware;

use App\Support\CurrentOrganization;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Usage: ->middleware('org.role:owner,admin')
 */
class EnsureOrganizationRole
{
    public function __construct(protected CurrentOrganization $tenant) {}

    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $role = $this->tenant->get()?->roleOf($request->user());

        abort_unless($role && in_array($role->value, $roles, true), 403);

        return $next($request);
    }
}
