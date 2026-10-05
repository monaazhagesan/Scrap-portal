<?php

namespace App\Enums;

enum PaymentStatus: string
{
    case Posted = 'posted';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return ucfirst($this->value);
    }
}
