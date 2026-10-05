<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Starter',
                'slug' => 'starter',
                'description' => 'For a single scrap yard getting started.',
                'monthly_price' => 999,
                'yearly_price' => 9990,
                'max_users' => 3,
                'max_yards' => 1,
                'trial_days' => 14,
                'features' => ['Material & rate management', 'Purchase & sales entries', 'Basic reports'],
                'sort_order' => 1,
            ],
            [
                'name' => 'Business',
                'slug' => 'business',
                'description' => 'For growing dealers with multiple yards.',
                'monthly_price' => 2499,
                'yearly_price' => 24990,
                'max_users' => 15,
                'max_yards' => 5,
                'trial_days' => 14,
                'features' => ['Everything in Starter', 'Multiple yards', 'Inventory tracking', 'GST invoices'],
                'sort_order' => 2,
            ],
            [
                'name' => 'Enterprise',
                'slug' => 'enterprise',
                'description' => 'For recyclers and large processors.',
                'monthly_price' => 6999,
                'yearly_price' => 69990,
                'max_users' => null,
                'max_yards' => null,
                'trial_days' => 14,
                'features' => ['Everything in Business', 'Unlimited users & yards', 'API access', 'Priority support'],
                'sort_order' => 3,
            ],
        ];

        foreach ($plans as $plan) {
            Plan::updateOrCreate(['slug' => $plan['slug']], $plan);
        }
    }
}
