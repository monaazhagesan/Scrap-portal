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
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('party_id')->constrained()->restrictOnDelete();
            $table->string('type');
            $table->unsignedInteger('sequence');
            $table->string('voucher_no');
            $table->date('date');
            $table->decimal('amount', 14, 2);
            $table->string('mode');
            $table->string('reference_no')->nullable();
            $table->text('notes')->nullable();
            $table->string('status')->default('posted');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['organization_id', 'type', 'sequence']);
            $table->index(['organization_id', 'date']);
        });

        Schema::create('ledger_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('party_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->string('type');
            // Debit = party owes us more (sale, payment to them). Credit = we owe them more (purchase, receipt from them).
            $table->decimal('debit', 14, 2)->default(0);
            $table->decimal('credit', 14, 2)->default(0);
            $table->foreignId('weighment_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('payment_id')->nullable()->constrained()->nullOnDelete();
            $table->string('narration')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['organization_id', 'party_id', 'date']);
        });

        // Post completed weighbridge tickets that already have a party and an amount.
        DB::table('weighments')
            ->where('status', 'completed')
            ->whereNotNull('party_id')
            ->whereNotNull('amount')
            ->orderBy('id')
            ->get()
            ->each(fn ($weighment) => DB::table('ledger_entries')->insert([
                'organization_id' => $weighment->organization_id,
                'party_id' => $weighment->party_id,
                'date' => substr((string) $weighment->second_weighed_at, 0, 10),
                'type' => $weighment->direction === 'inward' ? 'purchase' : 'sale',
                'debit' => $weighment->direction === 'outward' ? $weighment->amount : 0,
                'credit' => $weighment->direction === 'inward' ? $weighment->amount : 0,
                'weighment_id' => $weighment->id,
                'narration' => $weighment->ticket_no.' · '.number_format((float) $weighment->net_weight, 2).' kg',
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
        Schema::dropIfExists('ledger_entries');
        Schema::dropIfExists('payments');
    }
};
