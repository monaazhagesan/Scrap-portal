<?php

namespace App\Enums;

enum OrganizationRole: string
{
    case Owner = 'owner';
    case Admin = 'admin';
    case Manager = 'manager';
    case Staff = 'staff';

    public function label(): string
    {
        return ucfirst($this->value);
    }

    /**
     * Whether this role may manage organization settings, billing and members.
     */
    public function canManageOrganization(): bool
    {
        return in_array($this, [self::Owner, self::Admin], true);
    }
}
