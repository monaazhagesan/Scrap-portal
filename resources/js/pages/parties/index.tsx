import { Form, Head, Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import BalanceText from '@/components/balance-text';
import Heading from '@/components/heading';
import Pagination from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { create, index, show } from '@/routes/parties';
import type { Option, Paginated, Party } from '@/types';

type Props = {
    parties: Paginated<
        Pick<
            Party,
            | 'id'
            | 'name'
            | 'phone'
            | 'gstin'
            | 'is_active'
            | 'type'
            | 'type_label'
            | 'balance'
        >
    >;
    filters: { search: string; type: string; balance: string };
    types: Option[];
};

const selectClass =
    'h-9 rounded-md border border-input bg-transparent px-2 text-sm shadow-xs';

export default function PartiesIndex({ parties, filters, types }: Props) {
    return (
        <>
            <Head title="Parties" />
            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading
                        title="Parties"
                        description="Suppliers and customers with their account balance"
                    />
                    <Button asChild>
                        <Link href={create()}>
                            <Plus /> Add party
                        </Link>
                    </Button>
                </div>

                <Form
                    {...index.form()}
                    options={{ preserveState: true }}
                    className="flex flex-wrap gap-2"
                >
                    <Input
                        name="search"
                        defaultValue={filters.search}
                        placeholder="Name, phone or GSTIN"
                        className="w-56"
                    />
                    <select
                        name="type"
                        defaultValue={filters.type}
                        className={selectClass}
                        aria-label="Type"
                    >
                        <option value="">All types</option>
                        {types.map((type) => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>
                    <select
                        name="balance"
                        defaultValue={filters.balance}
                        className={selectClass}
                        aria-label="Balance"
                    >
                        <option value="">Any balance</option>
                        <option value="receivable">
                            Receivable (they owe us)
                        </option>
                        <option value="payable">Payable (we owe them)</option>
                    </select>
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
                                <th className="px-4 py-3 font-medium">Name</th>
                                <th className="px-4 py-3 font-medium">Type</th>
                                <th className="px-4 py-3 font-medium">Phone</th>
                                <th className="px-4 py-3 font-medium">GSTIN</th>
                                <th className="px-4 py-3 text-right font-medium">
                                    Balance
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {parties.data.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-4 py-8 text-center text-muted-foreground"
                                    >
                                        No parties found.
                                    </td>
                                </tr>
                            )}
                            {parties.data.map((party) => (
                                <tr
                                    key={party.id}
                                    className="border-t hover:bg-muted/30"
                                >
                                    <td className="px-4 py-3">
                                        <Link
                                            href={show(party.id)}
                                            className="font-medium underline-offset-4 hover:underline"
                                        >
                                            {party.name}
                                        </Link>
                                        {!party.is_active && (
                                            <Badge
                                                variant="outline"
                                                className="ml-2"
                                            >
                                                Inactive
                                            </Badge>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        {party.type_label}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {party.phone ?? '—'}
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs">
                                        {party.gstin ?? '—'}
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium">
                                        <BalanceText value={party.balance} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <Pagination page={parties} />
            </div>
        </>
    );
}

PartiesIndex.layout = {
    breadcrumbs: [{ title: 'Parties', href: index() }],
};
