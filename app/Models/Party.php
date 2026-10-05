<?php

namespace App\Models;

use App\Enums\PartyType;
use App\Models\Concerns\BelongsToOrganization;
use Database\Factories\PartyFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A supplier and/or customer. Balance = opening_balance + Σ(debit − credit) of ledger entries:
 * positive means the party owes us (receivable, Dr), negative means we owe them (payable, Cr).
 *
 * @property int $id
 * @property int $organization_id
 * @property string $name
 * @property PartyType $type
 * @property string|null $phone
 * @property string|null $email
 * @property string|null $gstin
 * @property string|null $pan
 * @property string|null $address
 * @property string|null $state
 * @property string $opening_balance
 * @property bool $is_active
 * @property-read string|null $balance When loaded via the withBalance scope
 */
#[Fillable(['name', 'type', 'phone', 'email', 'gstin', 'pan', 'address', 'state', 'opening_balance', 'is_active'])]
class Party extends Model
{
    /** @use HasFactory<PartyFactory> */
    use BelongsToOrganization, HasFactory;

    public const BALANCE_SQL = 'parties.opening_balance + coalesce((select sum(ledger_entries.debit - ledger_entries.credit) from ledger_entries where ledger_entries.party_id = parties.id), 0)';

    protected function casts(): array
    {
        return [
            'type' => PartyType::class,
            'opening_balance' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Adds a `balance` column (signed, see class docblock).
     *
     * @param  Builder<Party>  $query
     */
    public function scopeWithBalance(Builder $query): void
    {
        $query->select('parties.*')->selectRaw('('.self::BALANCE_SQL.') as balance');
    }

    /**
     * @param  Builder<Party>  $query
     */
    public function scopeReceivable(Builder $query): void
    {
        $query->whereRaw('('.self::BALANCE_SQL.') > 0');
    }

    /**
     * @param  Builder<Party>  $query
     */
    public function scopePayable(Builder $query): void
    {
        $query->whereRaw('('.self::BALANCE_SQL.') < 0');
    }

    /**
     * Parties usable on a weighbridge ticket of the given direction.
     *
     * @param  Builder<Party>  $query
     */
    public function scopeForDirection(Builder $query, string $direction): void
    {
        $query->whereIn('type', [
            $direction === 'inward' ? PartyType::Supplier->value : PartyType::Customer->value,
            PartyType::Both->value,
        ]);
    }

    public function currentBalance(): float
    {
        return (float) $this->opening_balance
            + (float) $this->ledgerEntries()->sum('debit')
            - (float) $this->ledgerEntries()->sum('credit');
    }

    /**
     * @return HasMany<LedgerEntry, $this>
     */
    public function ledgerEntries(): HasMany
    {
        return $this->hasMany(LedgerEntry::class);
    }

    /**
     * @return HasMany<Payment, $this>
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
