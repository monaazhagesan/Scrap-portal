<?php

namespace Tests\Feature;

use App\Enums\OrganizationRole;
use App\Models\Material;
use App\Models\Organization;
use App\Models\User;
use App\Models\Weighment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class InventoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_completed_weighments_move_stock_in_and_out()
    {
        $user = User::factory()->withOrganization()->create();
        $material = Material::factory()->for($user->currentOrganization)->create(['unit' => 'kg', 'purchase_rate' => 30]);
        $this->actingAs($user);

        $this->weigh($material, 'inward', 18000, 8000);   // +10,000 kg
        $this->weigh($material, 'outward', 7000, 11000);  //  -4,000 kg
        $this->post(route('weighments.store'), [          // open ticket: no stock effect
            'direction' => 'inward', 'vehicle_number' => 'TN01X1', 'material_id' => $material->id, 'first_weight' => 5000,
        ]);

        $this->get(route('inventory.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('inventory/index')
                ->where('materials.data.0.name', $material->name)
                ->where('materials.data.0.code', $material->code)
                ->where('materials.data.0.stock', 6000)
                ->where('materials.data.0.stock_value', 180000)
                ->where('summary.totalStock', 6000));
    }

    public function test_cancelling_a_completed_ticket_reverses_its_stock()
    {
        $user = User::factory()->withOrganization()->create();
        $material = Material::factory()->for($user->currentOrganization)->create();
        $this->actingAs($user);

        $weighment = $this->weigh($material, 'inward', 15000, 5000);
        $this->assertStock($material, 10000);

        $this->post(route('weighments.cancel', $weighment), ['reason' => 'Wrong material']);

        $this->assertStock($material, 0);
        $this->assertDatabaseHas('stock_movements', ['weighment_id' => $weighment->id, 'type' => 'reversal', 'quantity' => -10000]);
    }

    public function test_cancelling_an_open_ticket_does_not_touch_stock()
    {
        $user = User::factory()->withOrganization()->create();
        $material = Material::factory()->for($user->currentOrganization)->create();
        $weighment = Weighment::factory()->for($user->currentOrganization)->create(['material_id' => $material->id]);

        $this->actingAs($user)->post(route('weighments.cancel', $weighment), ['reason' => 'Driver left']);

        $this->assertDatabaseCount('stock_movements', 0);
    }

    public function test_managers_can_adjust_stock_and_staff_cannot()
    {
        $organization = Organization::factory()->active()->create();
        $manager = User::factory()->withOrganization($organization, OrganizationRole::Manager)->create();
        $staff = User::factory()->withOrganization($organization, OrganizationRole::Staff)->create();
        $material = Material::factory()->for($organization)->create();

        $this->actingAs($staff)
            ->post(route('inventory.adjust', $material), ['action' => 'add', 'quantity' => 500, 'reason' => 'Opening stock'])
            ->assertForbidden();

        $this->actingAs($manager)
            ->post(route('inventory.adjust', $material), ['action' => 'add', 'quantity' => 500, 'reason' => 'Opening stock'])
            ->assertRedirect(route('inventory.show', $material));
        $this->actingAs($manager)
            ->post(route('inventory.adjust', $material), ['action' => 'remove', 'quantity' => 120.5, 'reason' => 'Wastage']);

        $this->assertStock($material, 379.5);
    }

    public function test_ledger_shows_running_balance_newest_first()
    {
        $user = User::factory()->withOrganization()->create();
        $material = Material::factory()->for($user->currentOrganization)->create();
        $this->actingAs($user);

        $this->post(route('inventory.adjust', $material), ['action' => 'add', 'quantity' => 1000, 'reason' => 'Opening stock']);
        $this->weigh($material, 'outward', 5000, 5300);

        $this->get(route('inventory.show', $material))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('inventory/show')
                ->where('material.stock', 700)
                ->where('movements.data.0.type', 'outward')
                ->where('movements.data.0.balance', 700)
                ->where('movements.data.1.type', 'adjustment')
                ->where('movements.data.1.balance', 1000)
                ->where('canAdjust', true));
    }

    public function test_inventory_is_isolated_between_organizations()
    {
        $user = User::factory()->withOrganization()->create();
        $foreign = Material::factory()->create();

        $this->actingAs($user);

        $this->get(route('inventory.show', $foreign))->assertNotFound();
        $this->post(route('inventory.adjust', $foreign), ['action' => 'add', 'quantity' => 1, 'reason' => 'x'])->assertNotFound();
        $this->get(route('inventory.index'))
            ->assertInertia(fn (Assert $page) => $page->has('materials.data', 0));
    }

    protected function weigh(Material $material, string $direction, float $first, float $second): Weighment
    {
        $this->post(route('weighments.store'), [
            'direction' => $direction,
            'vehicle_number' => 'TN09AB1234',
            'material_id' => $material->id,
            'first_weight' => $first,
        ]);

        $weighment = Weighment::latest('id')->firstOrFail();
        $this->post(route('weighments.complete', $weighment), ['second_weight' => $second])->assertSessionHasNoErrors();

        return $weighment;
    }

    protected function assertStock(Material $material, float $expected): void
    {
        $this->assertEquals($expected, (float) $material->stockMovements()->sum('quantity'));
    }
}
