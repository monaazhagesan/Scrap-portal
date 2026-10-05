<?php

namespace App\Models;

use App\Enums\OrganizationRole;
use App\Enums\OrganizationStatus;
use Database\Factories\OrganizationFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * A tenant of the SaaS. Every scrap business that signs up is one organization.
 *
 * @property int $id
 * @property string $name
 * @property string $slug
 * @property string|null $email
 * @property string|null $phone
 * @property string|null $tax_number
 * @property string|null $address
 * @property int|null $plan_id
 * @property OrganizationStatus $status
 * @property string $billing_cycle
 * @property Carbon|null $trial_ends_at
 * @property Carbon|null $subscription_ends_at
 */
#[Fillable([
    'name', 'slug', 'email', 'phone', 'tax_number', 'address', 'plan_id',
    'status', 'billing_cycle', 'trial_ends_at', 'subscription_ends_at',
])]
class Organization extends Model
{
    /** @use HasFactory<OrganizationFactory> */
    use HasFactory, SoftDeletes;

    protected function casts(): array
    {
        return [
            'status' => OrganizationStatus::class,
            'trial_ends_at' => 'datetime',
            'subscription_ends_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Organization $organization) {
            $organization->slug ??= static::uniqueSlug($organization->name);
        });
    }

    public static function uniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'org';
        $slug = $base;

        while (static::withTrashed()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.Str::lower(Str::random(5));
        }

        return $slug;
    }

    /**
     * @return BelongsTo<Plan, $this>
     */
    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    /**
     * @return BelongsToMany<User, $this>
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class)->withPivot('role')->withTimestamps();
    }

    /**
     * @return HasMany<Material, $this>
     */
    public function materials(): HasMany
    {
        return $this->hasMany(Material::class);
    }

    /**
     * @return HasMany<Party, $this>
     */
    public function parties(): HasMany
    {
        return $this->hasMany(Party::class);
    }

    public function onTrial(): bool
    {
        return $this->status === OrganizationStatus::Trial
            && (bool) $this->trial_ends_at?->isFuture();
    }

    public function trialDaysLeft(): int
    {
        return $this->onTrial() ? (int) ceil(now()->diffInDays($this->trial_ends_at)) : 0;
    }

    /**
     * Whether the tenant may currently use the application.
     */
    public function hasActiveSubscription(): bool
    {
        if ($this->onTrial()) {
            return true;
        }

        return $this->status === OrganizationStatus::Active
            && ($this->subscription_ends_at === null || $this->subscription_ends_at->isFuture());
    }

    public function roleOf(User $user): ?OrganizationRole
    {
        $role = $this->users()->whereKey($user->id)->value('organization_user.role');

        return $role ? OrganizationRole::from($role) : null;
    }

    public function userHasRole(User $user, OrganizationRole ...$roles): bool
    {
        return in_array($this->roleOf($user), $roles, true);
    }
}
