<?php

namespace App\Actions\Organizations;

use App\Enums\OrganizationRole;
use App\Enums\OrganizationStatus;
use App\Models\Organization;
use App\Models\Plan;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class CreateOrganization
{
    /**
     * Create a new tenant on the default plan's trial, owned by the given user.
     */
    public function handle(User $owner, string $name): Organization
    {
        return DB::transaction(function () use ($owner, $name) {
            $plan = Plan::where('slug', config('saas.default_plan'))->first();
            $trialDays = $plan?->trial_days ?: config('saas.trial_days');

            $organization = Organization::create([
                'name' => $name,
                'slug' => Organization::uniqueSlug($name),
                'email' => $owner->email,
                'plan_id' => $plan?->id,
                'status' => OrganizationStatus::Trial,
                'trial_ends_at' => now()->addDays($trialDays),
            ]);

            $organization->users()->attach($owner, ['role' => OrganizationRole::Owner->value]);

            $owner->switchOrganization($organization);

            return $organization;
        });
    }
}
