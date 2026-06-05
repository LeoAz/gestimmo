import { Head } from '@inertiajs/react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AlertCircle } from 'lucide-react';

import { DataTable } from '@/components/data-table';
import Heading from '@/components/heading';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';

interface Property {
    id: number;
    title: string;
    price: number;
    category: {
        name: string;
    };
    status: string;
}

interface Rental {
    id: number;
    property: Property;
    tenant: {
        first_name: string;
        last_name: string;
    };
    next_payment_date: string;
    rent_amount: number;
}

interface DashboardProps {
    availableProperties: Property[];
    upcomingPayments: Rental[];
    recoveryStats: { estimated: number; actual: number };
    latePayments: Rental[];
}

export default function Dashboard({
    availableProperties,
    upcomingPayments,
    recoveryStats,
    latePayments,
}: DashboardProps) {
    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {latePayments.length > 0 && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Attention : Retards de paiement</AlertTitle>
                        <AlertDescription>
                            Il y a {latePayments.length} retard(s) de paiement de recouvrement. Veuillez consulter les notifications ou le rapport des retards.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Statistiques rapides */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Récupération Estimée (Mois)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{recoveryStats.estimated.toLocaleString('fr-FR')} FCFA</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Récupération Réelle</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{recoveryStats.actual.toLocaleString('fr-FR')} FCFA</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Retards de Paiement</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-destructive">{latePayments.length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Biens Disponibles</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{availableProperties.length}</div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {/* Listing Biens Disponibles */}
                    <div className="space-y-4">
                        <Heading title="Villas & Appartements Disponibles" />
                        <DataTable
                            data={availableProperties}
                            columns={[
                                { header: "Titre", accessor: "title" },
                                {
                                    header: "Catégorie",
                                    accessor: (row: Property) => <Badge variant="outline">{row.category.name}</Badge>
                                },
                                {
                                    header: "Prix",
                                    className: "text-right",
                                    accessor: (row: Property) => `${row.price.toLocaleString('fr-FR')} FCFA`
                                }
                            ]}
                        />
                    </div>

                    {/* Paiements à venir */}
                    <div className="space-y-4">
                        <Heading title="Paiements à Venir (30 jours)" />
                        <DataTable
                            data={upcomingPayments}
                            columns={[
                                {
                                    header: "Locataire",
                                    accessor: (row: Rental) => `${row.tenant.first_name} ${row.tenant.last_name}`
                                },
                                {
                                    header: "Date Prévue",
                                    accessor: (row: Rental) => format(new Date(row.next_payment_date), 'dd MMMM yyyy', { locale: fr })
                                },
                                {
                                    header: "Montant",
                                    className: "text-right",
                                    accessor: (row: Rental) => `${row.rent_amount.toLocaleString('fr-FR')} FCFA`
                                }
                            ]}
                        />
                    </div>
                </div>

                {/* Retards de paiement */}
                <div className="space-y-4">
                    <Heading title="Retards de Paiement" className="text-destructive" />
                    <DataTable
                        data={latePayments}
                        columns={[
                            {
                                header: "Locataire",
                                accessor: (row: Rental) => `${row.tenant.first_name} ${row.tenant.last_name}`
                            },
                            { header: "Bien", accessor: (row: Rental) => row.property.title },
                            {
                                header: "Échéance",
                                accessor: (row: Rental) => (
                                    <span className="text-destructive font-medium">
                                        {format(new Date(row.next_payment_date), 'dd MMMM yyyy', { locale: fr })}
                                    </span>
                                )
                            },
                            {
                                header: "Montant",
                                className: "text-right",
                                accessor: (row: Rental) => `${row.rent_amount.toLocaleString('fr-FR')} FCFA`
                            }
                        ]}
                    />
                </div>
            </div>
        </>
    );
}

Dashboard.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[{ title: 'Dashboard', href: dashboard() }]}>{page}</AppLayout>
);
