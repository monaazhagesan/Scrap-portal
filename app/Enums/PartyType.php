<?php

namespace App\Enums;

enum PartyType: string
{
    case Supplier = 'supplier';
    case Customer = 'customer';
    case Both = 'both';

    public function label(): string
    {
        return match ($this) {
            self::Supplier => 'Supplier',
            self::Customer => 'Customer',
            self::Both => 'Supplier & Customer',
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
