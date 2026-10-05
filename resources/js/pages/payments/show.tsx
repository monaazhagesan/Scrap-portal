import { Form, Head, Link } from '@inertiajs/react';
import { Printer } from 'lucide-react';
import { useState } from 'react';
import PaymentController from '@/actions/App/Http/Controllers/PaymentController';
import BalanceText from '@/components/balance-text';
import InputError from '@/components/input-error';
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
import { formatDate, formatMoney } from '@/lib/format';
import { show as showParty } from '@/routes/parties';
import { index } from '@/routes/payments';
import type { PaymentVoucher } from '@/types';

type Props = {
    payment: Omit<PaymentVoucher, 'party'> & {
        notes: string | null;
        created_by_name: string | null;
        party: {
            id: number;
            name: string;
            phone: string | null;
            gstin: string | null;
            address: string | null;
            balance: number;
        };
    };
    organization: {
        name: string;
        address: string | null;
        phone: string | null;
        tax_number: string | null;
    };
    canCancel: boolean;
};

export default function ShowPayment({
    payment,
    organization,
    canCancel,
}: Props) {
    const isReceipt = payment.type === 'receipt';
    const rows: [string, string][] = [
        ['Voucher no', payment.voucher_no],
        ['Date', formatDate(payment.date)],
        [isReceipt ? 'Received from' : 'Paid to', payment.party.name],
        ['Mode', payment.mode_label],
        ['Reference', payment.reference_no ?? '—'],
    ];

    return (
        <>
            <Head title={payment.voucher_no} />
            <div className="flex flex-col gap-6 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-semibold tracking-tight">
                            {payment.type_label} {payment.voucher_no}
                        </h1>
                        {payment.status === 'cancelled' && (
                            <Badge variant="destructive">Cancelled</Badge>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => window.print()}
                        >
                            <Printer /> Print voucher
                        </Button>
                        <Button variant="secondary" asChild>
                            <Link href={showParty(payment.party.id)}>
                                Party statement
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                    <Card className="print-area">
                        <CardHeader className="border-b text-center">
                            <CardTitle className="text-lg">
                                {organization.name}
                            </CardTitle>
                            <CardDescription>
                                {[organization.address, organization.phone]
                                    .filter(Boolean)
                                    .join(' · ')}
                                {organization.tax_number &&
                                    ` · GSTIN ${organization.tax_number}`}
                            </CardDescription>
                            <p className="pt-1 text-sm font-semibold tracking-wide uppercase">
                                {isReceipt
                                    ? 'Receipt voucher'
                                    : 'Payment voucher'}
                                {payment.status === 'cancelled' &&
                                    ' (Cancelled)'}
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <dl className="grid gap-2 text-sm">
                                {rows.map(([label, value]) => (
                                    <div
                                        key={label}
                                        className="flex justify-between gap-4"
                                    >
                                        <dt className="text-muted-foreground">
                                            {label}
                                        </dt>
                                        <dd className="text-right font-medium">
                                            {value}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                            <div className="flex items-center justify-between border-y-2 py-3 text-lg font-semibold">
                                <span>Amount</span>
                                <span className="tabular-nums">
                                    {formatMoney(payment.amount)}
                                </span>
                            </div>
                            {payment.notes && (
                                <p className="text-sm whitespace-pre-line">
                                    <span className="text-muted-foreground">
                                        Notes:{' '}
                                    </span>
                                    {payment.notes}
                                </p>
                            )}
                            <div className="flex justify-between pt-8 text-xs text-muted-foreground">
                                <span>
                                    Prepared by:{' '}
                                    {payment.created_by_name ?? '—'}
                                </span>
                                <span>
                                    {isReceipt ? 'Payer' : 'Receiver'}{' '}
                                    signature: ____________
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-6 print:hidden">
                        <Card>
                            <CardHeader>
                                <CardDescription>
                                    {payment.party.name} — balance now
                                </CardDescription>
                                <CardTitle className="text-2xl">
                                    <BalanceText
                                        value={payment.party.balance}
                                    />
                                </CardTitle>
                            </CardHeader>
                        </Card>
                        {canCancel && <CancelVoucher payment={payment} />}
                    </div>
                </div>
            </div>
        </>
    );
}

function CancelVoucher({ payment }: Pick<Props, 'payment'>) {
    const [open, setOpen] = useState(false);

    if (!open) {
        return (
            <Button
                variant="ghost"
                className="w-full text-destructive"
                onClick={() => setOpen(true)}
            >
                Cancel this voucher
            </Button>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Cancel voucher</CardTitle>
                <CardDescription>
                    A reversal entry is posted to the party ledger.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form
                    {...PaymentController.cancel.form(payment.id)}
                    options={{ preserveScroll: true }}
                    onSuccess={() => setOpen(false)}
                    className="space-y-3"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="reason">Reason</Label>
                                <Input id="reason" name="reason" required />
                                <InputError message={errors.reason} />
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    type="submit"
                                    variant="destructive"
                                    disabled={processing}
                                >
                                    Cancel voucher
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setOpen(false)}
                                >
                                    Keep
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </CardContent>
        </Card>
    );
}

ShowPayment.layout = {
    breadcrumbs: [
        { title: 'Receipts & Payments', href: index() },
        { title: 'Voucher', href: index() },
    ],
};
