<?php

namespace Tests\Feature;

use App\Enums\OrganizationRole;
use App\Enums\WeighmentStatus;
use App\Models\Material;
use App\Models\Organization;
use App\Models\User;
use App\Models\Weighment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class WeighbridgeTest extends TestCase
{
    use RefreshDatabase;

    public function test_first_weighment_opens_a_ticket_with_a_per_organization_number()
    {
        $user = User::factory()->withOrganization()->create();
        $other = User::factory()->withOrganization()->create();

        $this->actingAs($other)->post(route('weighments.store'), $this->firstWeighment());

        $this->actingAs($user)->post(route('weighments.store'), $this->firstWeighment(['vehicle_number' => 'tn 09 ab 1234']));
        $response = $this->actingAs($user)->post(route('weighments.store'), $this->firstWeighment());

        $weighments = Weighment::where('organization_id', $user->current_organization_id)->orderBy('id')->get();

        $this->assertSame(['WB-000001', 'WB-000002'], $weighments->pluck('ticket_no')->all());
        $this->assertSame('TN09AB1234', $weighments[0]->vehicle_number);
        $this->assertSame(WeighmentStatus::Open, $weighments[0]->status);
        $this->assertSame($user->id, $weighments[0]->created_by);
        $response->assertRedirect(route('weighments.show', $weighments[1]));
    }

    public function test_second_weighment_computes_net_weight_and_amount()
    {
        $user = User::factory()->withOrganization()->create();
        $material = Material::factory()->for($user->currentOrganization)->create(['unit' => 'kg', 'purchase_rate' => 32]);

        $this->actingAs($user)->post(route('weighments.store'), $this->firstWeighment([
            'material_id' => $material->id,
            'first_weight' => 18500,
        ]));
        $weighment = Weighment::firstOrFail();

        $this->actingAs($user)->post(route('weighments.complete', $weighment), [
            'second_weight' => 7200,
            'deduction' => 100,
            'rate' => 32,
        ])->assertRedirect(route('weighments.show', $weighment));

        $weighment->refresh();
        $this->assertSame(WeighmentStatus::Completed, $weighment->status);
        $this->assertSame('18500.00', $weighment->gross_weight);
        $this->assertSame('7200.00', $weighment->tare_weight);
        $this->assertSame('11200.00', $weighment->net_weight);
        $this->assertSame('358400.00', $weighment->amount);
        $this->assertSame($user->id, $weighment->completed_by);
    }

    public function test_rate_per_ton_is_converted_from_kilograms()
    {
        $user = User::factory()->withOrganization()->create();
        $material = Material::factory()->for($user->currentOrganization)->create(['unit' => 'ton']);

        $this->actingAs($user)->post(route('weighments.store'), $this->firstWeighment([
            'direction' => 'outward',
            'material_id' => $material->id,
            'first_weight' => 6000,
        ]));
        $weighment = Weighment::firstOrFail();

        $this->actingAs($user)->post(route('weighments.complete', $weighment), [
            'second_weight' => 16000,
            'rate' => 35000,
        ]);

        $this->assertSame('10000.00', $weighment->fresh()->net_weight);
        $this->assertSame('350000.00', $weighment->fresh()->amount);
    }

    public function test_invalid_second_weighments_are_rejected()
    {
        $user = User::factory()->withOrganization()->create();
        $this->actingAs($user)->post(route('weighments.store'), $this->firstWeighment(['first_weight' => 10000]));
        $weighment = Weighment::firstOrFail();

        $this->post(route('weighments.complete', $weighment), ['second_weight' => 10000])
            ->assertSessionHasErrors('second_weight');
        $this->post(route('weighments.complete', $weighment), ['second_weight' => 4000, 'deduction' => 6000])
            ->assertSessionHasErrors('deduction');

        $this->post(route('weighments.complete', $weighment), ['second_weight' => 4000])->assertSessionHasNoErrors();
        $this->post(route('weighments.complete', $weighment), ['second_weight' => 3000])
            ->assertSessionHasErrors('second_weight');

        $this->assertSame('6000.00', $weighment->fresh()->net_weight);
    }

    public function test_materials_from_another_organization_cannot_be_used()
    {
        $user = User::factory()->withOrganization()->create();
        $foreignMaterial = Material::factory()->create();

        $this->actingAs($user)
            ->post(route('weighments.store'), $this->firstWeighment(['material_id' => $foreignMaterial->id]))
            ->assertSessionHasErrors('material_id');
    }

    public function test_tickets_are_isolated_between_organizations()
    {
        $user = User::factory()->withOrganization()->create();
        $foreign = Weighment::factory()->create();

        $this->actingAs($user);

        $this->get(route('weighments.show', $foreign))->assertNotFound();
        $this->post(route('weighments.complete', $foreign), ['second_weight' => 1000])->assertNotFound();
        $this->get(route('weighments.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('weighments/index')->has('weighments.data', 0));
    }

    public function test_only_managers_and_above_can_cancel_tickets()
    {
        $organization = Organization::factory()->active()->create();
        $staff = User::factory()->withOrganization($organization, OrganizationRole::Staff)->create();
        $manager = User::factory()->withOrganization($organization, OrganizationRole::Manager)->create();
        $weighment = Weighment::factory()->for($organization)->create();

        $this->actingAs($staff)->post(route('weighments.cancel', $weighment), ['reason' => 'Wrong vehicle'])->assertForbidden();

        $this->actingAs($manager)->post(route('weighments.cancel', $weighment), ['reason' => 'Wrong vehicle'])->assertRedirect();
        $this->assertSame(WeighmentStatus::Cancelled, $weighment->fresh()->status);
        $this->assertStringContainsString('Wrong vehicle', $weighment->fresh()->remarks);
    }

    public function test_weighbridge_pages_render()
    {
        $user = User::factory()->withOrganization()->create();
        $weighment = Weighment::factory()->for($user->currentOrganization)->create();

        $this->actingAs($user);

        $this->get(route('weighments.index'))->assertOk();
        $this->get(route('weighments.create'))->assertOk();
        $this->get(route('weighments.show', $weighment))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('weighments/show')
                ->where('weighment.ticket_no', $weighment->ticket_no)
                ->where('canCancel', true));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function firstWeighment(array $overrides = []): array
    {
        return [
            'direction' => 'inward',
            'vehicle_number' => 'TN09AB1234',
            'party_name' => 'Ravi Metals',
            'first_weight' => 15000,
            ...$overrides,
        ];
    }
}
