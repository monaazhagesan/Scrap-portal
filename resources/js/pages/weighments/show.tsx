import { Form, Head, Link } from '@inertiajs/react';
import { Plus, Printer } from 'lucide-react';
import { useState } from 'react';
import WeighmentController from '@/actions/App/Http/Controllers/WeighmentController';
import InputError from '@/components/input-error';
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
import WeighmentStatusBadge from '@/components/weighment-status-badge';
import { formatDateTime, formatKg, formatMoney } from '@/lib/format';
import { create, index } from '@/routes/weighments';
import type { Weighment } from '@/types';

type Props = {
    weighment: Weighment & {
        direction_label: string;
        status_label: string;
        default_rate: string | null;
        creator: { id: number; name: string } | null;
        completer: { id: number; name: string } | null;
    };
    organization: {
        name: string;
        address: string | null;
        phone: string | null;
        tax_number: string | null;
    };
    canCancel: boolean;
};

export default function ShowWeighment({
    weighment,
    organization,
    canCancel,
}: Props) {
    const isOpen = weighment.status === 'open';

    return (
        <>
            <Head title={`Ticket ${weighment.ticket_no}`} />
            <div className="flex flex-col gap-6 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-semibold tracking-tight">
                            Ticket {weighment.ticket_no}
                        </h1>
                        <WeighmentStatusBadge status={weighment.status} />
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => window.print()}
                        >
                            <Printer /> Print slip
                        </Button>
                        <Button asChild>
                            <Link href={create()}>
                                <Plus /> New weighment
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
                    <WeighmentSlip
                        weighment={weighment}
                        organization={organization}
                    />

                    <div className="space-y-6 print:hidden">
                        {isOpen && (
                            <SecondWeighmentForm weighment={weighment} />
                        )}
                        {canCancel && <CancelForm weighment={weighment} />}
                    </div>
                </div>
            </div>
        </>
    );
}

function WeighmentSlip({
    weighment,
    organization,
}: Pick<Props, 'weighment' | 'organization'>) {
    const rows: [string, string][] = [
        ['Ticket no', weighment.ticket_no],
        ['Type', weighment.direction_label],
        ['Vehicle no', weighment.vehicle_number],
        ['Vehicle type', weighment.vehicle_type ?? '—'],
        ['Driver', weighment.driver_name ?? '—'],
        ['Driver phone', weighment.driver_phone ?? '—'],
        [
            weighment.direction === 'inward' ? 'Supplier' : 'Customer',
            weighment.party_name ?? '—',
        ],
        ['Material', weighment.material?.name ?? '—'],
    ];

    return (
        <Card className="print-area">
            <CardHeader className="border-b text-center">
                <CardTitle className="text-lg">{organization.name}</CardTitle>
                <CardDescription>
                    {[organization.address, organization.phone]
                        .filter(Boolean)
                        .join(' · ')}
                    {organization.tax_number &&
                        ` · GSTIN ${organization.tax_number}`}
                </CardDescription>
                <p className="pt-1 text-sm font-semibold tracking-wide uppercase">
                    Weighment slip
                </p>
            </CardHeader>
            <CardContent className="space-y-6">
                <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    {rows.map(([label, value]) => (
                        <div key={label} className="flex justify-between gap-2">
                            <dt className="text-muted-foreground">{label}</dt>
                            <dd className="text-right font-medium">{value}</dd>
                        </div>
                    ))}
                </dl>

                <table className="w-full text-sm">
                    <tbody className="[&_td]:py-2">
                        <tr className="border-t">
                            <td className="text-muted-foreground">
                                1st weight
                                <div className="text-xs">
                                    {formatDateTime(weighment.first_weighed_at)}
                                </div>
                            </td>
                            <td className="text-right tabular-nums">
                                {formatKg(weighment.first_weight)}
                            </td>
                        </tr>
                        <tr className="border-t">
                            <td className="text-muted-foreground">
                                2nd weight
                                <div className="text-xs">
                                    {formatDateTime(
                                        weighment.second_weighed_at,
                                    )}
                                </div>
                            </td>
                            <td className="text-right tabular-nums">
                                {formatKg(weighment.second_weight)}
                            </td>
                        </tr>
                        <tr className="border-t">
                            <td className="text-muted-foreground">
                                Gross weight
                            </td>
                            <td className="text-right tabular-nums">
                                {formatKg(weighment.gross_weight)}
                            </td>
                        </tr>
                        <tr className="border-t">
                            <td className="text-muted-foreground">
                                Tare weight
                            </td>
                            <td className="text-right tabular-nums">
                                {formatKg(weighment.tare_weight)}
                            </td>
                        </tr>
                        <tr className="border-t">
                            <td className="text-muted-foreground">
                                Deduction (dust / moisture)
                            </td>
                            <td className="text-right tabular-nums">
                                {formatKg(weighment.deduction)}
                            </td>
                        </tr>
                        <tr className="border-t-2 border-foreground/40 text-base font-semibold">
                            <td>Net weight</td>
                            <td className="text-right tabular-nums">
                                {formatKg(weighment.net_weight)}
                            </td>
                        </tr>
                        {weighment.amount !== null && (
                            <tr className="border-t text-base font-semibold">
                                <td>
                                    Amount
                                    <div className="text-xs font-normal text-muted-foreground">
                                        @ {formatMoney(weighment.rate)} per{' '}
                                        {weighment.material?.unit ?? 'kg'}
                                    </div>
                                </td>
                                <td className="text-right tabular-nums">
                                    {formatMoney(weighment.amount)}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {weighment.remarks && (
                    <p className="text-sm whitespace-pre-line">
                        <span className="text-muted-foreground">Remarks: </span>
                        {weighment.remarks}
                    </p>
                )}

                <div className="flex justify-between pt-8 text-xs text-muted-foreground">
                    <span>
                        Operator:{' '}
                        {weighment.completer?.name ??
                            weighment.creator?.name ??
                            '—'}
                    </span>
                    <span>Driver signature: ____________</span>
                </div>
            </CardContent>
        </Card>
    );
}

function SecondWeighmentForm({ weighment }: Pick<Props, 'weighment'>) {
    const [secondWeight, setSecondWeight] = useState('');
    const [deduction, setDeduction] = useState('0');
    const [rate, setRate] = useState(weighment.default_rate ?? '');

    const first = Number(weighment.first_weight);
    const second = Number(secondWeight);
    const net =
        secondWeight === ''
            ? null
            : Math.abs(first - second) - Number(deduction || 0);
    const quantity =
        net !== null && weighment.material?.unit === 'ton' ? net / 1000 : net;
    const amount =
        quantity !== null && rate !== '' ? quantity * Number(rate) : null;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Second weighment</CardTitle>
                <CardDescription>
                    {weighment.direction === 'inward'
                        ? 'Weigh the empty vehicle after unloading.'
                        : 'Weigh the loaded vehicle before it leaves.'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form
                    {...WeighmentController.complete.form(weighment.id)}
                    disableWhileProcessing
                    options={{ preserveScroll: true }}
                    className="space-y-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="second_weight">
                                    Second weight (kg)
                                </Label>
                                <Input
                                    id="second_weight"
                                    name="second_weight"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    required
                                    autoFocus
                                    inputMode="decimal"
                                    value={secondWeight}
                                    onChange={(e) =>
                                        setSecondWeight(e.target.value)
                                    }
                                    className="h-12 text-2xl font-semibold tabular-nums"
                                />
                                <InputError message={errors.second_weight} />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-2">
                                    <Label htmlFor="deduction">
                                        Deduction (kg)
                                    </Label>
                                    <Input
                                        id="deduction"
                                        name="deduction"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={deduction}
                                        onChange={(e) =>
                                            setDeduction(e.target.value)
                                        }
                                    />
                                    <InputError message={errors.deduction} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="rate">
                                        Rate (₹ /{' '}
                                        {weighment.material?.unit ?? 'kg'})
                                    </Label>
                                    <Input
                                        id="rate"
                                        name="rate"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={rate}
                                        onChange={(e) =>
                                            setRate(e.target.value)
                                        }
                                    />
                                    <InputError message={errors.rate} />
                                </div>
                            </div>

                            <dl className="space-y-1 rounded-lg bg-muted/50 p-3 text-sm">
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">
                                        Net weight
                                    </dt>
                                    <dd className="font-semibold tabular-nums">
                                        {net === null ? '—' : formatKg(net)}
                                    </dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">
                                        Amount
                                    </dt>
                                    <dd className="font-semibold tabular-nums">
                                        {formatMoney(amount)}
                                    </dd>
                                </div>
                            </dl>

                            <Button type="submit" className="w-full">
                                {processing && <Spinner />}
                                Complete ticket
                            </Button>
                        </>
                    )}
                </Form>
            </CardContent>
        </Card>
    );
}

function CancelForm({ weighment }: Pick<Props, 'weighment'>) {
    const [open, setOpen] = useState(false);

    if (!open) {
        return (
            <Button
                variant="ghost"
                className="w-full text-destructive"
                onClick={() => setOpen(true)}
            >
                Cancel this ticket
            </Button>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Cancel ticket</CardTitle>
                <CardDescription>
                    The ticket stays in the register, marked as cancelled.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form
                    {...WeighmentController.cancel.form(weighment.id)}
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
                                    Cancel ticket
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

ShowWeighment.layout = {
    breadcrumbs: [
        { title: 'Weighbridge', href: index() },
        { title: 'Ticket', href: index() },
    ],
};
