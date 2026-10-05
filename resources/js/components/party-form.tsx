import { Form, Link } from '@inertiajs/react';
import type { ComponentProps } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { index } from '@/routes/parties';
import type { Option } from '@/types';

export type PartyFormValues = {
    name: string;
    type: string;
    phone: string | null;
    email: string | null;
    gstin: string | null;
    pan: string | null;
    address: string | null;
    state: string | null;
    is_active: boolean;
    opening_amount: number;
    opening_type: 'receivable' | 'payable';
};

type Props = {
    form: Pick<ComponentProps<typeof Form>, 'action' | 'method'>;
    party?: PartyFormValues;
    types: Option[];
    submitLabel: string;
};

const fieldClass =
    'h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs';

export default function PartyForm({ form, party, types, submitLabel }: Props) {
    return (
        <Form {...form} disableWhileProcessing className="max-w-3xl space-y-6">
            {({ processing, errors }) => (
                <>
                    <div className="grid gap-6 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Party name</Label>
                            <Input
                                id="name"
                                name="name"
                                required
                                autoFocus
                                defaultValue={party?.name}
                                placeholder="e.g. Ravi Metals"
                            />
                            <InputError message={errors.name} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="type">Type</Label>
                            <select
                                id="type"
                                name="type"
                                defaultValue={party?.type ?? 'supplier'}
                                className={fieldClass}
                            >
                                {types.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                            <InputError message={errors.type} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                name="phone"
                                type="tel"
                                defaultValue={party?.phone ?? ''}
                            />
                            <InputError message={errors.phone} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                defaultValue={party?.email ?? ''}
                            />
                            <InputError message={errors.email} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="gstin">GSTIN</Label>
                            <Input
                                id="gstin"
                                name="gstin"
                                maxLength={15}
                                defaultValue={party?.gstin ?? ''}
                                placeholder="33AAAAA0000A1Z5"
                                className="uppercase"
                            />
                            <InputError message={errors.gstin} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="pan">PAN</Label>
                            <Input
                                id="pan"
                                name="pan"
                                maxLength={10}
                                defaultValue={party?.pan ?? ''}
                                placeholder="AAAAA0000A"
                                className="uppercase"
                            />
                            <InputError message={errors.pan} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="state">State</Label>
                            <Input
                                id="state"
                                name="state"
                                defaultValue={party?.state ?? ''}
                                placeholder="e.g. Tamil Nadu"
                            />
                            <InputError message={errors.state} />
                        </div>

                        <div className="grid gap-2 sm:col-span-2">
                            <Label htmlFor="address">Address</Label>
                            <textarea
                                id="address"
                                name="address"
                                rows={2}
                                defaultValue={party?.address ?? ''}
                                className="rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs"
                            />
                            <InputError message={errors.address} />
                        </div>
                    </div>

                    <fieldset className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
                        <legend className="px-1 text-sm font-medium">
                            Opening balance
                        </legend>
                        <div className="grid gap-2">
                            <Label htmlFor="opening_amount">Amount (₹)</Label>
                            <Input
                                id="opening_amount"
                                name="opening_amount"
                                type="number"
                                step="0.01"
                                min="0"
                                defaultValue={party?.opening_amount ?? 0}
                            />
                            <InputError message={errors.opening_amount} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="opening_type">Balance type</Label>
                            <select
                                id="opening_type"
                                name="opening_type"
                                defaultValue={
                                    party?.opening_type ?? 'receivable'
                                }
                                className={fieldClass}
                            >
                                <option value="receivable">
                                    Receivable — they owe us (Dr)
                                </option>
                                <option value="payable">
                                    Payable — we owe them (Cr)
                                </option>
                            </select>
                            <InputError message={errors.opening_type} />
                        </div>
                    </fieldset>

                    <label className="flex items-center gap-2 text-sm">
                        <input type="hidden" name="is_active" value="0" />
                        <input
                            type="checkbox"
                            name="is_active"
                            value="1"
                            defaultChecked={party?.is_active ?? true}
                            className="size-4 accent-primary"
                        />
                        Active (shown on weighbridge tickets and vouchers)
                    </label>

                    <div className="flex items-center gap-3">
                        <Button type="submit">
                            {processing && <Spinner />}
                            {submitLabel}
                        </Button>
                        <Button variant="ghost" asChild>
                            <Link href={index()}>Cancel</Link>
                        </Button>
                    </div>
                </>
            )}
        </Form>
    );
}
