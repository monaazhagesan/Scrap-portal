<?php

namespace App\Enums;

enum MaterialCategory: string
{
    case Ferrous = 'ferrous';
    case NonFerrous = 'non_ferrous';
    case EWaste = 'e_waste';
    case Paper = 'paper';
    case Plastic = 'plastic';
    case Other = 'other';

    public function label(): string
    {
        return match ($this) {
            self::Ferrous => 'Ferrous (Iron / Steel)',
            self::NonFerrous => 'Non-Ferrous (Copper / Aluminium / Brass)',
            self::EWaste => 'E-Waste',
            self::Paper => 'Paper / Cardboard',
            self::Plastic => 'Plastic',
            self::Other => 'Other',
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
