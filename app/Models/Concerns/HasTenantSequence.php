<?php

namespace App\Models\Concerns;

/**
 * Gapless per-organization numbering (ticket / voucher numbers).
 *
 * The model's table needs a `sequence` column with a unique index that includes `organization_id`.
 * Call nextSequence() inside a DB transaction: the row lock serializes concurrent inserts.
 */
trait HasTenantSequence
{
    /**
     * @param  array<string, mixed>  $where  Extra columns that partition the numbering (e.g. voucher type).
     */
    protected static function nextSequence(int $organizationId, array $where = []): int
    {
        return (int) static::withoutGlobalScopes()
            ->where('organization_id', $organizationId)
            ->where($where)
            ->lockForUpdate()
            ->max('sequence') + 1;
    }
}
