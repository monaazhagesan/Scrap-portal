<?php

namespace App\Models;

use App\Enums\LedgerEntryType;
use App\Enums\PaymentMode;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Models\Concerns\BelongsToOrganization;
use App\Models\Concerns\HasTenantSequence;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * A receipt (money in from a party) or payment (money out to a party) voucher.
 *
 * @property int $id
 * @property int $organization_id
 * @property int $party_id
 * @property PaymentType $type
 * @property int $sequence
 * @property string $voucher_no
 * @property Carbon $date
 * @property string $amount
 * @property PaymentMode $mode
 * @property string|null $reference_no
 * @property string|null $notes
 * @property PaymentStatus $status
 * @property int|null $created_by
 * @property-read Party $party
 */
#[Fillable(['party_id', 'type', 'date', 'amount', 'mode', 'reference_no', 'notes'])]
class Payment extends Model
{
    use BelongsToOrganization, HasTenantSequence;

    protected function casts(): array
    {
        return [
            'type' => PaymentType::class,
            'mode' => PaymentMode::class,
            'status' => PaymentStatus::class,
            'date' => 'date',
            'amount' => 'decimal:2',
        ];
    }

    /**
     * Create the voucher with the next number for its type and post it to the party ledger.
     *
     * @param  array<string, mixed>  $attributes
     */
    public static function post(Party $party, User $user, array $attributes): self
    {
        return DB::transaction(function () use ($party, $user, $attributes) {
            $type = PaymentType::from($attributes['type']);
            $sequence = self::nextSequence($party->organization_id, ['type' => $type->value]);

            $payment = new self([...$attributes, 'party_id' => $party->id]);
            $payment->forceFill([
                'organization_id' => $party->organization_id,
                'sequence' => $sequence,
                'voucher_no' => sprintf('%s-%06d', $type->prefix(), $sequence),
                'status' => PaymentStatus::Posted,
                'created_by' => $user->id,
            ])->save();

            $receipt = $type === PaymentType::Receipt;

            LedgerEntry::record($party, [
                'date' => $payment->date,
                'type' => $receipt ? LedgerEntryType::Receipt : LedgerEntryType::Payment,
                'debit' => $receipt ? 0 : $payment->amount,
                'credit' => $receipt ? $payment->amount : 0,
                'payment_id' => $payment->id,
                'narration' => trim($payment->voucher_no.' · '.$payment->mode->label().' '.($payment->reference_no ?? '')),
                'created_by' => $user->id,
            ]);

            return $payment;
        });
    }

    public function cancel(string $reason, User $user): void
    {
        DB::transaction(function () use ($reason, $user) {
            LedgerEntry::reverse($this->party, ['payment_id' => $this->id], $this->voucher_no.' cancelled: '.$reason, $user);

            $this->forceFill([
                'status' => PaymentStatus::Cancelled,
                'notes' => trim(($this->notes ? $this->notes."\n" : '').'Cancelled: '.$reason),
            ])->save();
        });
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
}
