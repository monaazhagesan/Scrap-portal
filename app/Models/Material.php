<?php

namespace App\Models;

use App\Enums\MaterialCategory;
use App\Models\Concerns\BelongsToOrganization;
use Database\Factories\MaterialFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A scrap material type with its current buy/sell rate, e.g. "HMS 1&2" or "Copper Armature".
 *
 * @property int $id
 * @property int $organization_id
 * @property string $name
 * @property string|null $code
 * @property MaterialCategory $category
 * @property string $unit
 * @property string $purchase_rate
 * @property string $sale_rate
 * @property bool $is_active
 * @property-read string|null $stock Sum of stock movements in kg, when loaded via withSum('stockMovements as stock', 'quantity')
 * @property-read string|null $last_movement_at When loaded via withMax('stockMovements as last_movement_at', 'created_at')
 */
#[Fillable(['name', 'code', 'category', 'unit', 'purchase_rate', 'sale_rate', 'is_active'])]
class Material extends Model
{
    /** @use HasFactory<MaterialFactory> */
    use BelongsToOrganization, HasFactory;

    public const UNITS = ['kg', 'ton', 'piece'];

    protected function casts(): array
    {
        return [
            'category' => MaterialCategory::class,
            'purchase_rate' => 'decimal:2',
            'sale_rate' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    /**
     * @return HasMany<StockMovement, $this>
     */
    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }
}
