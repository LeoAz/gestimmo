import { Link } from '@inertiajs/react';
import { BarChart3, Bell, Building2, FileText, Key, LayoutGrid, Settings, Tags, Users } from 'lucide-react';

import { index as propertyCategoriesIndex } from '@/actions/App/Http/Controllers/PropertyCategoryController';
import { index as propertiesIndex } from '@/actions/App/Http/Controllers/PropertyController';
import { index as rentalsIndex } from '@/actions/App/Http/Controllers/RentalController';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
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
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Notifications',
        href: '/notifications',
        icon: Bell,
    },
    {
        title: 'Tableau de bord',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Configuration',
        icon: Settings,
        items: [
            {
                title: 'Catégories',
                href: propertyCategoriesIndex(),
            },
            {
                title: 'Biens immobiliers',
                href: propertiesIndex(),
            },
        ],
    },
    {
        title: 'Exploitation',
        icon: Building2,
        items: [
            {
                title: 'Locations de bien',
                href: rentalsIndex(),
            },
            {
                title: 'Locataires',
                href: '/tenants',
            },
            {
                title: 'Factures & Paiement',
                href: '/payments',
            },
        ],
    },
    {
        title: 'Rapports',
        href: '/reports',
        icon: BarChart3,
    },
];

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
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
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                {footerNavItems.length > 0 && <NavFooter items={footerNavItems} className="mt-auto" />}
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
