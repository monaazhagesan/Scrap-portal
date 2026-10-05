<?php

namespace Database\Factories;

use App\Enums\WeighmentDirection;
use App\Enums\WeighmentStatus;
use App\Models\Organization;
use App\Models\Weighment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Weighment>
 */
class WeighmentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $sequence = fake()->unique()->numberBetween(1, 999999);

        return [
            'organization_id' => Organization::factory(),
            'sequence' => $sequence,
            'ticket_no' => sprintf('WB-%06d', $sequence),
            'direction' => WeighmentDirection::Inward,
            'status' => WeighmentStatus::Open,
            'vehicle_number' => strtoupper(fake()->bothify('TN##??####')),
            'party_name' => fake()->company(),
            'first_weight' => fake()->numberBetween(8000, 25000),
            'first_weighed_at' => now(),
        ];
    }
}
