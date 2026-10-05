<?php

namespace App\Models\Concerns;

use App\Models\Organization;
use App\Support\CurrentOrganization;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Scopes a model to the current tenant and stamps organization_id on create.
 *
 * Every tenant-owned table needs an `organization_id` column, and its model must use this trait.
 */
trait BelongsToOrganization
{
    public static function bootBelongsToOrganization(): void
    {
        static::addGlobalScope('organization', function (Builder $builder) {
            $tenant = app(CurrentOrganization::class);

            if ($tenant->check()) {
                $builder->where($builder->qualifyColumn('organization_id'), $tenant->id());
            }
        });

        static::creating(function ($model) {
            $tenant = app(CurrentOrganization::class);

            if (! $model->organization_id && $tenant->check()) {
                $model->organization_id = $tenant->id();
            }
        });
    }

    /**
     * @return BelongsTo<Organization, $this>
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}
