import { Form, Head } from '@inertiajs/react';
import OnboardingController from '@/actions/App/Http/Controllers/OnboardingController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

export default function Onboarding() {
    return (
        <>
            <Head title="Create your company" />
            <Form
                {...OnboardingController.store.form()}
                disableWhileProcessing
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <div className="grid gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="organization_name">
                                Company name
                            </Label>
                            <Input
                                id="organization_name"
                                name="organization_name"
                                required
                                autoFocus
                                autoComplete="organization"
                                placeholder="e.g. Sri Lakshmi Scrap Traders"
                            />
                            <InputError message={errors.organization_name} />
                        </div>

                        <Button type="submit" className="w-full">
                            {processing && <Spinner />}
                            Continue
                        </Button>
                    </div>
                )}
            </Form>
        </>
    );
}

Onboarding.layout = {
    title: 'Set up your company',
    description: 'Your account is not part of any company yet',
};
