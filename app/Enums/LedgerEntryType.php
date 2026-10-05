<?php

namespace App\Enums;

enum LedgerEntryType: string
{
    case Sale = 'sale';
    case Purchase = 'purchase';
    case Receipt = 'receipt';
    case Payment = 'payment';
    case Reversal = 'reversal';

    public function label(): string
    {
        return match ($this) {
            self::Sale => 'Sale',
            self::Purchase => 'Purchase',
            self::Receipt => 'Receipt',
            self::Payment => 'Payment',
            self::Reversal => 'Reversal (cancelled)',
        };
    }
}
