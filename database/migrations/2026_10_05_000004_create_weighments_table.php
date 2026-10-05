<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('weighments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('sequence');
            $table->string('ticket_no');
            $table->string('direction');
            $table->string('status')->default('open');

            $table->string('vehicle_number');
            $table->string('vehicle_type')->nullable();
            $table->string('driver_name')->nullable();
            $table->string('driver_phone')->nullable();
            $table->string('party_name')->nullable();
            $table->foreignId('material_id')->nullable()->constrained()->nullOnDelete();

            // All weights are in kilograms.
            $table->decimal('first_weight', 12, 2);
            $table->timestamp('first_weighed_at');
            $table->decimal('second_weight', 12, 2)->nullable();
            $table->timestamp('second_weighed_at')->nullable();
            $table->decimal('gross_weight', 12, 2)->nullable();
            $table->decimal('tare_weight', 12, 2)->nullable();
            $table->decimal('deduction', 12, 2)->default(0);
            $table->decimal('net_weight', 12, 2)->nullable();

            $table->decimal('rate', 12, 2)->nullable();
            $table->decimal('amount', 14, 2)->nullable();
            $table->text('remarks')->nullable();

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('completed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['organization_id', 'sequence']);
            $table->index(['organization_id', 'status']);
            $table->index(['organization_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('weighments');
    }
};
