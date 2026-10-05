import { Link, usePage } from '@inertiajs/react';
import {
    ArrowLeftRight,
    BookOpen,
    Building2,
    CreditCard,
    LayoutGrid,
    Package,
    Scale,
    Scale3d,
    Users,
    Warehouse,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Badge } from '@/components/ui/badge';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { cashbook, outstanding } from '@/routes/accounts';
import { index as adminOrganizations } from '@/routes/admin/organizations';
import { show as billing } from '@/routes/billing';
import { index as inventory } from '@/routes/inventory';
import { index as materials } from '@/routes/materials';
import { index as parties } from '@/routes/parties';
import { index as payments } from '@/routes/payments';
import { index as weighments } from '@/routes/weighments';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Weighbridge',
        href: weighments(),
        icon: Scale,
    },
    {
        title: 'Inventory',
        href: inventory(),
        icon: Warehouse,
    },
    {
        title: 'Materials & Rates',
        href: materials(),
        icon: Package,
    },
    {
        title: 'Billing',
        href: billing(),
        icon: CreditCard,
    },
];

const accountsNavItems: NavItem[] = [
    {
        title: 'Parties',
        href: parties(),
        icon: Users,
    },
    {
        title: 'Receipts & Payments',
        href: payments(),
        icon: ArrowLeftRight,
    },
    {
        title: 'Outstanding',
        href: outstanding(),
        icon: Scale3d,
    },
    {
        title: 'Cash & Bank book',
        href: cashbook(),
        icon: BookOpen,
    },
];

const adminNavItems: NavItem[] = [
    {
        title: 'Organizations',
        href: adminOrganizations(),
        icon: Building2,
    },
];

export function AppSidebar() {
    const { auth, tenant } = usePage().props;

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                {tenant && (
                    <div className="flex items-center justify-between gap-2 px-2 text-xs group-data-[collapsible=icon]:hidden">
                        <span className="truncate font-medium">
                            {tenant.name}
                        </span>
                        {tenant.onTrial ? (
                            <Badge variant="secondary">
                                Trial · {tenant.trialDaysLeft}d left
                            </Badge>
                        ) : (
                            tenant.plan && (
                                <Badge variant="outline">{tenant.plan}</Badge>
                            )
                        )}
                    </div>
                )}
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
                {(tenant?.role === 'owner' ||
                    tenant?.role === 'admin' ||
                    tenant?.role === 'manager') && (
                    <NavMain items={accountsNavItems} label="Accounts" />
                )}
                {auth.user.is_super_admin && (
                    <NavMain items={adminNavItems} label="Platform admin" />
                )}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
