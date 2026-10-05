import { Head } from '@inertiajs/react';
import PartyController from '@/actions/App/Http/Controllers/PartyController';
import Heading from '@/components/heading';
import PartyForm from '@/components/party-form';
import { create, index } from '@/routes/parties';
import type { Option } from '@/types';

export default function CreateParty({ types }: { types: Option[] }) {
    return (
        <>
            <Head title="Add party" />
            <div className="p-4">
                <Heading
                    title="Add party"
                    description="A supplier you buy scrap from or a customer you sell to"
                />
                <PartyForm
                    form={PartyController.store.form()}
                    types={types}
                    submitLabel="Create party"
                />
            </div>
        </>
    );
}

CreateParty.layout = {
    breadcrumbs: [
        { title: 'Parties', href: index() },
        { title: 'Add', href: create() },
    ],
};
