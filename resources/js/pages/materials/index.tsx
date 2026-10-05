import { Form, Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import Heading from '@/components/heading';
import Pagination from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { create, destroy, edit, index } from '@/routes/materials';
import type { Material, Option, Paginated } from '@/types';

type Props = {
    materials: Paginated<Material>;
    filters: { search: string };
    categories: Option[];
};

export default function MaterialsIndex({
    materials,
    filters,
    categories,
}: Props) {
    const categoryLabel = (value: string) =>
        categories.find((category) => category.value === value)?.label ?? value;

    const remove = (material: Material) => {
        if (confirm(`Delete "${material.name}"?`)) {
            router.delete(destroy.url(material.id), { preserveScroll: true });
        }
    };

    return (
        <>
            <Head title="Materials & Rates" />
            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading
                        title="Materials & Rates"
                        description="Scrap materials your business buys and sells"
                    />
                    <Button asChild>
                        <Link href={create()}>
                            <Plus /> Add material
                        </Link>
                    </Button>
                </div>

                <Form
                    {...index.form()}
                    options={{ preserveState: true }}
                    className="flex max-w-md gap-2"
                >
                    <Input
                        name="search"
                        defaultValue={filters.search}
                        placeholder="Search by name or code"
                    />
                    <Button type="submit" variant="outline">
                        Search
                    </Button>
                </Form>

                <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3 font-medium">Name</th>
                                <th className="px-4 py-3 font-medium">
                                    Category
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    Buy rate
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    Sell rate
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    Status
                                </th>
                                <th className="px-4 py-3" />
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
                                <tr key={material.id} className="border-t">
                                    <td className="px-4 py-3">
                                        <div className="font-medium">
                                            {material.name}
                                        </div>
                                        {material.code && (
                                            <div className="text-xs text-muted-foreground">
                                                {material.code}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        {categoryLabel(material.category)}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        ₹{material.purchase_rate}/
                                        {material.unit}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        ₹{material.sale_rate}/{material.unit}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge
                                            variant={
                                                material.is_active
                                                    ? 'secondary'
                                                    : 'outline'
                                            }
                                        >
                                            {material.is_active
                                                ? 'Active'
                                                : 'Inactive'}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                asChild
                                            >
                                                <Link
                                                    href={edit(material.id)}
                                                    aria-label="Edit"
                                                >
                                                    <Pencil />
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                aria-label="Delete"
                                                onClick={() => remove(material)}
                                            >
                                                <Trash2 />
                                            </Button>
                                        </div>
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

MaterialsIndex.layout = {
    breadcrumbs: [{ title: 'Materials & Rates', href: index() }],
};
