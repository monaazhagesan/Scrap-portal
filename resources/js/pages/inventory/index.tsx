import { Form, Head, Link } from '@inertiajs/react';
import { AlertTriangle, Boxes, IndianRupee, Weight } from 'lucide-react';
import Heading from '@/components/heading';
import Pagination from '@/components/pagination';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatDateTime, formatKg, formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import { index, show } from '@/routes/inventory';
import type { InventoryItem, Option, Paginated } from '@/types';

type Props = {
    materials: Paginated<InventoryItem>;
    filters: { search: string; category: string };
    categories: Option[];
    summary: {
        totalStock: number;
        stockValue: number;
        inStock: number;
        negative: number;
    };
};

export default function InventoryIndex({
    materials,
    filters,
    categories,
    summary,
}: Props) {
    const cards = [
        {
            label: 'Total stock',
            value: formatKg(summary.totalStock),
            icon: Weight,
        },
        {
            label: 'Stock value (at buy rate)',
            value: formatMoney(summary.stockValue),
            icon: IndianRupee,
        },
        {
            label: 'Materials in stock',
            value: String(summary.inStock),
            icon: Boxes,
        },
        {
            label: 'Negative stock',
            value: String(summary.negative),
            icon: AlertTriangle,
            alert: summary.negative > 0,
        },
    ];

    return (
        <>
            <Head title="Inventory" />
            <div className="flex flex-col gap-4 p-4">
                <Heading
                    title="Inventory"
                    description="Stock on hand per material, updated from completed weighbridge tickets"
                />

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {cards.map((card) => (
                        <Card key={card.label}>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardDescription>{card.label}</CardDescription>
                                <card.icon
                                    className={cn(
                                        'size-4 text-muted-foreground',
                                        card.alert && 'text-destructive',
                                    )}
                                />
                            </CardHeader>
                            <CardContent>
                                <p
                                    className={cn(
                                        'text-2xl font-semibold tabular-nums',
                                        card.alert && 'text-destructive',
                                    )}
                                >
                                    {card.value}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Form
                    {...index.form()}
                    options={{ preserveState: true }}
                    className="flex flex-wrap gap-2"
                >
                    <Input
                        name="search"
                        defaultValue={filters.search}
                        placeholder="Material name or code"
                        className="w-56"
                    />
                    <select
                        name="category"
                        defaultValue={filters.category}
                        aria-label="Category"
                        className="h-9 rounded-md border border-input bg-transparent px-2 text-sm shadow-xs"
                    >
                        <option value="">All categories</option>
                        {categories.map((category) => (
                            <option key={category.value} value={category.value}>
                                {category.label}
                            </option>
                        ))}
                    </select>
                    <Button type="submit" variant="outline">
                        Filter
                    </Button>
                    <Button variant="ghost" asChild>
                        <Link href={index()}>Reset</Link>
                    </Button>
                </Form>

                <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3 font-medium">
                                    Material name
                                </th>
                                <th className="px-4 py-3 font-medium">Code</th>
                                <th className="px-4 py-3 font-medium">
                                    Category
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    Stock
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    Value
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    Last movement
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {materials.data.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-4 py-8 text-center text-muted-foreground"
                                    >
                                        No materials found.
                                    </td>
                                </tr>
                            )}
                            {materials.data.map((material) => (
                                <tr
                                    key={material.id}
                                    className="border-t hover:bg-muted/30"
                                >
                                    <td className="px-4 py-3">
                                        <Link
                                            href={show(material.id)}
                                            className="font-medium underline-offset-4 hover:underline"
                                        >
                                            {material.name}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {material.code ?? '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        {material.category_label}
                                    </td>
                                    <td
                                        className={cn(
                                            'px-4 py-3 text-right font-semibold tabular-nums',
                                            material.stock < 0 &&
                                                'text-destructive',
                                            material.stock === 0 &&
                                                'font-normal text-muted-foreground',
                                        )}
                                    >
                                        {formatKg(material.stock)}
                                        {material.unit === 'ton' &&
                                            material.stock !== 0 && (
                                                <div className="text-xs font-normal text-muted-foreground">
                                                    {(
                                                        material.stock / 1000
                                                    ).toFixed(3)}{' '}
                                                    ton
                                                </div>
                                            )}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {formatMoney(material.stock_value)}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {formatDateTime(
                                            material.last_movement_at,
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <Pagination page={materials} />
            </div>
        </>
    );
}

InventoryIndex.layout = {
    breadcrumbs: [{ title: 'Inventory', href: index() }],
};
