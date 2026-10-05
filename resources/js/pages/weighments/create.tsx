import { Form, Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import WeighmentController from '@/actions/App/Http/Controllers/WeighmentController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { create as createParty } from '@/routes/parties';
import { create, index } from '@/routes/weighments';
import type { Material, Option, Party } from '@/types';

type Props = {
    directions: Option[];
    materials: Pick<
        Material,
        'id' | 'name' | 'unit' | 'purchase_rate' | 'sale_rate'
    >[];
    parties: Pick<Party, 'id' | 'name' | 'type'>[];
};

const fieldClass =
    'h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs';

export default function CreateWeighment({
    directions,
    materials,
    parties,
}: Props) {
    const [currentDirection, setCurrentDirection] = useState(
        directions[0]?.value ?? 'inward',
    );

    return (
        <>
            <Head title="New weighment" />
            <div className="p-4">
                <Heading
                    title="New weighment"
                    description="Record the vehicle details and its first weight on the bridge"
                />

                <Form
                    {...WeighmentController.store.form()}
                    disableWhileProcessing
                    className="max-w-3xl space-y-8"
                >
                    {({ processing, errors }) => (
                        <>
                            <fieldset className="space-y-3">
                                <legend className="text-sm font-medium">
                                    Direction
                                </legend>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {directions.map((direction, i) => (
                                        <label
                                            key={direction.value}
                                            className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 has-checked:border-primary has-checked:bg-muted/50"
                                        >
                                            <input
                                                type="radio"
                                                name="direction"
                                                value={direction.value}
                                                defaultChecked={i === 0}
                                                onChange={() =>
                                                    setCurrentDirection(
                                                        direction.value,
                                                    )
                                                }
                                                className="accent-primary"
                                            />
                                            <span className="text-sm font-medium">
                                                {direction.label}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                                <InputError message={errors.direction} />
                            </fieldset>

                            <div className="grid gap-6 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="vehicle_number">
                                        Vehicle number
                                    </Label>
                                    <Input
                                        id="vehicle_number"
                                        name="vehicle_number"
                                        required
                                        autoFocus
                                        placeholder="TN 09 AB 1234"
                                        className="uppercase"
                                    />
                                    <InputError
                                        message={errors.vehicle_number}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="vehicle_type">
                                        Vehicle type
                                    </Label>
                                    <Input
                                        id="vehicle_type"
                                        name="vehicle_type"
                                        list="vehicle-types"
                                        placeholder="e.g. Lorry, Tractor, Mini truck"
                                    />
                                    <datalist id="vehicle-types">
                                        <option value="Lorry" />
                                        <option value="Truck (10 wheel)" />
                                        <option value="Mini truck" />
                                        <option value="Tractor" />
                                        <option value="Tempo" />
                                        <option value="Trailer" />
                                    </datalist>
                                    <InputError message={errors.vehicle_type} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="driver_name">
                                        Driver name
                                    </Label>
                                    <Input
                                        id="driver_name"
                                        name="driver_name"
                                    />
                                    <InputError message={errors.driver_name} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="driver_phone">
                                        Driver phone
                                    </Label>
                                    <Input
                                        id="driver_phone"
                                        name="driver_phone"
                                        type="tel"
                                    />
                                    <InputError message={errors.driver_phone} />
                                </div>

                                <div className="grid gap-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="party_id">
                                            {currentDirection === 'inward'
                                                ? 'Supplier'
                                                : 'Customer'}
                                        </Label>
                                        <Link
                                            href={createParty()}
                                            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                                        >
                                            + New party
                                        </Link>
                                    </div>
                                    <select
                                        key={currentDirection}
                                        id="party_id"
                                        name="party_id"
                                        defaultValue=""
                                        className={fieldClass}
                                    >
                                        <option value="">
                                            Select party (needed for ledger)
                                        </option>
                                        {parties
                                            .filter(
                                                (party) =>
                                                    party.type === 'both' ||
                                                    party.type ===
                                                        (currentDirection ===
                                                        'inward'
                                                            ? 'supplier'
                                                            : 'customer'),
                                            )
                                            .map((party) => (
                                                <option
                                                    key={party.id}
                                                    value={party.id}
                                                >
                                                    {party.name}
                                                </option>
                                            ))}
                                    </select>
                                    <InputError message={errors.party_id} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="material_id">
                                        Material
                                    </Label>
                                    <select
                                        id="material_id"
                                        name="material_id"
                                        defaultValue=""
                                        className={fieldClass}
                                    >
                                        <option value="">
                                            Select material (optional)
                                        </option>
                                        {materials.map((material) => (
                                            <option
                                                key={material.id}
                                                value={material.id}
                                            >
                                                {material.name} (per{' '}
                                                {material.unit})
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.material_id} />
                                </div>
                            </div>

                            <div className="grid gap-2 rounded-lg border bg-muted/30 p-4 sm:max-w-sm">
                                <Label htmlFor="first_weight">
                                    First weight (kg)
                                </Label>
                                <Input
                                    id="first_weight"
                                    name="first_weight"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    required
                                    inputMode="decimal"
                                    className="h-12 text-2xl font-semibold tabular-nums"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Loaded weight for inward, empty weight for
                                    outward vehicles.
                                </p>
                                <InputError message={errors.first_weight} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="remarks">Remarks</Label>
                                <textarea
                                    id="remarks"
                                    name="remarks"
                                    rows={2}
                                    className="rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs"
                                />
                                <InputError message={errors.remarks} />
                            </div>

                            <div className="flex items-center gap-3">
                                <Button type="submit">
                                    {processing && <Spinner />}
                                    Save first weight
                                </Button>
                                <Button variant="ghost" asChild>
                                    <Link href={index()}>Cancel</Link>
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

CreateWeighment.layout = {
    breadcrumbs: [
        { title: 'Weighbridge', href: index() },
        { title: 'New weighment', href: create() },
    ],
};
