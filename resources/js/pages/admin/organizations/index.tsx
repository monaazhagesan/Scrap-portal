import { Form, Head } from '@inertiajs/react';
import OrganizationController from '@/actions/App/Http/Controllers/Admin/OrganizationController';
import Heading from '@/components/heading';
import Pagination from '@/components/pagination';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { index } from '@/routes/admin/organizations';
import type { Option, Paginated } from '@/types';

type OrganizationRow = {
    id: number;
    name: string;
    email: string | null;
    status: string;
    plan_id: number | null;
    plan: { id: number; name: string } | null;
    users_count: number;
    trial_ends_at: string | null;
    subscription_ends_at: string | null;
    created_at: string;
};

type Props = {
    organizations: Paginated<OrganizationRow>;
    filters: { search: string };
    plans: { id: number; name: string }[];
    statuses: Option[];
    stats: { total: number; trial: number; active: number };
};

const selectClass =
    'h-9 rounded-md border border-input bg-transparent px-2 text-sm shadow-xs';

const dateOnly = (value: string | null) => value?.slice(0, 10) ?? '';

export default function AdminOrganizations({
    organizations,
    filters,
    plans,
    statuses,
    stats,
}: Props) {
    return (
        <>
            <Head title="Organizations" />
            <div className="flex flex-col gap-4 p-4">
                <Heading
                    title="Organizations"
                    description="All tenants on the platform. Assign plans and manage subscription status."
                />

                <div className="grid gap-4 sm:grid-cols-3">
                    {[
                        { label: 'Total tenants', value: stats.total },
                        { label: 'On trial', value: stats.trial },
                        { label: 'Paying (active)', value: stats.active },
                    ].map((stat) => (
                        <Card key={stat.label}>
                            <CardHeader>
                                <CardDescription>{stat.label}</CardDescription>
                                <CardTitle className="text-3xl tabular-nums">
                                    {stat.value}
                                </CardTitle>
                            </CardHeader>
                        </Card>
                    ))}
                </div>

                <Form
                    {...index.form()}
                    options={{ preserveState: true }}
                    className="flex max-w-md gap-2"
                >
                    <Input
                        name="search"
                        defaultValue={filters.search}
                        placeholder="Search by name or email"
                    />
                    <Button type="submit" variant="outline">
                        Search
                    </Button>
                </Form>

                <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3 font-medium">
                                    Organization
                                </th>
                                <th className="px-4 py-3 font-medium">Users</th>
                                <th className="px-4 py-3 font-medium">Plan</th>
                                <th className="px-4 py-3 font-medium">
                                    Status
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    Trial ends
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    Paid until
                                </th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody>
                            {organizations.data.map((organization) => {
                                const formId = `org-${organization.id}`;

                                return (
                                    <tr
                                        key={organization.id}
                                        className="border-t"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="font-medium">
                                                {organization.name}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {organization.email}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 tabular-nums">
                                            {organization.users_count}
                                        </td>
                                        <td className="px-4 py-3">
                                            <select
                                                form={formId}
                                                name="plan_id"
                                                defaultValue={
                                                    organization.plan_id ?? ''
                                                }
                                                className={selectClass}
                                            >
                                                <option value="">—</option>
                                                {plans.map((plan) => (
                                                    <option
                                                        key={plan.id}
                                                        value={plan.id}
                                                    >
                                                        {plan.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-4 py-3">
                                            <select
                                                form={formId}
                                                name="status"
                                                defaultValue={
                                                    organization.status
                                                }
                                                className={selectClass}
                                            >
                                                {statuses.map((status) => (
                                                    <option
                                                        key={status.value}
                                                        value={status.value}
                                                    >
                                                        {status.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Input
                                                form={formId}
                                                type="date"
                                                name="trial_ends_at"
                                                defaultValue={dateOnly(
                                                    organization.trial_ends_at,
                                                )}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <Input
                                                form={formId}
                                                type="date"
                                                name="subscription_ends_at"
                                                defaultValue={dateOnly(
                                                    organization.subscription_ends_at,
                                                )}
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Form
                                                id={formId}
                                                {...OrganizationController.update.form(
                                                    organization.id,
                                                )}
                                                options={{
                                                    preserveScroll: true,
                                                }}
                                            >
                                                {({ processing }) => (
                                                    <Button
                                                        size="sm"
                                                        disabled={processing}
                                                    >
                                                        Save
                                                    </Button>
                                                )}
                                            </Form>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <Pagination page={organizations} />
            </div>
        </>
    );
}

AdminOrganizations.layout = {
    breadcrumbs: [{ title: 'Organizations', href: index() }],
};
