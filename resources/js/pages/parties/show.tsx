import { Form, Head, Link } from '@inertiajs/react';
import { Pencil, Printer } from 'lucide-react';
import BalanceText from '@/components/balance-text';
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
import { formatBalance, formatDate, formatMoney } from '@/lib/format';
import { edit, index, show } from '@/routes/parties';
import {
    create as createPayment,
    show as showPayment,
} from '@/routes/payments';
import { show as showWeighment } from '@/routes/weighments';
import type { LedgerRow, Paginated, Party } from '@/types';

type Props = {
    party: Party & { opening_balance: string };
    entries: Paginated<LedgerRow>;
    filters: { from: string; to: string };
    statement: {
        opening: number;
        debit: number;
        credit: number;
        closing: number;
    };
    organization: {
        name: string;
        address: string | null;
        phone: string | null;
        tax_number: string | null;
    } | null;
};

export default function PartyStatement({
    party,
    entries,
    filters,
    statement,
    organization,
}: Props) {
    const period =
        filters.from || filters.to
            ? `${filters.from ? formatDate(filters.from) : 'Beginning'} to ${filters.to ? formatDate(filters.to) : 'Today'}`
            : 'All transactions';

    return (
        <>
            <Head title={`${party.name} · Statement`} />
            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
                    <div>
                        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
                            {party.name}
                            <Badge variant="outline">{party.type_label}</Badge>
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {[
                                party.phone,
                                party.gstin && `GSTIN ${party.gstin}`,
                                party.state,
                            ]
                                .filter(Boolean)
                                .join(' · ')}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button asChild>
                            <Link
                                href={createPayment({
                                    query: { party: party.id, type: 'receipt' },
                                })}
                            >
                                Record receipt
                            </Link>
                        </Button>
                        <Button variant="secondary" asChild>
                            <Link
                                href={createPayment({
                                    query: { party: party.id, type: 'payment' },
                                })}
                            >
                                Record payment
                            </Link>
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => window.print()}
                        >
                            <Printer /> Print
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                            <Link href={edit(party.id)} aria-label="Edit party">
                                <Pencil />
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3 print:hidden">
                    <Card>
                        <CardHeader>
                            <CardDescription>Current balance</CardDescription>
                            <CardTitle className="text-2xl">
                                <BalanceText value={party.balance} />
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs text-muted-foreground">
                            {party.balance > 0
                                ? 'They owe you (receivable)'
                                : party.balance < 0
                                  ? 'You owe them (payable)'
                                  : 'Settled'}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardDescription>
                                Debits in period (sales, payments made)
                            </CardDescription>
                            <CardTitle className="text-2xl tabular-nums">
                                {formatMoney(statement.debit)}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardDescription>
                                Credits in period (purchases, receipts)
                            </CardDescription>
                            <CardTitle className="text-2xl tabular-nums">
                                {formatMoney(statement.credit)}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                <Form
                    {...show.form(party.id)}
                    options={{ preserveState: true }}
                    className="flex flex-wrap items-center gap-2 print:hidden"
                >
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
                    <Button variant="ghost" asChild>
                        <Link href={show(party.id)}>All time</Link>
                    </Button>
                </Form>

                <div className="print-area overflow-x-auto rounded-xl border">
                    <div className="hidden p-4 text-center print:block">
                        <p className="text-lg font-semibold">
                            {organization?.name}
                        </p>
                        <p className="text-xs">
                            {[organization?.address, organization?.phone]
                                .filter(Boolean)
                                .join(' · ')}
                            {organization?.tax_number &&
                                ` · GSTIN ${organization.tax_number}`}
                        </p>
                        <p className="pt-2 font-semibold">
                            Account statement: {party.name}
                        </p>
                        <p className="text-xs">{period}</p>
                    </div>
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3 font-medium">Date</th>
                                <th className="px-4 py-3 font-medium">
                                    Particulars
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    Debit
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    Credit
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    Balance
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.current_page === 1 && (
                                <tr className="border-t bg-muted/20">
                                    <td className="px-4 py-3" />
                                    <td className="px-4 py-3 font-medium">
                                        Opening balance
                                    </td>
                                    <td className="px-4 py-3" />
                                    <td className="px-4 py-3" />
                                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                                        {formatBalance(statement.opening)}
                                    </td>
                                </tr>
                            )}
                            {entries.data.map((entry) => (
                                <tr key={entry.id} className="border-t">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {formatDate(entry.date)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium">
                                            {entry.type_label}
                                            {entry.weighment && (
                                                <Link
                                                    href={showWeighment(
                                                        entry.weighment.id,
                                                    )}
                                                    className="ml-2 underline-offset-4 hover:underline"
                                                >
                                                    {entry.weighment.ticket_no}
                                                </Link>
                                            )}
                                            {entry.payment && (
                                                <Link
                                                    href={showPayment(
                                                        entry.payment.id,
                                                    )}
                                                    className="ml-2 underline-offset-4 hover:underline"
                                                >
                                                    {entry.payment.voucher_no}
                                                </Link>
                                            )}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {entry.narration}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {Number(entry.debit) > 0
                                            ? formatMoney(entry.debit)
                                            : ''}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {Number(entry.credit) > 0
                                            ? formatMoney(entry.credit)
                                            : ''}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {formatBalance(entry.balance)}
                                    </td>
                                </tr>
                            ))}
                            {entries.current_page === entries.last_page && (
                                <tr className="border-t-2 font-semibold">
                                    <td className="px-4 py-3" />
                                    <td className="px-4 py-3">
                                        Closing balance
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {formatMoney(statement.debit)}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {formatMoney(statement.credit)}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {formatBalance(statement.closing)}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination page={entries} />

                <p className="text-xs text-muted-foreground print:hidden">
                    Sales currently post the weighbridge amount (before GST).
                    Once GST invoicing is added, sales will post the invoice
                    total including GST and TCS.
                </p>
            </div>
        </>
    );
}

PartyStatement.layout = {
    breadcrumbs: [
        { title: 'Parties', href: index() },
        { title: 'Statement', href: index() },
    ],
};
