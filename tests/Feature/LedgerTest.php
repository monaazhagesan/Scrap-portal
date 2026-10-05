<?php

namespace Tests\Feature;

use App\Enums\OrganizationRole;
use App\Enums\PaymentStatus;
use App\Models\Material;
use App\Models\Organization;
use App\Models\Party;
use App\Models\Payment;
use App\Models\User;
use App\Models\Weighment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LedgerTest extends TestCase
{
    use RefreshDatabase;

    public function test_weighments_post_purchases_and_sales_to_the_party_ledger()
    {
        [$user, $material] = $this->setUpTenant();
        $supplier = Party::factory()->supplier()->for($user->currentOrganization)->create();
        $customer = Party::factory()->customer()->for($user->currentOrganization)->create();

        $this->weigh($supplier, $material, 'inward', 15000, 5000, 30);   // purchase ₹3,00,000
        $this->weigh($customer, $material, 'outward', 6000, 10000, 40);  // sale ₹1,60,000

        $this->assertEquals(-300000, $supplier->currentBalance());
        $this->assertEquals(160000, $customer->currentBalance());
        $this->assertSame($supplier->name, Weighment::firstOrFail()->party_name);
    }

    public function test_receipts_and_payments_settle_balances()
    {
        [$user, $material] = $this->setUpTenant();
        $supplier = Party::factory()->supplier()->for($user->currentOrganization)->create();
        $customer = Party::factory()->customer()->for($user->currentOrganization)->create(['opening_balance' => 50000]);

        $this->weigh($supplier, $material, 'inward', 15000, 5000, 30);

        $this->post(route('payments.store'), $this->voucher($supplier, 'payment', 100000))->assertSessionHasNoErrors();
        $this->post(route('payments.store'), $this->voucher($customer, 'receipt', 20000, 'upi'))->assertSessionHasNoErrors();

        $this->assertEquals(-200000, $supplier->currentBalance());
        $this->assertEquals(30000, $customer->currentBalance());
        $this->assertSame(['PAY-000001', 'RCT-000001'], Payment::orderBy('id')->pluck('voucher_no')->all());
    }

    public function test_cancelling_vouchers_and_tickets_reverses_the_ledger()
    {
        [$user, $material] = $this->setUpTenant();
        $customer = Party::factory()->customer()->for($user->currentOrganization)->create();

        $weighment = $this->weigh($customer, $material, 'outward', 6000, 10000, 40);
        $this->post(route('payments.store'), $this->voucher($customer, 'receipt', 60000));
        $payment = Payment::firstOrFail();
        $this->assertEquals(100000, $customer->currentBalance());

        $this->post(route('payments.cancel', $payment), ['reason' => 'Cheque bounced'])->assertRedirect();
        $this->assertEquals(160000, $customer->currentBalance());
        $this->assertSame(PaymentStatus::Cancelled, $payment->fresh()->status);

        $this->post(route('weighments.cancel', $weighment), ['reason' => 'Wrong party']);
        $this->assertEquals(0, $customer->currentBalance());

        // Cancelling twice must not reverse twice.
        $this->post(route('payments.cancel', $payment), ['reason' => 'Again'])->assertStatus(422);
        $this->assertEquals(0, $customer->currentBalance());
    }

    public function test_statement_shows_opening_and_running_balance()
    {
        [$user, $material] = $this->setUpTenant();
        $customer = Party::factory()->customer()->for($user->currentOrganization)->create(['opening_balance' => 10000]);

        $this->weigh($customer, $material, 'outward', 6000, 10000, 40);  // +1,60,000
        $this->post(route('payments.store'), $this->voucher($customer, 'receipt', 70000));

        $this->get(route('parties.show', $customer))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('parties/show')
                ->where('statement.opening', 10000)
                ->where('statement.debit', 160000)
                ->where('statement.credit', 70000)
                ->where('statement.closing', 100000)
                ->where('entries.data.0.type', 'sale')
                ->where('entries.data.0.balance', 170000)
                ->where('entries.data.1.type', 'receipt')
                ->where('entries.data.1.balance', 100000));
    }

    public function test_outstanding_and_cashbook()
    {
        [$user, $material] = $this->setUpTenant();
        $supplier = Party::factory()->supplier()->for($user->currentOrganization)->create();
        $customer = Party::factory()->customer()->for($user->currentOrganization)->create(['opening_balance' => 25000]);

        $this->weigh($supplier, $material, 'inward', 15000, 5000, 30);
        $this->post(route('payments.store'), $this->voucher($customer, 'receipt', 5000));
        $this->post(route('payments.store'), $this->voucher($supplier, 'payment', 3000));
        $this->post(route('payments.store'), $this->voucher($supplier, 'payment', 1000, 'upi'));

        $this->get(route('accounts.outstanding'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('totals.receivable', 20000)
                ->where('totals.payable', 296000));

        $this->get(route('accounts.cashbook', ['book' => 'cash']))
            ->assertInertia(fn (Assert $page) => $page
                ->has('rows', 2)
                ->where('summary.in', 5000)
                ->where('summary.out', 3000)
                ->where('summary.closing', 2000));
    }

    public function test_only_owners_and_admins_can_cancel_vouchers()
    {
        $organization = Organization::factory()->active()->create();
        $manager = User::factory()->withOrganization($organization, OrganizationRole::Manager)->create();
        $party = Party::factory()->for($organization)->create();

        $this->actingAs($manager)->post(route('payments.store'), $this->voucher($party, 'receipt', 100));
        $payment = Payment::firstOrFail();

        $this->post(route('payments.cancel', $payment), ['reason' => 'x'])->assertForbidden();
    }

    public function test_vouchers_cannot_use_another_organizations_party()
    {
        [$user] = $this->setUpTenant();
        $foreign = Party::factory()->create();
        $foreignPayment = Payment::post($foreign, User::factory()->create(), $this->voucher($foreign, 'receipt', 100));

        $this->post(route('payments.store'), $this->voucher($foreign, 'receipt', 100))->assertSessionHasErrors('party_id');
        $this->get(route('payments.show', $foreignPayment))->assertNotFound();
    }

    /**
     * @return array{0: User, 1: Material}
     */
    protected function setUpTenant(): array
    {
        $user = User::factory()->withOrganization()->create();
        $material = Material::factory()->for($user->currentOrganization)->create(['unit' => 'kg']);
        $this->actingAs($user);

        return [$user, $material];
    }

    protected function weigh(Party $party, Material $material, string $direction, float $first, float $second, float $rate): Weighment
    {
        $this->post(route('weighments.store'), [
            'direction' => $direction,
            'vehicle_number' => 'TN09AB1234',
            'party_id' => $party->id,
            'material_id' => $material->id,
            'first_weight' => $first,
        ])->assertSessionHasNoErrors();

        $weighment = Weighment::latest('id')->firstOrFail();
        $this->post(route('weighments.complete', $weighment), ['second_weight' => $second, 'rate' => $rate])->assertSessionHasNoErrors();

        return $weighment;
    }

    /**
     * @return array<string, mixed>
     */
    protected function voucher(Party $party, string $type, float $amount, string $mode = 'cash'): array
    {
        return [
            'type' => $type,
            'party_id' => $party->id,
            'date' => today()->toDateString(),
            'amount' => $amount,
            'mode' => $mode,
        ];
    }
}
