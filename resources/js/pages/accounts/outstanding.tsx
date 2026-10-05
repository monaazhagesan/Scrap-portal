import { Head, Link } from '@inertiajs/react';
import Heading from '@/components/heading';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { formatMoney } from '@/lib/format';
import { outstanding } from '@/routes/accounts';
import { show as showParty } from '@/routes/parties';
import { create as createPayment } from '@/routes/payments';

type Row = {
    id: number;
    name: string;
    phone: string | null;
    type_label: string;
    balance: number;
};

type Props = {
    receivables: Row[];
    payables: Row[];
    totals: { receivable: number; payable: number };
};

export default function Outstanding({ receivables, payables, totals }: Props) {
    return (
        <>
            <Head title="Outstanding" />
            <div className="flex flex-col gap-6 p-4">
                <Heading
                    title="Outstanding"
                    description="Who owes you and whom you owe"
                />

                <div className="grid gap-6 lg:grid-cols-2">
                    <OutstandingList
                        title="Receivables"
                        description="Parties who owe you"
                        total={totals.receivable}
                        rows={receivables}
                        tone="text-emerald-600 dark:text-emerald-400"
                        action="receipt"
                    />
                    <OutstandingList
                        title="Payables"
                        description="Parties you owe"
                        total={totals.payable}
                        rows={payables}
                        tone="text-destructive"
                        action="payment"
                    />
                </div>
            </div>
        </>
    );
}

function OutstandingList({
    title,
    description,
    total,
    rows,
    tone,
    action,
}: {
    title: string;
    description: string;
    total: number;
    rows: Row[];
    tone: string;
    action: 'receipt' | 'payment';
}) {
    return (
        <Card>
            <CardHeader>
                <CardDescription>{description}</CardDescription>
                <CardTitle className={`text-3xl tabular-nums ${tone}`}>
                    {formatMoney(total)}
                </CardTitle>
                <p className="text-sm font-medium">{title}</p>
            </CardHeader>
            <CardContent>
                {rows.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Nothing outstanding.
                    </p>
                ) : (
                    <table className="w-full text-sm">
                        <tbody>
                            {rows.map((row) => (
                                <tr key={row.id} className="border-t">
                                    <td className="py-2">
                                        <Link
                                            href={showParty(row.id)}
                                            className="font-medium underline-offset-4 hover:underline"
                                        >
                                            {row.name}
                                        </Link>
                                        <div className="text-xs text-muted-foreground">
                                            {[row.type_label, row.phone]
                                                .filter(Boolean)
                                                .join(' · ')}
                                        </div>
                                    </td>
                                    <td className="py-2 text-right font-medium tabular-nums">
                                        {formatMoney(Math.abs(row.balance))}
                                    </td>
                                    <td className="w-24 py-2 text-right">
                                        <Link
                                            href={createPayment({
                                                query: {
                                                    party: row.id,
                                                    type: action,
                                                },
                                            })}
                                            className="text-xs underline-offset-4 hover:underline"
                                        >
                                            {action === 'receipt'
                                                ? 'Receive'
                                                : 'Pay'}
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </CardContent>
        </Card>
    );
}

Outstanding.layout = {
    breadcrumbs: [{ title: 'Outstanding', href: outstanding() }],
};
