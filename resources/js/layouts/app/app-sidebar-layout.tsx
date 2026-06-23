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
        <AppShell variant="sidebar" className="print:block print:min-h-0 print:w-full">
            <div className="print:hidden">
                <AppSidebar />
            </div>
            <AppContent variant="sidebar" className="overflow-x-hidden print:p-0 print:m-0 print:block print:w-full print:static">
                <div className="print:hidden">
                    <AppSidebarHeader breadcrumbs={breadcrumbs} />
                </div>
                {children}
            </AppContent>
        </AppShell>
    );
}
