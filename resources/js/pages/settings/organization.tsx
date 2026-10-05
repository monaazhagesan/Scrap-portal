import { Form, Head } from '@inertiajs/react';
import OrganizationController from '@/actions/App/Http/Controllers/Settings/OrganizationController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { edit } from '@/routes/organization';

type Props = {
    organization: {
        id: number;
        name: string;
        slug: string;
        email: string | null;
        phone: string | null;
        tax_number: string | null;
        address: string | null;
    };
};

export default function OrganizationSettings({ organization }: Props) {
    return (
        <>
            <Head title="Organization settings" />

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Organization"
                    description="Your company details, used on invoices and receipts"
                />

                <Form
                    {...OrganizationController.update.form()}
                    options={{ preserveScroll: true }}
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="name">Company name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    required
                                    defaultValue={organization.name}
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Business email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    defaultValue={organization.email ?? ''}
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    defaultValue={organization.phone ?? ''}
                                />
                                <InputError message={errors.phone} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="tax_number">GSTIN</Label>
                                <Input
                                    id="tax_number"
                                    name="tax_number"
                                    defaultValue={organization.tax_number ?? ''}
                                />
                                <InputError message={errors.tax_number} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="address">Address</Label>
                                <textarea
                                    id="address"
                                    name="address"
                                    rows={3}
                                    defaultValue={organization.address ?? ''}
                                    className="rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                />
                                <InputError message={errors.address} />
                            </div>

                            <Button disabled={processing}>Save</Button>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

OrganizationSettings.layout = {
    breadcrumbs: [{ title: 'Organization settings', href: edit() }],
};
