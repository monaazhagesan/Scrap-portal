<?php

namespace Tests\Feature;

use App\Enums\MaterialCategory;
use App\Enums\OrganizationRole;
use App\Enums\OrganizationStatus;
use App\Models\Material;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TenancyTest extends TestCase
{
    use RefreshDatabase;

    public function test_users_only_see_their_own_organizations_materials()
    {
        $user = User::factory()->withOrganization()->create();
        Material::factory()->for($user->currentOrganization)->create(['name' => 'Mine']);
        Material::factory()->create(['name' => 'Someone else']);

        $this->actingAs($user)
            ->get(route('materials.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('materials/index')
                ->has('materials.data', 1)
                ->where('materials.data.0.name', 'Mine'));
    }

    public function test_users_cannot_access_another_organizations_material_by_id()
    {
        $user = User::factory()->withOrganization()->create();
        $foreign = Material::factory()->create();

        $this->actingAs($user);

        $this->get(route('materials.edit', $foreign))->assertNotFound();
        $this->put(route('materials.update', $foreign), [
            'name' => 'Hijacked',
            'category' => 'ferrous',
            'unit' => 'kg',
            'purchase_rate' => 1,
            'sale_rate' => 1,
        ])->assertNotFound();
        $this->delete(route('materials.destroy', $foreign))->assertNotFound();

        $this->assertModelExists($foreign);
    }

    public function test_created_materials_belong_to_the_current_organization()
    {
        $user = User::factory()->withOrganization()->create();

        $this->actingAs($user)->post(route('materials.store'), [
            'name' => 'Copper Armature',
            'category' => MaterialCategory::NonFerrous->value,
            'unit' => 'kg',
            'purchase_rate' => 720,
            'sale_rate' => 760,
            'is_active' => '1',
        ])->assertRedirect(route('materials.index'));

        $this->assertDatabaseHas('materials', [
            'name' => 'Copper Armature',
            'organization_id' => $user->current_organization_id,
        ]);
    }

    public function test_material_names_are_unique_per_organization_only()
    {
        $user = User::factory()->withOrganization()->create();
        Material::factory()->create(['name' => 'Cast Iron']);

        $payload = [
            'name' => 'Cast Iron',
            'category' => 'ferrous',
            'unit' => 'kg',
            'purchase_rate' => 28,
            'sale_rate' => 31,
        ];

        $this->actingAs($user)->post(route('materials.store'), $payload)->assertSessionHasNoErrors();
        $this->actingAs($user)->post(route('materials.store'), $payload)->assertSessionHasErrors('name');
    }

    public function test_expired_trials_are_sent_to_billing()
    {
        $organization = Organization::factory()->expired()->create();
        $user = User::factory()->withOrganization($organization)->create();

        $this->actingAs($user)->get(route('dashboard'))->assertRedirect(route('billing.show'));
        $this->actingAs($user)->get(route('billing.show'))->assertOk();
    }

    public function test_staff_cannot_manage_organization_settings()
    {
        $organization = Organization::factory()->active()->create();
        $staff = User::factory()->withOrganization($organization, OrganizationRole::Staff)->create();
        $owner = User::factory()->withOrganization($organization)->create();

        $this->actingAs($staff)->get(route('organization.edit'))->assertForbidden();
        $this->actingAs($owner)->get(route('organization.edit'))->assertOk();
    }

    public function test_only_super_admins_can_manage_tenants()
    {
        $organization = Organization::factory()->create();
        $user = User::factory()->withOrganization()->create();
        $admin = User::factory()->create();
        $admin->forceFill(['is_super_admin' => true])->save();

        $this->actingAs($user)->get(route('admin.organizations.index'))->assertForbidden();

        $this->actingAs($admin)->get(route('admin.organizations.index'))->assertOk();
        $this->actingAs($admin)->patch(route('admin.organizations.update', $organization), [
            'status' => OrganizationStatus::Active->value,
            'subscription_ends_at' => now()->addYear()->toDateString(),
        ])->assertRedirect();

        $this->assertSame(OrganizationStatus::Active, $organization->fresh()->status);
    }
}
