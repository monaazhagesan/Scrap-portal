import { Form, Head, Link } from '@inertiajs/react';
import InventoryController from '@/actions/App/Http/Controllers/InventoryController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import Pagination from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { formatDateTime, formatKg, formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import { index } from '@/routes/inventory';
import { show as showWeighment } from '@/routes/weighments';
import type { InventoryItem, Paginated, StockMovement } from '@/types';

type Props = {
    material: InventoryItem;
    movements: Paginated<StockMovement>;
    canAdjust: boolean;
};

const typeVariant = {
    inward: 'secondary',
    outward: 'outline',
    reversal: 'destructive',
    adjustment: 'outline',
} as const;

export default function InventoryShow({
    material,
    movements,
    canAdjust,
}: Props) {
    return (
        <>
            <Head title={`Stock · ${material.name}`} />
            <div className="flex flex-col gap-6 p-4">
                <Heading
                    title={material.name}
                    description={[material.code, material.category_label]
                        .filter(Boolean)
                        .join(' · ')}
                />

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                    <div className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardDescription>
                                        Stock on hand
                                    </CardDescription>
                                    <CardTitle
                                        className={cn(
                                            'text-3xl tabular-nums',
                                            material.stock < 0 &&
                                                'text-destructive',
                                        )}
                                    >
                                        {formatKg(material.stock)}
                                    </CardTitle>
                                </CardHeader>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardDescription>
                                        Value @{' '}
                                        {formatMoney(material.purchase_rate)} /{' '}
                                        {material.unit}
                                    </CardDescription>
                                    <CardTitle className="text-3xl tabular-nums">
                                        {formatMoney(material.stock_value)}
                                    </CardTitle>
                                </CardHeader>
                            </Card>
                        </div>

                        <div className="overflow-x-auto rounded-xl border">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 text-left text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">
                                            Date
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Type
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Reference
                                        </th>
                                        <th className="px-4 py-3 text-right font-medium">
                                            In / Out
                                        </th>
                                        <th className="px-4 py-3 text-right font-medium">
                                            Balance
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {movements.data.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="px-4 py-8 text-center text-muted-foreground"
                                            >
                                                No stock movements yet. Complete
                                                a weighbridge ticket or post an
                                                adjustment.
                                            </td>
                                        </tr>
                                    )}
                                    {movements.data.map((movement) => {
                                        const quantity = Number(
                                            movement.quantity,
                                        );

                                        return (
                                            <tr
                                                key={movement.id}
                                                className="border-t"
                                            >
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {formatDateTime(
                                                        movement.created_at,
                                                    )}
                                                    <div className="text-xs text-muted-foreground">
                                                        {movement.creator
                                                            ?.name ?? ''}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge
                                                        variant={
                                                            typeVariant[
                                                                movement.type
                                                            ]
                                                        }
                                                    >
                                                        {movement.type_label}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {movement.weighment ? (
                                                        <Link
                                                            href={showWeighment(
                                                                movement
                                                                    .weighment
                                                                    .id,
                                                            )}
                                                            className="font-medium underline-offset-4 hover:underline"
                                                        >
                                                            {
                                                                movement
                                                                    .weighment
                                                                    .ticket_no
                                                            }
                                                        </Link>
                                                    ) : null}
                                                    <div className="text-xs text-muted-foreground">
                                                        {movement.notes}
                                                    </div>
                                                </td>
                                                <td
                                                    className={cn(
                                                        'px-4 py-3 text-right font-medium tabular-nums',
                                                        quantity >= 0
                                                            ? 'text-emerald-600 dark:text-emerald-400'
                                                            : 'text-destructive',
                                                    )}
                                                >
                                                    {quantity >= 0 ? '+' : '−'}
                                                    {formatKg(
                                                        Math.abs(quantity),
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right tabular-nums">
                                                    {formatKg(movement.balance)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <Pagination page={movements} />
                    </div>

                    {canAdjust && <AdjustStockForm material={material} />}
                </div>
            </div>
        </>
    );
}

function AdjustStockForm({ material }: { material: InventoryItem }) {
    return (
        <Card className="h-fit">
            <CardHeader>
                <CardTitle>Adjust stock</CardTitle>
                <CardDescription>
                    For opening stock, physical count differences, wastage or
                    burning loss.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form
                    {...InventoryController.adjust.form(material.id)}
                    options={{ preserveScroll: true }}
                    resetOnSuccess
                    className="space-y-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { value: 'add', label: 'Add stock' },
                                    { value: 'remove', label: 'Remove stock' },
                                ].map((option, i) => (
                                    <label
                                        key={option.value}
                                        className="flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm has-checked:border-primary has-checked:bg-muted/50"
                                    >
                                        <input
                                            type="radio"
                                            name="action"
                                            value={option.value}
                                            defaultChecked={i === 0}
                                            className="accent-primary"
                                        />
                                        {option.label}
                                    </label>
                                ))}
                            </div>
                            <InputError message={errors.action} />

                            <div className="grid gap-2">
                                <Label htmlFor="quantity">Quantity (kg)</Label>
                                <Input
                                    id="quantity"
                                    name="quantity"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    required
                                    inputMode="decimal"
                                />
                                <InputError message={errors.quantity} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="reason">Reason</Label>
                                <Input
                                    id="reason"
                                    name="reason"
                                    required
                                    list="adjust-reasons"
                                    placeholder="e.g. Opening stock"
                                />
                                <datalist id="adjust-reasons">
                                    <option value="Opening stock" />
                                    <option value="Physical stock count" />
                                    <option value="Wastage / burning loss" />
                                    <option value="Sorting / grading" />
                                </datalist>
                                <InputError message={errors.reason} />
                            </div>

                            <Button type="submit" className="w-full">
                                {processing && <Spinner />}
                                Save adjustment
                            </Button>
                        </>
                    )}
                </Form>
            </CardContent>
        </Card>
    );
}

InventoryShow.layout = {
    breadcrumbs: [
        { title: 'Inventory', href: index() },
        { title: 'Stock ledger', href: index() },
    ],
};
