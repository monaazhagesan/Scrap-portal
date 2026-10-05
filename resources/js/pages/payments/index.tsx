import { Form, Head, Link } from '@inertiajs/react';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import Heading from '@/components/heading';
import Pagination from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDate, formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import { create, index, show } from '@/routes/payments';
import type { Option, Paginated, PaymentVoucher } from '@/types';

type Props = {
    payments: Paginated<PaymentVoucher>;
    filters: {
        search: string;
        type: string;
        mode: string;
        from: string;
        to: string;
    };
    types: Option[];
    modes: Option[];
};

const selectClass =
    'h-9 rounded-md border border-input bg-transparent px-2 text-sm shadow-xs';

export default function PaymentsIndex({
    payments,
    filters,
    types,
    modes,
}: Props) {
    return (
        <>
            <Head title="Receipts & Payments" />
            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading
                        title="Receipts & Payments"
                        description="Money received from customers and paid to suppliers"
                    />
                    <div className="flex gap-2">
                        <Button asChild>
                            <Link href={create({ query: { type: 'receipt' } })}>
                                <ArrowDownLeft /> New receipt
                            </Link>
                        </Button>
                        <Button variant="secondary" asChild>
                            <Link href={create({ query: { type: 'payment' } })}>
                                <ArrowUpRight /> New payment
                            </Link>
                        </Button>
                    </div>
                </div>

                <Form
                    {...index.form()}
                    options={{ preserveState: true }}
                    className="flex flex-wrap gap-2"
                >
                    <Input
                        name="search"
                        defaultValue={filters.search}
                        placeholder="Voucher, reference or party"
                        className="w-56"
                    />
                    <select
                        name="type"
                        defaultValue={filters.type}
                        className={selectClass}
                        aria-label="Type"
                    >
                        <option value="">Receipts & payments</option>
                        {types.map((type) => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>
                    <select
                        name="mode"
                        defaultValue={filters.mode}
                        className={selectClass}
                        aria-label="Mode"
                    >
                        <option value="">All modes</option>
                        {modes.map((mode) => (
                            <option key={mode.value} value={mode.value}>
                                {mode.label}
                            </option>
                        ))}
                    </select>
                    <Input
                        type="date"
                        name="from"
                        defaultValue={filters.from}
                        className="w-40"
                        aria-label="From"
                    />
                    <Input
                        type="date"
                        name="to"
                        defaultValue={filters.to}
                        className="w-40"
                        aria-label="To"
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
                                    Voucher
                                </th>
                                <th className="px-4 py-3 font-medium">Date</th>
                                <th className="px-4 py-3 font-medium">Party</th>
                                <th className="px-4 py-3 font-medium">Mode</th>
                                <th className="px-4 py-3 text-right font-medium">
                                    Amount
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.data.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-4 py-8 text-center text-muted-foreground"
                                    >
                                        No vouchers yet.
                                    </td>
                                </tr>
                            )}
                            {payments.data.map((payment) => (
                                <tr
                                    key={payment.id}
                                    className={cn(
                                        'border-t hover:bg-muted/30',
                                        payment.status === 'cancelled' &&
                                            'text-muted-foreground line-through',
                                    )}
                                >
                                    <td className="px-4 py-3">
                                        <Link
                                            href={show(payment.id)}
                                            className="font-medium underline-offset-4 hover:underline"
                                        >
                                            {payment.voucher_no}
                                        </Link>
                                        <div className="text-xs text-muted-foreground no-underline">
                                            {payment.type_label}
                                            {payment.status === 'cancelled' && (
                                                <Badge
                                                    variant="destructive"
                                                    className="ml-2"
                                                >
                                                    Cancelled
                                                </Badge>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {formatDate(payment.date)}
                                    </td>
                                    <td className="px-4 py-3">
                                        {payment.party?.name}
                                    </td>
                                    <td className="px-4 py-3">
                                        {payment.mode_label}
                                        {payment.reference_no && (
                                            <div className="text-xs text-muted-foreground">
                                                Ref: {payment.reference_no}
                                            </div>
                                        )}
                                    </td>
                                    <td
                                        className={cn(
                                            'px-4 py-3 text-right font-medium tabular-nums',
                                            payment.status === 'posted' &&
                                                (payment.type === 'receipt'
                                                    ? 'text-emerald-600 dark:text-emerald-400'
                                                    : 'text-destructive'),
                                        )}
                                    >
                                        {payment.type === 'receipt' ? '+' : '−'}
                                        {formatMoney(payment.amount)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <Pagination page={payments} />
            </div>
        </>
    );
}

PaymentsIndex.layout = {
    breadcrumbs: [{ title: 'Receipts & Payments', href: index() }],
};
