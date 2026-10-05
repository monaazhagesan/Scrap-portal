import { Form, Link } from '@inertiajs/react';
import type { ComponentProps } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { index } from '@/routes/materials';
import type { Material, Option } from '@/types';

type Props = {
    form: Pick<ComponentProps<typeof Form>, 'action' | 'method'>;
    material?: Material;
    categories: Option[];
    units: string[];
    submitLabel: string;
};

export default function MaterialForm({
    form,
    material,
    categories,
    units,
    submitLabel,
}: Props) {
    return (
        <Form {...form} disableWhileProcessing className="max-w-2xl space-y-6">
            {({ processing, errors }) => (
                <>
                    <div className="grid gap-6 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Material name</Label>
                            <Input
                                id="name"
                                name="name"
                                required
                                autoFocus
                                defaultValue={material?.name}
                                placeholder="e.g. HMS 1 & 2"
                            />
                            <InputError message={errors.name} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="code">Code</Label>
                            <Input
                                id="code"
                                name="code"
                                defaultValue={material?.code ?? ''}
                                placeholder="e.g. HMS"
                            />
                            <InputError message={errors.code} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="category">Category</Label>
                            <Select
                                name="category"
                                defaultValue={material?.category}
                                required
                            >
                                <SelectTrigger id="category" className="w-full">
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((category) => (
                                        <SelectItem
                                            key={category.value}
                                            value={category.value}
                                        >
                                            {category.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.category} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="unit">Unit</Label>
                            <Select
                                name="unit"
                                defaultValue={material?.unit ?? 'kg'}
                            >
                                <SelectTrigger id="unit" className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {units.map((unit) => (
                                        <SelectItem key={unit} value={unit}>
                                            {unit}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.unit} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="purchase_rate">
                                Purchase rate (₹)
                            </Label>
                            <Input
                                id="purchase_rate"
                                name="purchase_rate"
                                type="number"
                                step="0.01"
                                min="0"
                                required
                                defaultValue={material?.purchase_rate}
                            />
                            <InputError message={errors.purchase_rate} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="sale_rate">Sale rate (₹)</Label>
                            <Input
                                id="sale_rate"
                                name="sale_rate"
                                type="number"
                                step="0.01"
                                min="0"
                                required
                                defaultValue={material?.sale_rate}
                            />
                            <InputError message={errors.sale_rate} />
                        </div>
                    </div>

                    <label className="flex items-center gap-2 text-sm">
                        <input type="hidden" name="is_active" value="0" />
                        <input
                            type="checkbox"
                            name="is_active"
                            value="1"
                            defaultChecked={material?.is_active ?? true}
                            className="size-4 accent-primary"
                        />
                        Active (available for purchase / sale entries)
                    </label>

                    <div className="flex items-center gap-3">
                        <Button type="submit">
                            {processing && <Spinner />}
                            {submitLabel}
                        </Button>
                        <Button variant="ghost" asChild>
                            <Link href={index()}>Cancel</Link>
                        </Button>
                    </div>
                </>
            )}
        </Form>
    );
}
