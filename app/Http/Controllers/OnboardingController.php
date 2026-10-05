<?php

namespace App\Http\Controllers;

use App\Actions\Organizations\CreateOrganization;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * For signed-in users who do not belong to any organization yet.
 */
class OnboardingController extends Controller
{
    public function create(Request $request): Response|RedirectResponse
    {
        if ($request->user()->organizations()->exists()) {
            return to_route('dashboard');
        }

        return Inertia::render('onboarding');
    }

    public function store(Request $request, CreateOrganization $createOrganization): RedirectResponse
    {
        $validated = $request->validate([
            'organization_name' => ['required', 'string', 'max:255'],
        ]);

        $createOrganization->handle($request->user(), $validated['organization_name']);

        return to_route('dashboard');
    }
}
