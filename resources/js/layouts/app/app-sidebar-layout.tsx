import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar className="print:hidden" />
            <AppContent variant="sidebar" className="overflow-x-hidden print:p-0 print:m-0">
                <AppSidebarHeader breadcrumbs={breadcrumbs} className="print:hidden" />
                {children}
            </AppContent>
        </AppShell>
    );
}
