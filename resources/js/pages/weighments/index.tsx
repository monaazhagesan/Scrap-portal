import { Form, Head, Link } from '@inertiajs/react';
import { ArrowDownToLine, ArrowUpFromLine, Clock, Plus } from 'lucide-react';
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
import WeighmentStatusBadge from '@/components/weighment-status-badge';
import { formatDateTime, formatKg, formatMoney } from '@/lib/format';
import { create, index, show } from '@/routes/weighments';
import type { Option, Paginated, Weighment } from '@/types';

type Props = {
    weighments: Paginated<Weighment>;
    filters: {
        search: string;
        status: string;
        direction: string;
        date: string;
    };
    statuses: Option[];
    directions: Option[];
    today: {
        inwardTickets: number;
        inwardNet: number;
        outwardTickets: number;
        outwardNet: number;
        open: number;
    };
};

const selectClass =
    'h-9 rounded-md border border-input bg-transparent px-2 text-sm shadow-xs';

export default function WeighmentsIndex({
    weighments,
    filters,
    statuses,
    directions,
    today,
}: Props) {
    const stats = [
        {
            label: "Today's inward",
            value: formatKg(today.inwardNet),
            hint: `${today.inwardTickets} tickets`,
            icon: ArrowDownToLine,
        },
        {
            label: "Today's outward",
            value: formatKg(today.outwardNet),
            hint: `${today.outwardTickets} tickets`,
            icon: ArrowUpFromLine,
        },
        {
            label: 'Awaiting 2nd weight',
            value: String(today.open),
            hint: 'Vehicles still in yard',
            icon: Clock,
        },
    ];

    return (
        <>
            <Head title="Weighbridge" />
            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading
                        title="Weighbridge"
                        description="Weighment tickets for vehicles entering and leaving the yard"
                    />
                    <Button asChild>
                        <Link href={create()}>
                            <Plus /> New weighment
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    {stats.map((stat) => (
                        <Card key={stat.label}>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardDescription>{stat.label}</CardDescription>
                                <stat.icon className="size-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-semibold tabular-nums">
                                    {stat.value}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {stat.hint}
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
                        placeholder="Ticket, vehicle or party"
                        className="w-56"
                    />
                    <select
                        name="direction"
                        defaultValue={filters.direction}
                        className={selectClass}
                        aria-label="Direction"
                    >
                        <option value="">All directions</option>
                        {directions.map((direction) => (
                            <option
                                key={direction.value}
                                value={direction.value}
                            >
                                {direction.label}
                            </option>
                        ))}
                    </select>
                    <select
                        name="status"
                        defaultValue={filters.status}
                        className={selectClass}
                        aria-label="Status"
                    >
                        <option value="">All statuses</option>
                        {statuses.map((status) => (
                            <option key={status.value} value={status.value}>
                                {status.label}
                            </option>
                        ))}
                    </select>
                    <Input
                        type="date"
                        name="date"
                        defaultValue={filters.date}
                        className="w-40"
                        aria-label="Date"
                    />
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
                                    Ticket
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    Vehicle
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    Party / Material
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    1st weight
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    Net weight
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    Amount
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {weighments.data.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="px-4 py-8 text-center text-muted-foreground"
                                    >
                                        No weighments found.
                                    </td>
                                </tr>
                            )}
                            {weighments.data.map((weighment) => (
                                <tr
                                    key={weighment.id}
                                    className="border-t hover:bg-muted/30"
                                >
                                    <td className="px-4 py-3">
                                        <Link
                                            href={show(weighment.id)}
                                            className="font-medium underline-offset-4 hover:underline"
                                        >
                                            {weighment.ticket_no}
                                        </Link>
                                        <div className="text-xs text-muted-foreground">
                                            {formatDateTime(
                                                weighment.first_weighed_at,
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium">
                                            {weighment.vehicle_number}
                                        </div>
                                        <div className="text-xs text-muted-foreground capitalize">
                                            {weighment.direction}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div>{weighment.party_name ?? '—'}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {weighment.material?.name ?? '—'}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {formatKg(weighment.first_weight)}
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                                        {formatKg(weighment.net_weight)}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {formatMoney(weighment.amount)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <WeighmentStatusBadge
                                            status={weighment.status}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <Pagination page={weighments} />
            </div>
        </>
    );
}

WeighmentsIndex.layout = {
    breadcrumbs: [{ title: 'Weighbridge', href: index() }],
};
