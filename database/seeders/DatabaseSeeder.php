<?php

namespace Database\Seeders;

use App\Actions\Organizations\CreateOrganization;
use App\Enums\MaterialCategory;
use App\Enums\PartyType;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(PlanSeeder::class);

        // Platform owner: can manage every tenant at /admin/organizations.
        $admin = User::factory()->create([
            'name' => 'Super Admin',
            'email' => 'admin@example.com',
        ]);
        $admin->forceFill(['is_super_admin' => true])->save();

        // A demo tenant with some scrap materials.
        $owner = User::factory()->create([
            'name' => 'Demo Owner',
            'email' => 'owner@example.com',
        ]);

        $organization = app(CreateOrganization::class)->handle($owner, 'Demo Scrap Traders');

        $materials = [
            ['HMS 1 & 2', 'HMS', MaterialCategory::Ferrous, 'kg', 32, 35],
            ['Cast Iron', 'CI', MaterialCategory::Ferrous, 'kg', 28, 31],
            ['Copper Armature', 'CU-ARM', MaterialCategory::NonFerrous, 'kg', 720, 760],
            ['Aluminium Utensil', 'AL-UT', MaterialCategory::NonFerrous, 'kg', 165, 180],
            ['Brass Honey', 'BR-HN', MaterialCategory::NonFerrous, 'kg', 480, 510],
            ['Mixed PCB', 'PCB', MaterialCategory::EWaste, 'kg', 140, 165],
            ['OCC Cardboard', 'OCC', MaterialCategory::Paper, 'kg', 12, 14],
            ['PET Bottles', 'PET', MaterialCategory::Plastic, 'kg', 22, 26],
        ];

        $organization->parties()->createMany([
            ['name' => 'Ravi Metals', 'type' => PartyType::Supplier, 'phone' => '9840012345', 'state' => 'Tamil Nadu'],
            ['name' => 'Murugan Kabadi Store', 'type' => PartyType::Supplier, 'phone' => '9876543210', 'state' => 'Tamil Nadu'],
            ['name' => 'Chennai Steel Rolling Mills', 'type' => PartyType::Customer, 'gstin' => '33AABCC1234D1Z5', 'state' => 'Tamil Nadu', 'opening_balance' => 125000],
            ['name' => 'Bharat Non-Ferrous Pvt Ltd', 'type' => PartyType::Customer, 'gstin' => '29AABCB5678E1Z2', 'state' => 'Karnataka'],
        ]);

        foreach ($materials as [$name, $code, $category, $unit, $buy, $sell]) {
            $organization->materials()->create([
                'name' => $name,
                'code' => $code,
                'category' => $category,
                'unit' => $unit,
                'purchase_rate' => $buy,
                'sale_rate' => $sell,
            ]);
        }
    }
}
