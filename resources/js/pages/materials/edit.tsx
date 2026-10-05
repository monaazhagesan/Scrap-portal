import { Head } from '@inertiajs/react';
import MaterialController from '@/actions/App/Http/Controllers/MaterialController';
import Heading from '@/components/heading';
import MaterialForm from '@/components/material-form';
import { index } from '@/routes/materials';
import type { Material, Option } from '@/types';

type Props = {
    material: Material;
    categories: Option[];
    units: string[];
};

export default function EditMaterial({ material, categories, units }: Props) {
    return (
        <>
            <Head title={`Edit ${material.name}`} />
            <div className="p-4">
                <Heading
                    title={`Edit ${material.name}`}
                    description="Update the material details and rates"
                />
                <MaterialForm
                    form={MaterialController.update.form(material.id)}
                    material={material}
                    categories={categories}
                    units={units}
                    submitLabel="Save changes"
                />
            </div>
        </>
    );
}

EditMaterial.layout = {
    breadcrumbs: [
        { title: 'Materials & Rates', href: index() },
        { title: 'Edit', href: index() },
    ],
};
