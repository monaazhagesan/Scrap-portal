import { Head } from '@inertiajs/react';
import MaterialController from '@/actions/App/Http/Controllers/MaterialController';
import Heading from '@/components/heading';
import MaterialForm from '@/components/material-form';
import { create, index } from '@/routes/materials';
import type { Option } from '@/types';

type Props = {
    categories: Option[];
    units: string[];
};

export default function CreateMaterial({ categories, units }: Props) {
    return (
        <>
            <Head title="Add material" />
            <div className="p-4">
                <Heading
                    title="Add material"
                    description="Define a scrap material and its current rates"
                />
                <MaterialForm
                    form={MaterialController.store.form()}
                    categories={categories}
                    units={units}
                    submitLabel="Create material"
                />
            </div>
        </>
    );
}

CreateMaterial.layout = {
    breadcrumbs: [
        { title: 'Materials & Rates', href: index() },
        { title: 'Add', href: create() },
    ],
};
