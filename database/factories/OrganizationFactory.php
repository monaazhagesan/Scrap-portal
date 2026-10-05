<?php

namespace Database\Factories;

use App\Enums\OrganizationStatus;
use App\Models\Organization;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Organization>
 */
class OrganizationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->company().' Scrap Traders',
            'email' => fake()->companyEmail(),
            'phone' => fake()->phoneNumber(),
            'status' => OrganizationStatus::Trial,
            'trial_ends_at' => now()->addDays(14),
        ];
    }

    public function active(): static
    {
        return $this->state(fn () => [
            'status' => OrganizationStatus::Active,
            'trial_ends_at' => null,
            'subscription_ends_at' => now()->addMonth(),
        ]);
    }

    public function expired(): static
    {
        return $this->state(fn () => [
            'status' => OrganizationStatus::Trial,
            'trial_ends_at' => now()->subDay(),
        ]);
    }
}
