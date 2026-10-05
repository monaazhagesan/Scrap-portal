<?php

namespace App\Enums;

enum PaymentType: string
{
    /** Money received from a party (usually a customer). */
    case Receipt = 'receipt';
    /** Money paid to a party (usually a supplier). */
    case Payment = 'payment';

    public function label(): string
    {
        return match ($this) {
            self::Receipt => 'Receipt',
            self::Payment => 'Payment',
        };
    }

    public function prefix(): string
    {
        return match ($this) {
            self::Receipt => 'RCT',
            self::Payment => 'PAY',
        };
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    public static function options(): array
    {
        return array_map(
            fn (self $case) => ['value' => $case->value, 'label' => $case->label()],
            self::cases(),
        );
    }
}
