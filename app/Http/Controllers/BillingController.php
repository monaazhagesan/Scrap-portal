<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use App\Support\CurrentOrganization;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Shows the tenant's plan and subscription status.
 *
 * TODO: integrate a payment gateway (e.g. Razorpay / Stripe via Laravel Cashier) for self-serve upgrades.
 * Until then, plans and subscription status are assigned by a super admin from /admin/organizations.
 */
class BillingController extends Controller
{
    public function show(CurrentOrganization $tenant): Response
    {
        $organization = $tenant->get()->load('plan');

        return Inertia::render('billing', [
            'subscription' => [
                'plan' => $organization->plan?->only(['id', 'name']),
                'status' => $organization->status->value,
                'statusLabel' => $organization->status->label(),
                'onTrial' => $organization->onTrial(),
                'trialEndsAt' => $organization->trial_ends_at?->toDateString(),
                'subscriptionEndsAt' => $organization->subscription_ends_at?->toDateString(),
                'isActive' => $organization->hasActiveSubscription(),
            ],
            'plans' => Plan::active()->get(),
        ]);
    }
}
