<?php

namespace Database\Factories;

use App\Enums\MaterialCategory;
use App\Models\Material;
use App\Models\Organization;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Material>
 */
class MaterialFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $purchaseRate = fake()->randomFloat(2, 10, 600);

        return [
            'organization_id' => Organization::factory(),
            'name' => fake()->unique()->words(2, true),
            'code' => strtoupper(fake()->bothify('???-##')),
            'category' => fake()->randomElement(MaterialCategory::cases()),
            'unit' => 'kg',
            'purchase_rate' => $purchaseRate,
            'sale_rate' => round($purchaseRate * 1.1, 2),
            'is_active' => true,
        ];
    }
}
