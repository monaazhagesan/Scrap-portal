import { Head } from '@inertiajs/react';
import PartyController from '@/actions/App/Http/Controllers/PartyController';
import Heading from '@/components/heading';
import PartyForm from '@/components/party-form';
import type { PartyFormValues } from '@/components/party-form';
import { index } from '@/routes/parties';
import type { Option } from '@/types';

type Props = {
    party: PartyFormValues & { id: number };
    types: Option[];
};

export default function EditParty({ party, types }: Props) {
    return (
        <>
            <Head title={`Edit ${party.name}`} />
            <div className="p-4">
                <Heading
                    title={`Edit ${party.name}`}
                    description="Update contact, GST and opening balance details"
                />
                <PartyForm
                    form={PartyController.update.form(party.id)}
                    party={party}
                    types={types}
                    submitLabel="Save changes"
                />
            </div>
        </>
    );
}

EditParty.layout = {
    breadcrumbs: [
        { title: 'Parties', href: index() },
        { title: 'Edit', href: index() },
    ],
};
