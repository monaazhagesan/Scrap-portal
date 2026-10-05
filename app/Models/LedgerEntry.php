<?php

namespace App\Models;

use App\Enums\LedgerEntryType;
use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * One line in a party's account. Entries are never edited or deleted; mistakes are reversed.
 *
 * @property int $id
 * @property int $organization_id
 * @property int $party_id
 * @property Carbon $date
 * @property LedgerEntryType $type
 * @property string $debit
 * @property string $credit
 * @property int|null $weighment_id
 * @property int|null $payment_id
 * @property string|null $narration
 * @property int|null $created_by
 */
#[Fillable(['party_id', 'date', 'type', 'debit', 'credit', 'weighment_id', 'payment_id', 'narration', 'created_by'])]
class LedgerEntry extends Model
{
    use BelongsToOrganization;

    protected function casts(): array
    {
        return [
            'type' => LedgerEntryType::class,
            'date' => 'date',
            'debit' => 'decimal:2',
            'credit' => 'decimal:2',
        ];
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public static function record(Party $party, array $attributes): self
    {
        $entry = new self(['party_id' => $party->id, 'debit' => 0, 'credit' => 0, ...$attributes]);
        $entry->organization_id = $party->organization_id;
        $entry->save();

        return $entry;
    }

    /**
     * Post the opposite of every entry linked to a document (weighment or payment), if it still has an effect.
     *
     * @param  array{weighment_id?: int, payment_id?: int}  $link
     */
    public static function reverse(Party $party, array $link, string $narration, User $user): void
    {
        $query = self::query()->where('party_id', $party->id)->where($link);

        $debit = (float) (clone $query)->sum('debit');
        $credit = (float) (clone $query)->sum('credit');

        if (abs($debit - $credit) < 0.01) {
            return;
        }

        self::record($party, [
            ...$link,
            'date' => today(),
            'type' => LedgerEntryType::Reversal,
            'debit' => $credit,
            'credit' => $debit,
            'narration' => $narration,
            'created_by' => $user->id,
        ]);
    }

    /**
     * @return BelongsTo<Party, $this>
     */
    public function party(): BelongsTo
    {
        return $this->belongsTo(Party::class);
    }

    /**
     * @return BelongsTo<Weighment, $this>
     */
    public function weighment(): BelongsTo
    {
        return $this->belongsTo(Weighment::class);
    }

    /**
     * @return BelongsTo<Payment, $this>
     */
    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }
}
