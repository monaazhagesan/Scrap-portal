<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('parties', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('type')->default('both');
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('gstin', 15)->nullable();
            $table->string('pan', 10)->nullable();
            $table->text('address')->nullable();
            $table->string('state')->nullable();
            // Signed: positive = receivable (party owes us), negative = payable (we owe party).
            $table->decimal('opening_balance', 14, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['organization_id', 'name']);
        });

        Schema::table('weighments', function (Blueprint $table) {
            $table->foreignId('party_id')->nullable()->after('driver_phone')->constrained()->nullOnDelete();
        });

        // Turn existing free-text party names on weighbridge tickets into parties.
        DB::table('weighments')
            ->whereNotNull('party_name')
            ->where('party_name', '!=', '')
            ->select('organization_id', 'party_name')
            ->selectRaw("max(case when direction = 'inward' then 1 else 0 end) as has_inward")
            ->selectRaw("max(case when direction = 'outward' then 1 else 0 end) as has_outward")
            ->groupBy('organization_id', 'party_name')
            ->get()
            ->each(function ($row) {
                $partyId = DB::table('parties')->insertGetId([
                    'organization_id' => $row->organization_id,
                    'name' => $row->party_name,
                    'type' => match (true) {
                        $row->has_inward && $row->has_outward => 'both',
                        (bool) $row->has_inward => 'supplier',
                        default => 'customer',
                    },
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                DB::table('weighments')
                    ->where('organization_id', $row->organization_id)
                    ->where('party_name', $row->party_name)
                    ->update(['party_id' => $partyId]);
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('weighments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('party_id');
        });

        Schema::dropIfExists('parties');
    }
};
