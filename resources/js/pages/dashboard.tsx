import { Head, Link, usePage } from '@inertiajs/react';
import { Package, PackageCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { formatMoney } from '@/lib/format';
import { dashboard } from '@/routes';
import { create as createMaterial } from '@/routes/materials';
import type { Material } from '@/types';

type Props = {
    accounts: { receivable: number; payable: number } | null;
    stats: {
        materials: number;
        activeMaterials: number;
        members: number;
    };
    recentMaterials: Pick<
        Material,
        'id' | 'name' | 'category' | 'unit' | 'purchase_rate' | 'sale_rate'
    >[];
};

export default function Dashboard({ stats, recentMaterials, accounts }: Props) {
    const { tenant } = usePage().props;

    const cards = [
        { title: 'Materials', value: stats.materials, icon: Package },
        {
            title: 'Active materials',
            value: stats.activeMaterials,
            icon: PackageCheck,
        },
        { title: 'Team members', value: stats.members, icon: Users },
    ];

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">
                        {tenant?.name}
                    </h1>
                    {tenant?.onTrial && (
                        <p className="text-sm text-muted-foreground">
                            You are on a free trial of the {tenant.plan} plan —{' '}
                            {tenant.trialDaysLeft} days left.
                        </p>
                    )}
                </div>

                {accounts && (
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardDescription>
                                    To receive (customers owe you)
                                </CardDescription>
                                <CardTitle className="text-3xl text-emerald-600 tabular-nums dark:text-emerald-400">
                                    {formatMoney(accounts.receivable)}
                                </CardTitle>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardDescription>
                                    To pay (you owe suppliers)
                                </CardDescription>
                                <CardTitle className="text-3xl text-destructive tabular-nums">
                                    {formatMoney(accounts.payable)}
                                </CardTitle>
                            </CardHeader>
                        </Card>
                    </div>
                )}

                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    {cards.map((card) => (
                        <Card key={card.title}>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardDescription>{card.title}</CardDescription>
                                <card.icon className="size-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-semibold tabular-nums">
                                    {card.value}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Recently added materials</CardTitle>
                        <Button size="sm" asChild>
                            <Link href={createMaterial()}>Add material</Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {recentMaterials.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No materials yet. Add your first scrap material
                                and its buying / selling rate.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="text-left text-muted-foreground">
                                        <tr>
                                            <th className="py-2 font-medium">
                                                Material
                                            </th>
                                            <th className="py-2 text-right font-medium">
                                                Buy rate
                                            </th>
                                            <th className="py-2 text-right font-medium">
                                                Sell rate
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentMaterials.map((material) => (
                                            <tr
                                                key={material.id}
                                                className="border-t"
                                            >
                                                <td className="py-2">
                                                    {material.name}
                                                </td>
                                                <td className="py-2 text-right tabular-nums">
                                                    ₹{material.purchase_rate}/
                                                    {material.unit}
                                                </td>
                                                <td className="py-2 text-right tabular-nums">
                                                    ₹{material.sale_rate}/
                                                    {material.unit}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
