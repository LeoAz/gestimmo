import { create as organizationCreate, index as organizationIndex } from '@/actions/App/Http/Controllers/Settings/OrganizationController';
import AppLayout from '@/layouts/app-layout';
import OrganizationForm from './organization-form';

export default function Create() {
    return <OrganizationForm organization={{} as any} isEdit={false} />;
}

Create.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            {
                title: 'Organisations',
                href: organizationIndex(),
            },
            {
                title: 'Nouvelle',
                href: organizationCreate(),
            },
        ]}
    >
        {page}
    </AppLayout>
);
