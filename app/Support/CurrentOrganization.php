<?php

namespace App\Support;

use App\Models\Organization;

/**
 * Holds the tenant (organization) resolved for the current request.
 *
 * Registered as a scoped singleton so it is reset between requests and queued jobs.
 */
class CurrentOrganization
{
    protected ?Organization $organization = null;

    public function set(?Organization $organization): void
    {
        $this->organization = $organization;
    }

    public function get(): ?Organization
    {
        return $this->organization;
    }

    public function id(): ?int
    {
        return $this->organization?->id;
    }

    public function check(): bool
    {
        return $this->organization !== null;
    }
}
