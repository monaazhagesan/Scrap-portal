import { Form, Head, Link } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatDate, formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import { cashbook } from '@/routes/accounts';
import { show as showPayment } from '@/routes/payments';

type Row = {
    id: number;
    date: string;
    voucher_no: string;
    party: string | null;
    mode_label: string;
    reference_no: string | null;
    in: number;
    out: number;
    balance: number;
};

type Props = {
    rows: Row[];
    filters: { book: 'cash' | 'bank'; from: string; to: string };
    summary: { opening: number; in: number; out: number; closing: number };
};

export default function Cashbook({ rows, filters, summary }: Props) {
    const books = [
        { value: 'cash', label: 'Cash book' },
        { value: 'bank', label: 'Bank book (UPI / bank / cheque)' },
    ] as const;

    return (
        <>
            <Head title={filters.book === 'cash' ? 'Cash book' : 'Bank book'} />
            <div className="flex flex-col gap-4 p-4">
                <Heading
                    title="Cash & Bank book"
                    description="Money in and out from receipt and payment vouchers"
                />

                <div className="flex flex-wrap gap-2">
                    {books.map((book) => (
                        <Button
                            key={book.value}
                            variant={
                                filters.book === book.value
                                    ? 'default'
                                    : 'outline'
                            }
                            size="sm"
                            asChild
                        >
                            <Link
                                href={cashbook({
                                    query: {
                                        book: book.value,
                                        from: filters.from,
                                        to: filters.to,
                                    },
                                })}
                            >
                                {book.label}
                            </Link>
                        </Button>
                    ))}
                </div>

                <Form
                    {...cashbook.form()}
                    options={{ preserveState: true }}
                    className="flex flex-wrap items-center gap-2"
                >
                    <input type="hidden" name="book" value={filters.book} />
                    <Input
                        type="date"
                        name="from"
                        defaultValue={filters.from}
                        className="w-40"
                        aria-label="From"
                    />
                    <span className="text-sm text-muted-foreground">to</span>
                    <Input
                        type="date"
                        name="to"
                        defaultValue={filters.to}
                        className="w-40"
                        aria-label="To"
                    />
                    <Button type="submit" variant="outline">
                        Apply
                    </Button>
                </Form>

                <div className="grid gap-4 sm:grid-cols-4">
                    {[
                        { label: 'Opening', value: summary.opening },
                        { label: 'Money in', value: summary.in },
                        { label: 'Money out', value: summary.out },
                        { label: 'Closing', value: summary.closing },
                    ].map((card) => (
                        <Card key={card.label}>
                            <CardHeader>
                                <CardDescription>{card.label}</CardDescription>
                                <CardTitle className="text-2xl tabular-nums">
                                    {formatMoney(card.value)}
                                </CardTitle>
                            </CardHeader>
                        </Card>
                    ))}
                </div>

                <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3 font-medium">Date</th>
                                <th className="px-4 py-3 font-medium">
                                    Voucher
                                </th>
                                <th className="px-4 py-3 font-medium">Party</th>
                                <th className="px-4 py-3 text-right font-medium">
                                    In
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    Out
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    Balance
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-t bg-muted/20">
                                <td className="px-4 py-3" colSpan={5}>
                                    Opening balance
                                </td>
                                <td className="px-4 py-3 text-right font-medium tabular-nums">
                                    {formatMoney(summary.opening)}
                                </td>
                            </tr>
                            {rows.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-4 py-8 text-center text-muted-foreground"
                                    >
                                        No transactions in this period.
                                    </td>
                                </tr>
                            )}
                            {rows.map((row) => (
                                <tr key={row.id} className="border-t">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {formatDate(row.date)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Link
                                            href={showPayment(row.id)}
                                            className="font-medium underline-offset-4 hover:underline"
                                        >
                                            {row.voucher_no}
                                        </Link>
                                        <div className="text-xs text-muted-foreground">
                                            {row.mode_label}
                                            {row.reference_no &&
                                                ` · ${row.reference_no}`}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">{row.party}</td>
                                    <td className="px-4 py-3 text-right text-emerald-600 tabular-nums dark:text-emerald-400">
                                        {row.in > 0 ? formatMoney(row.in) : ''}
                                    </td>
                                    <td className="px-4 py-3 text-right text-destructive tabular-nums">
                                        {row.out > 0
                                            ? formatMoney(row.out)
                                            : ''}
                                    </td>
                                    <td
                                        className={cn(
                                            'px-4 py-3 text-right tabular-nums',
                                            row.balance < 0 &&
                                                'text-destructive',
                                        )}
                                    >
                                        {formatMoney(row.balance)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

Cashbook.layout = {
    breadcrumbs: [{ title: 'Cash & Bank book', href: cashbook() }],
};
