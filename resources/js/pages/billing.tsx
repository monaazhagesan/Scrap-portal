import { Head } from '@inertiajs/react';
import { Check } from 'lucide-react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { show } from '@/routes/billing';
import type { Plan } from '@/types';

type Props = {
    subscription: {
        plan: { id: number; name: string } | null;
        status: string;
        statusLabel: string;
        onTrial: boolean;
        trialEndsAt: string | null;
        subscriptionEndsAt: string | null;
        isActive: boolean;
    };
    plans: Plan[];
};

const formatPrice = (amount: string, currency: string) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
    }).format(Number(amount));

export default function Billing({ subscription, plans }: Props) {
    return (
        <>
            <Head title="Billing" />
            <div className="flex flex-col gap-6 p-4">
                <Heading
                    title="Billing & subscription"
                    description="Your current plan and available upgrades"
                />

                <Card className="max-w-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            {subscription.plan?.name ?? 'No plan'}
                            <Badge
                                variant={
                                    subscription.isActive
                                        ? 'secondary'
                                        : 'destructive'
                                }
                            >
                                {subscription.statusLabel}
                            </Badge>
                        </CardTitle>
                        <CardDescription>
                            {subscription.onTrial &&
                                `Free trial ends on ${subscription.trialEndsAt}.`}
                            {!subscription.onTrial &&
                                subscription.isActive &&
                                (subscription.subscriptionEndsAt
                                    ? `Renews on ${subscription.subscriptionEndsAt}.`
                                    : 'Your subscription is active.')}
                            {!subscription.isActive &&
                                'Your subscription is inactive. Choose a plan below to continue using the portal.'}
                        </CardDescription>
                    </CardHeader>
                </Card>

                <div className="grid gap-4 md:grid-cols-3">
                    {plans.map((plan) => {
                        const isCurrent = plan.id === subscription.plan?.id;

                        return (
                            <Card
                                key={plan.id}
                                className={
                                    isCurrent ? 'border-primary' : undefined
                                }
                            >
                                <CardHeader>
                                    <CardTitle>{plan.name}</CardTitle>
                                    <CardDescription>
                                        {plan.description}
                                    </CardDescription>
                                    <p className="pt-2 text-3xl font-semibold">
                                        {formatPrice(
                                            plan.monthly_price,
                                            plan.currency,
                                        )}
                                        <span className="text-sm font-normal text-muted-foreground">
                                            {' '}
                                            / month
                                        </span>
                                    </p>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2 text-sm">
                                        <li className="flex gap-2">
                                            <Check className="size-4 text-primary" />
                                            {plan.max_users ?? 'Unlimited'}{' '}
                                            users ·{' '}
                                            {plan.max_yards ?? 'Unlimited'}{' '}
                                            yards
                                        </li>
                                        {plan.features?.map((feature) => (
                                            <li
                                                key={feature}
                                                className="flex gap-2"
                                            >
                                                <Check className="size-4 text-primary" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                                <CardFooter className="mt-auto">
                                    {/* TODO: hook up payment gateway checkout */}
                                    <Button
                                        className="w-full"
                                        variant={
                                            isCurrent ? 'outline' : 'default'
                                        }
                                        disabled
                                    >
                                        {isCurrent
                                            ? 'Current plan'
                                            : 'Online payment coming soon'}
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </>
    );
}

Billing.layout = {
    breadcrumbs: [{ title: 'Billing', href: show() }],
};
