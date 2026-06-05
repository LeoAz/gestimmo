import { Head, Link, router } from '@inertiajs/react';
import { Edit, Globe, Mail, Phone, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import {
    create as organizationCreate,
    destroy as organizationDestroy,
    edit as organizationEdit,
    index as organizationIndex,
} from '@/actions/App/Http/Controllers/Settings/OrganizationController';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';

interface Organization {
    id: number;
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    logo_url?: string | null;
}

interface Props {
    organizations: Organization[];
}

export default function Index({ organizations }: Props) {
    const handleDelete = (id: number) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette organisation ?')) {
            router.delete(organizationDestroy({ organization: id }), {
                onSuccess: () => toast.success('Organisation supprimée'),
            });
        }
    };

    return (
        <div className="space-y-6 p-4">
            <Head title="Organisations" />

            <div className="flex items-center justify-between">
                <Heading
                    title="Organisations"
                    description="Gérez les différentes organisations de votre système."
                />
                <Button asChild>
                    <Link href={organizationCreate()}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nouvelle organisation
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Liste des organisations</CardTitle>
                    <CardDescription>
                        {organizations.length} organisation(s) enregistrée(s).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">Logo</TableHead>
                                <TableHead>Nom</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {organizations.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                                        Aucune organisation trouvée.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                organizations.map((org) => (
                                    <TableRow key={org.id}>
                                        <TableCell>
                                            <div className="h-10 w-10 rounded border bg-muted flex items-center justify-center overflow-hidden">
                                                {org.logo_url ? (
                                                    <img src={org.logo_url} alt={org.name} className="h-full w-full object-contain" />
                                                ) : (
                                                    <span className="text-[10px] text-muted-foreground font-bold">ORG</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">{org.name}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                                                {org.email && (
                                                    <div className="flex items-center gap-1">
                                                        <Mail className="h-3 w-3" />
                                                        {org.email}
                                                    </div>
                                                )}
                                                {org.phone && (
                                                    <div className="flex items-center gap-1">
                                                        <Phone className="h-3 w-3" />
                                                        {org.phone}
                                                    </div>
                                                )}
                                                {org.website && (
                                                    <div className="flex items-center gap-1">
                                                        <Globe className="h-3 w-3" />
                                                        {org.website}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" asChild title="Modifier">
                                                    <Link href={organizationEdit({ organization: org.id })}>
                                                        <Edit className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => handleDelete(org.id)}
                                                    title="Supprimer"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

Index.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            {
                title: 'Organisations',
                href: organizationIndex(),
            },
        ]}
    >
        {page}
    </AppLayout>
);
