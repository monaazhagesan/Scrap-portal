<?php

namespace Tests\Feature\Auth;

use App\Enums\OrganizationRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Fortify\Features;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->skipUnlessFortifyHas(Features::registration());
    }

    public function test_registration_screen_can_be_rendered()
    {
        $response = $this->get(route('register'));

        $response->assertOk();
    }

    public function test_new_users_can_register()
    {
        $response = $this->post(route('register.store'), [
            'name' => 'Test User',
            'organization_name' => 'Test Scrap Traders',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));

        $user = User::firstWhere('email', 'test@example.com');
        $organization = $user->currentOrganization;

        $this->assertSame('Test Scrap Traders', $organization->name);
        $this->assertSame(OrganizationRole::Owner, $organization->roleOf($user));
        $this->assertTrue($organization->onTrial());
    }

    public function test_registration_requires_a_company_name()
    {
        $this->post(route('register.store'), [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertSessionHasErrors('organization_name');

        $this->assertGuest();
    }
}
