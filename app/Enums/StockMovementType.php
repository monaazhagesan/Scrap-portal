<?php

namespace App\Enums;

enum StockMovementType: string
{
    /** Completed inward weighment (purchase). */
    case Inward = 'inward';
    /** Completed outward weighment (sale / dispatch). */
    case Outward = 'outward';
    /** Undo of a weighment that was cancelled after completion. */
    case Reversal = 'reversal';
    /** Manual correction: opening stock, wastage, stock count difference. */
    case Adjustment = 'adjustment';

    public function label(): string
    {
        return match ($this) {
            self::Inward => 'Inward (Purchase)',
            self::Outward => 'Outward (Sale)',
            self::Reversal => 'Cancelled ticket reversal',
            self::Adjustment => 'Manual adjustment',
        };
    }
}
