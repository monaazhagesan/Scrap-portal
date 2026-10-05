<?php

namespace App\Models;

use App\Enums\StockMovementType;
use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One entry in a material's stock ledger. Stock on hand is the sum of `quantity` (kg).
 *
 * @property int $id
 * @property int $organization_id
 * @property int $material_id
 * @property StockMovementType $type
 * @property string $quantity
 * @property int|null $weighment_id
 * @property string|null $notes
 * @property int|null $created_by
 */
#[Fillable(['material_id', 'type', 'quantity', 'weighment_id', 'notes', 'created_by'])]
class StockMovement extends Model
{
    use BelongsToOrganization;

    protected function casts(): array
    {
        return [
            'type' => StockMovementType::class,
            'quantity' => 'decimal:2',
        ];
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public static function record(Material $material, array $attributes): self
    {
        $movement = new self(['material_id' => $material->id, ...$attributes]);
        $movement->organization_id = $material->organization_id;
        $movement->save();

        return $movement;
    }

    /**
     * @return BelongsTo<Material, $this>
     */
    public function material(): BelongsTo
    {
        return $this->belongsTo(Material::class);
    }

    /**
     * @return BelongsTo<Weighment, $this>
     */
    public function weighment(): BelongsTo
    {
        return $this->belongsTo(Weighment::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
