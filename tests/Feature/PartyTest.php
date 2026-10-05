<?php

namespace Tests\Feature;

use App\Enums\OrganizationRole;
use App\Models\Organization;
use App\Models\Party;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PartyTest extends TestCase
{
    use RefreshDatabase;

    public function test_parties_can_be_created_with_an_opening_balance()
    {
        $user = User::factory()->withOrganization()->create();

        $this->actingAs($user)->post(route('parties.store'), [
            'name' => 'Chennai Steel Rolling Mills',
            'type' => 'customer',
            'gstin' => '33aabcc1234d1z5',
            'pan' => 'aabcc1234d',
            'opening_amount' => 125000,
            'opening_type' => 'receivable',
        ])->assertSessionHasNoErrors();

        $party = Party::firstOrFail();
        $this->assertSame($user->current_organization_id, $party->organization_id);
        $this->assertSame('33AABCC1234D1Z5', $party->gstin);
        $this->assertSame('125000.00', $party->opening_balance);

        $this->actingAs($user)->put(route('parties.update', $party), [
            'name' => 'Chennai Steel Rolling Mills',
            'type' => 'customer',
            'opening_amount' => 5000,
            'opening_type' => 'payable',
        ])->assertSessionHasNoErrors();

        $this->assertSame('-5000.00', $party->fresh()->opening_balance);
    }

    public function test_gstin_and_pan_formats_are_validated()
    {
        $user = User::factory()->withOrganization()->create();

        $this->actingAs($user)->post(route('parties.store'), [
            'name' => 'Bad GST',
            'type' => 'customer',
            'gstin' => '1234',
            'pan' => 'XYZ',
        ])->assertSessionHasErrors(['gstin', 'pan']);
    }

    public function test_party_names_are_unique_per_organization_only()
    {
        $user = User::factory()->withOrganization()->create();
        Party::factory()->create(['name' => 'Ravi Metals']);

        $this->actingAs($user)->post(route('parties.store'), ['name' => 'Ravi Metals', 'type' => 'supplier'])->assertSessionHasNoErrors();
        $this->actingAs($user)->post(route('parties.store'), ['name' => 'Ravi Metals', 'type' => 'supplier'])->assertSessionHasErrors('name');
    }

    public function test_parties_are_isolated_between_organizations()
    {
        $user = User::factory()->withOrganization()->create();
        $foreign = Party::factory()->create();

        $this->actingAs($user);

        $this->get(route('parties.show', $foreign))->assertNotFound();
        $this->get(route('parties.edit', $foreign))->assertNotFound();
        $this->get(route('parties.index'))->assertInertia(fn (Assert $page) => $page->has('parties.data', 0));
    }

    public function test_staff_cannot_access_accounts()
    {
        $organization = Organization::factory()->active()->create();
        $staff = User::factory()->withOrganization($organization, OrganizationRole::Staff)->create();

        $this->actingAs($staff);

        $this->get(route('parties.index'))->assertForbidden();
        $this->get(route('payments.index'))->assertForbidden();
        $this->get(route('accounts.outstanding'))->assertForbidden();
        $this->get(route('accounts.cashbook'))->assertForbidden();
    }
}
