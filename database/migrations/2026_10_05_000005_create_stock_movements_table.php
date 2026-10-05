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
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('material_id')->constrained()->cascadeOnDelete();
            $table->string('type');
            // Signed quantity in kilograms: positive adds stock, negative removes it.
            $table->decimal('quantity', 14, 2);
            $table->foreignId('weighment_id')->nullable()->constrained()->nullOnDelete();
            $table->string('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['organization_id', 'material_id']);
        });

        // Bring weighments completed before this module existed into stock.
        DB::table('weighments')
            ->where('status', 'completed')
            ->whereNotNull('material_id')
            ->orderBy('id')
            ->get()
            ->each(fn ($weighment) => DB::table('stock_movements')->insert([
                'organization_id' => $weighment->organization_id,
                'material_id' => $weighment->material_id,
                'type' => $weighment->direction,
                'quantity' => $weighment->direction === 'inward' ? $weighment->net_weight : -$weighment->net_weight,
                'weighment_id' => $weighment->id,
                'notes' => $weighment->ticket_no,
                'created_by' => $weighment->completed_by,
                'created_at' => $weighment->second_weighed_at,
                'updated_at' => $weighment->second_weighed_at,
            ]));
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};
