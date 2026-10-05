<?php

namespace App\Models;

use App\Enums\LedgerEntryType;
use App\Enums\StockMovementType;
use App\Enums\WeighmentDirection;
use App\Enums\WeighmentStatus;
use App\Models\Concerns\BelongsToOrganization;
use App\Models\Concerns\HasTenantSequence;
use Database\Factories\WeighmentFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * A weighbridge ticket. The vehicle is weighed once on arrival and again after
 * loading / unloading; the heavier reading is gross, the lighter is tare.
 *
 * @property int $id
 * @property int $organization_id
 * @property int $sequence
 * @property string $ticket_no
 * @property WeighmentDirection $direction
 * @property WeighmentStatus $status
 * @property string $vehicle_number
 * @property string|null $vehicle_type
 * @property string|null $driver_name
 * @property string|null $driver_phone
 * @property int|null $party_id
 * @property string|null $party_name
 * @property int|null $material_id
 * @property string $first_weight
 * @property Carbon $first_weighed_at
 * @property string|null $second_weight
 * @property Carbon|null $second_weighed_at
 * @property string|null $gross_weight
 * @property string|null $tare_weight
 * @property string $deduction
 * @property string|null $net_weight
 * @property string|null $rate
 * @property string|null $amount
 * @property string|null $remarks
 * @property int|null $created_by
 * @property int|null $completed_by
 * @property-read Material|null $material
 * @property-read Party|null $party
 */
#[Fillable([
    'sequence', 'ticket_no', 'direction', 'status', 'vehicle_number', 'vehicle_type',
    'driver_name', 'driver_phone', 'party_id', 'party_name', 'material_id', 'first_weight',
    'first_weighed_at', 'remarks', 'created_by',
])]
class Weighment extends Model
{
    /** @use HasFactory<WeighmentFactory> */
    use BelongsToOrganization, HasFactory, HasTenantSequence;

    protected function casts(): array
    {
        return [
            'direction' => WeighmentDirection::class,
            'status' => WeighmentStatus::class,
            'first_weight' => 'decimal:2',
            'second_weight' => 'decimal:2',
            'gross_weight' => 'decimal:2',
            'tare_weight' => 'decimal:2',
            'deduction' => 'decimal:2',
            'net_weight' => 'decimal:2',
            'rate' => 'decimal:2',
            'amount' => 'decimal:2',
            'first_weighed_at' => 'datetime',
            'second_weighed_at' => 'datetime',
        ];
    }

    /**
     * Open a new ticket with the next per-organization ticket number.
     *
     * @param  array<string, mixed>  $attributes
     */
    public static function open(Organization $organization, User $user, array $attributes): self
    {
        return DB::transaction(function () use ($organization, $user, $attributes) {
            $sequence = self::nextSequence($organization->id);

            // Keep the party's name on the ticket as printed, even if the party is renamed later.
            if (! empty($attributes['party_id'])) {
                $attributes['party_name'] = Party::whereKey($attributes['party_id'])->firstOrFail()->name;
            }

            $weighment = new self([
                ...$attributes,
                'sequence' => $sequence,
                'ticket_no' => sprintf('WB-%06d', $sequence),
                'status' => WeighmentStatus::Open,
                'first_weighed_at' => now(),
                'created_by' => $user->id,
            ]);
            $weighment->organization_id = $organization->id;
            $weighment->save();

            return $weighment;
        });
    }

    /**
     * Record the second weighment and compute gross / tare / net weight and amount.
     *
     * @throws ValidationException
     */
    public function complete(float $secondWeight, float $deduction, ?float $rate, User $user): void
    {
        if ($this->status !== WeighmentStatus::Open) {
            throw ValidationException::withMessages(['second_weight' => __('This ticket is already :status.', ['status' => strtolower($this->status->label())])]);
        }

        $firstWeight = (float) $this->first_weight;

        if (abs($firstWeight - $secondWeight) < 0.01) {
            throw ValidationException::withMessages(['second_weight' => __('Second weight must differ from the first weight.')]);
        }

        $gross = max($firstWeight, $secondWeight);
        $tare = min($firstWeight, $secondWeight);
        $net = round($gross - $tare - $deduction, 2);

        if ($net <= 0) {
            throw ValidationException::withMessages(['deduction' => __('Deduction cannot be more than the net weight (:net kg).', ['net' => $gross - $tare])]);
        }

        // Rates are per material unit; weights are always kg.
        $quantity = $this->material?->unit === 'ton' ? $net / 1000 : $net;

        DB::transaction(function () use ($secondWeight, $gross, $tare, $deduction, $net, $rate, $quantity, $user) {
            $this->forceFill([
                'second_weight' => $secondWeight,
                'second_weighed_at' => now(),
                'gross_weight' => $gross,
                'tare_weight' => $tare,
                'deduction' => $deduction,
                'net_weight' => $net,
                'rate' => $rate,
                'amount' => $rate !== null ? round($quantity * $rate, 2) : null,
                'status' => WeighmentStatus::Completed,
                'completed_by' => $user->id,
            ])->save();

            if ($this->material) {
                $inward = $this->direction === WeighmentDirection::Inward;

                StockMovement::record($this->material, [
                    'type' => $inward ? StockMovementType::Inward : StockMovementType::Outward,
                    'quantity' => $inward ? $net : -$net,
                    'weighment_id' => $this->id,
                    'notes' => $this->ticket_no.($this->party_name ? ' · '.$this->party_name : ''),
                    'created_by' => $user->id,
                ]);
            }

            // Purchase: we owe the supplier (credit). Sale: the customer owes us (debit).
            if ($this->party && $this->amount !== null) {
                $inward = $this->direction === WeighmentDirection::Inward;

                LedgerEntry::record($this->party, [
                    'date' => today(),
                    'type' => $inward ? LedgerEntryType::Purchase : LedgerEntryType::Sale,
                    'debit' => $inward ? 0 : $this->amount,
                    'credit' => $inward ? $this->amount : 0,
                    'weighment_id' => $this->id,
                    'narration' => $this->ticket_no.' · '.($this->material->name ?? 'Material').' · '.number_format($net, 2).' kg',
                    'created_by' => $user->id,
                ]);
            }
        });
    }

    /**
     * Cancel the ticket. If it was already completed, its stock movement is reversed.
     */
    public function cancel(string $reason, User $user): void
    {
        DB::transaction(function () use ($reason, $user) {
            $stockEffect = (float) $this->stockMovements()->sum('quantity');

            if ($this->material && abs($stockEffect) >= 0.01) {
                StockMovement::record($this->material, [
                    'type' => StockMovementType::Reversal,
                    'quantity' => -$stockEffect,
                    'weighment_id' => $this->id,
                    'notes' => $this->ticket_no.' cancelled: '.$reason,
                    'created_by' => $user->id,
                ]);
            }

            if ($this->party) {
                LedgerEntry::reverse($this->party, ['weighment_id' => $this->id], $this->ticket_no.' cancelled: '.$reason, $user);
            }

            $this->forceFill([
                'status' => WeighmentStatus::Cancelled,
                'remarks' => trim(($this->remarks ? $this->remarks."\n" : '').'Cancelled: '.$reason),
            ])->save();
        });
    }

    /**
     * @return HasMany<StockMovement, $this>
     */
    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    /**
     * The material's current rate for this ticket's direction (buy for inward, sell for outward).
     */
    public function defaultRate(): ?string
    {
        if (! $this->material) {
            return null;
        }

        return $this->direction === WeighmentDirection::Inward
            ? $this->material->purchase_rate
            : $this->material->sale_rate;
    }

    /**
     * @return BelongsTo<Material, $this>
     */
    public function material(): BelongsTo
    {
        return $this->belongsTo(Material::class);
    }

    /**
     * @return BelongsTo<Party, $this>
     */
    public function party(): BelongsTo
    {
        return $this->belongsTo(Party::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function completer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'completed_by');
    }
}
