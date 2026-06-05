import { index as organizationIndex } from '@/actions/App/Http/Controllers/Settings/OrganizationController';
import AppLayout from '@/layouts/app-layout';
import OrganizationForm from './organization-form';

interface Organization {
    id: number;
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    city: string | null;
    country: string | null;
    tax_number: string | null;
    registration_number: string | null;
    bank_details: string | null;
    logo?: string | null;
    logo_url?: string | null;
}

interface Props {
    organization: Organization;
}

export default function Edit({ organization }: Props) {
    return <OrganizationForm organization={organization} isEdit={true} />;
}

Edit.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            {
                title: 'Organisations',
                href: organizationIndex(),
            },
            {
                title: 'Modifier',
                href: '#',
            },
        ]}
    >
        {page}
    </AppLayout>
);
