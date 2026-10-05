<?php

namespace App\Enums;

enum WeighmentDirection: string
{
    case Inward = 'inward';
    case Outward = 'outward';

    public function label(): string
    {
        return match ($this) {
            self::Inward => 'Inward (Purchase)',
            self::Outward => 'Outward (Sale / Dispatch)',
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
