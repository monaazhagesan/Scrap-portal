<?php

namespace App\Enums;

enum PaymentMode: string
{
    case Cash = 'cash';
    case Upi = 'upi';
    case Bank = 'bank';
    case Cheque = 'cheque';

    public function label(): string
    {
        return match ($this) {
            self::Cash => 'Cash',
            self::Upi => 'UPI',
            self::Bank => 'Bank transfer (NEFT / RTGS / IMPS)',
            self::Cheque => 'Cheque',
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
