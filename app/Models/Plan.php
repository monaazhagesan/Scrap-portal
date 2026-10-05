<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $name
 * @property string $slug
 * @property string|null $description
 * @property string $monthly_price
 * @property string $yearly_price
 * @property string $currency
 * @property int|null $max_users
 * @property int|null $max_yards
 * @property int $trial_days
 * @property list<string>|null $features
 * @property bool $is_active
 * @property int $sort_order
 */
#[Fillable([
    'name', 'slug', 'description', 'monthly_price', 'yearly_price', 'currency',
    'max_users', 'max_yards', 'trial_days', 'features', 'is_active', 'sort_order',
])]
class Plan extends Model
{
    protected function casts(): array
    {
        return [
            'monthly_price' => 'decimal:2',
            'yearly_price' => 'decimal:2',
            'features' => 'array',
            'is_active' => 'boolean',
        ];
    }

    /**
     * @param  Builder<Plan>  $query
     */
    public function scopeActive(Builder $query): void
    {
        $query->where('is_active', true)->orderBy('sort_order');
    }

    /**
     * @return HasMany<Organization, $this>
     */
    public function organizations(): HasMany
    {
        return $this->hasMany(Organization::class);
    }
}
