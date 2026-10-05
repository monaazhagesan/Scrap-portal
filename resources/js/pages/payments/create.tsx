import { Form, Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import PaymentController from '@/actions/App/Http/Controllers/PaymentController';
import BalanceText from '@/components/balance-text';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { create as createParty } from '@/routes/parties';
import { create, index } from '@/routes/payments';
import type { Option } from '@/types';

type Props = {
    parties: { id: number; name: string; balance: number }[];
    types: Option[];
    modes: Option[];
    defaults: {
        party_id: number | null;
        type: 'receipt' | 'payment' | null;
        date: string;
    };
};

const fieldClass =
    'h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs';

export default function CreatePayment({
    parties,
    types,
    modes,
    defaults,
}: Props) {
    const [partyId, setPartyId] = useState(
        defaults.party_id ? String(defaults.party_id) : '',
    );
    const party = parties.find((p) => String(p.id) === partyId);

    // Suggest: customers who owe us → receipt; suppliers we owe → payment.
    const [type, setType] = useState<string>(
        defaults.type ?? (party && party.balance < 0 ? 'payment' : 'receipt'),
    );

    const selectParty = (id: string) => {
        setPartyId(id);
        const selected = parties.find((p) => String(p.id) === id);

        if (!defaults.type && selected) {
            setType(selected.balance < 0 ? 'payment' : 'receipt');
        }
    };

    return (
        <>
            <Head title={type === 'receipt' ? 'New receipt' : 'New payment'} />
            <div className="p-4">
                <Heading
                    title={type === 'receipt' ? 'New receipt' : 'New payment'}
                    description={
                        type === 'receipt'
                            ? 'Money received from a party'
                            : 'Money paid to a party'
                    }
                />

                <Form
                    {...PaymentController.store.form()}
                    disableWhileProcessing
                    className="max-w-2xl space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid grid-cols-2 gap-3">
                                {types.map((option) => (
                                    <label
                                        key={option.value}
                                        className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 has-checked:border-primary has-checked:bg-muted/50"
                                    >
                                        <input
                                            type="radio"
                                            name="type"
                                            value={option.value}
                                            checked={type === option.value}
                                            onChange={() =>
                                                setType(option.value)
                                            }
                                            className="accent-primary"
                                        />
                                        <span className="text-sm font-medium">
                                            {option.value === 'receipt'
                                                ? 'Receipt (money in)'
                                                : 'Payment (money out)'}
                                        </span>
                                    </label>
                                ))}
                            </div>
                            <InputError message={errors.type} />

                            <div className="grid gap-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="party_id">Party</Label>
                                    <Link
                                        href={createParty()}
                                        className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                                    >
                                        + New party
                                    </Link>
                                </div>
                                <select
                                    id="party_id"
                                    name="party_id"
                                    required
                                    value={partyId}
                                    onChange={(e) =>
                                        selectParty(e.target.value)
                                    }
                                    className={fieldClass}
                                >
                                    <option value="">Select party</option>
                                    {parties.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name}
                                        </option>
                                    ))}
                                </select>
                                {party && (
                                    <p className="text-sm">
                                        Current balance:{' '}
                                        <BalanceText
                                            value={party.balance}
                                            className="font-medium"
                                        />{' '}
                                        <span className="text-muted-foreground">
                                            (
                                            {party.balance > 0
                                                ? 'they owe you'
                                                : party.balance < 0
                                                  ? 'you owe them'
                                                  : 'settled'}
                                            )
                                        </span>
                                    </p>
                                )}
                                <InputError message={errors.party_id} />
                            </div>

                            <div className="grid gap-6 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="amount">Amount (₹)</Label>
                                    <Input
                                        id="amount"
                                        name="amount"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        required
                                        inputMode="decimal"
                                        className="h-12 text-xl font-semibold tabular-nums"
                                    />
                                    <InputError message={errors.amount} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="date">Date</Label>
                                    <Input
                                        id="date"
                                        name="date"
                                        type="date"
                                        required
                                        max={defaults.date}
                                        defaultValue={defaults.date}
                                        className="h-12"
                                    />
                                    <InputError message={errors.date} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="mode">Mode</Label>
                                    <select
                                        id="mode"
                                        name="mode"
                                        defaultValue="cash"
                                        className={fieldClass}
                                    >
                                        {modes.map((mode) => (
                                            <option
                                                key={mode.value}
                                                value={mode.value}
                                            >
                                                {mode.label}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.mode} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="reference_no">
                                        Reference no.
                                    </Label>
                                    <Input
                                        id="reference_no"
                                        name="reference_no"
                                        placeholder="UTR / cheque no."
                                    />
                                    <InputError message={errors.reference_no} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="notes">Notes</Label>
                                <textarea
                                    id="notes"
                                    name="notes"
                                    rows={2}
                                    className="rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs"
                                />
                                <InputError message={errors.notes} />
                            </div>

                            <div className="flex items-center gap-3">
                                <Button type="submit">
                                    {processing && <Spinner />}
                                    Save{' '}
                                    {type === 'receipt' ? 'receipt' : 'payment'}
                                </Button>
                                <Button variant="ghost" asChild>
                                    <Link href={index()}>Cancel</Link>
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

CreatePayment.layout = {
    breadcrumbs: [
        { title: 'Receipts & Payments', href: index() },
        { title: 'New', href: create() },
    ],
};
