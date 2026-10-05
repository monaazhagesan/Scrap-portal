<?php

namespace Database\Factories;

use App\Enums\PartyType;
use App\Models\Organization;
use App\Models\Party;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Party>
 */
class PartyFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'organization_id' => Organization::factory(),
            'name' => fake()->unique()->company(),
            'type' => PartyType::Both,
            'phone' => fake()->numerify('9#########'),
            'opening_balance' => 0,
            'is_active' => true,
        ];
    }

    public function supplier(): static
    {
        return $this->state(fn () => ['type' => PartyType::Supplier]);
    }

    public function customer(): static
    {
        return $this->state(fn () => ['type' => PartyType::Customer]);
    }
}
