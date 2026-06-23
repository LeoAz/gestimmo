import { router } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AlertCircle, Building2, Calendar, FileText, Receipt, Wallet, TrendingUp, BarChart3 } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Label, LabelList, Pie, PieChart as RechartsPieChart, XAxis, YAxis } from "recharts"

import { show as invoicesShow } from '@/actions/App/Http/Controllers/InvoiceController';
import { DataTable } from '@/components/data-table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { ChartConfig } from '@/components/ui/chart';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { DatePicker } from '@/components/ui/date-picker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
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

interface Invoice {
    id: number;
    invoice_number: string;
    date: string;
    due_date: string;
    total_amount: number;
    status: 'pending' | 'partial' | 'paid';
    rental: Rental;
}

interface DashboardProps {
    availableProperties: Property[];
    revenueEvolution: { month: string; revenue: number }[];
    debtEvolution: { month: string; amount: number }[];
    availabilityStats: { status: string; count: number; fill: string }[];
    upcomingPayments: Rental[];
    recoveryStats: { estimated: number; actual: number };
    latePayments: Invoice[];
    pendingInvoices: Invoice[];
    filters: {
        start_date: string;
        end_date: string;
    };
}

const revenueChartConfig = {
    revenue: {
        label: "Chiffre d'affaires",
        color: "hsl(var(--primary))",
    },
} satisfies ChartConfig;

const debtChartConfig = {
    amount: {
        label: "Créances",
        color: "hsl(var(--destructive))",
    },
} satisfies ChartConfig;

const availabilityChartConfig = {
    count: {
        label: "Biens",
    },
    availability: {
        label: "Disponible",
        color: "hsl(var(--chart-2))",
    },
    rented: {
        label: "Loué",
        color: "hsl(var(--chart-1))",
    },
    other: {
        label: "Autre",
        color: "hsl(var(--muted))",
    },
} satisfies ChartConfig;

export default function Dashboard({
    availableProperties,
    revenueEvolution,
    debtEvolution,
    availabilityStats,
    upcomingPayments,
    recoveryStats,
    latePayments,
    pendingInvoices,
    filters,
}: DashboardProps) {
    const formatCurrency = (amount: number | string) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF',
            minimumFractionDigits: 0,
        }).format(Number(amount)).replace('XOF', 'FCFA');
    };

    const handleDateChange = (key: 'start_date' | 'end_date', date?: Date) => {
        if (!date) {
            return;
        }

        router.get(dashboard().url, {
            ...filters,
            [key]: format(date, 'yyyy-MM-dd'),
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const totalProperties = availabilityStats.reduce((acc, curr) => acc + curr.count, 0);

    return (
        <div className="flex flex-col gap-8 p-6 max-w-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
                        <p className="text-muted-foreground">Vue d'ensemble de votre parc immobilier et des finances.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Du</span>
                            <DatePicker
                                date={parseISO(filters.start_date)}
                                onChange={(date) => handleDateChange('start_date', date)}
                                className="w-[180px]"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Au</span>
                            <DatePicker
                                date={parseISO(filters.end_date)}
                                onChange={(date) => handleDateChange('end_date', date)}
                                className="w-[180px]"
                            />
                        </div>
                    </div>
                </div>

                {latePayments.length > 0 && (
                    <Alert variant="destructive" className="border-destructive/20 bg-destructive/5">
                        <AlertCircle className="h-4 w-4 text-destructive" />
                        <AlertTitle className="font-semibold text-destructive">Attention : Retards de paiement</AlertTitle>
                        <AlertDescription className="text-destructive/80">
                            Il y a {latePayments.length} retard(s) de paiement en attente. Veuillez consulter les détails ci-dessous.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Statistiques rapides */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    <div className="rounded-xl border bg-card p-5 space-y-3 transition-all hover:shadow-md">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-primary/80">Revenus Estimés</p>
                            <Wallet className="h-4 w-4 text-primary/60" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{formatCurrency(recoveryStats.estimated)}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">Prévisions pour le mois en cours</p>
                        </div>
                    </div>

                    <div className="rounded-xl border bg-card p-5 space-y-3 transition-all hover:shadow-md">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-green-600/80">Revenus Encaissés</p>
                            <Receipt className="h-4 w-4 text-green-600/60" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-green-600">{formatCurrency(recoveryStats.actual)}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">Montants réellement perçus</p>
                        </div>
                    </div>

                    <div className={cn(
                        "rounded-xl border p-5 space-y-3 transition-all hover:shadow-md",
                        latePayments.length > 0 ? "bg-destructive/5 border-destructive/20" : "bg-card"
                    )}>
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-destructive/80">Retards</p>
                            <AlertCircle className={cn("h-4 w-4 text-destructive/60", latePayments.length > 0 && "animate-pulse")} />
                        </div>
                        <div>
                            <p className={cn("text-2xl font-bold", latePayments.length > 0 && "text-destructive")}>{latePayments.length}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">Loyers hors délais</p>
                        </div>
                    </div>

                    <div className="rounded-xl border bg-card p-5 space-y-3 transition-all hover:shadow-md">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-orange-600/80">Factures</p>
                            <FileText className="h-4 w-4 text-orange-600/60" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-orange-600">{pendingInvoices.length}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">Factures en attente de paiement</p>
                        </div>
                    </div>

                    <div className="rounded-xl border bg-card p-5 space-y-3 transition-all hover:shadow-md">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-blue-600/80">Disponibles</p>
                            <Building2 className="h-4 w-4 text-blue-600/60" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-blue-600">{availableProperties.length}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">Biens prêts à la location</p>
                        </div>
                    </div>
                </div>


                {/* Graphiques */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card className="flex flex-col">
                        <CardHeader className="items-center pb-0">
                            <CardTitle>Disponibilité des biens</CardTitle>
                            <CardDescription>Répartition du parc immobilier</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 pb-0">
                            <ChartContainer
                                config={availabilityChartConfig}
                                className="mx-auto aspect-square max-h-[250px]"
                            >
                                <RechartsPieChart>
                                    <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent hideLabel />}
                                    />
                                    <Pie
                                        data={availabilityStats}
                                        dataKey="count"
                                        nameKey="status"
                                        innerRadius={60}
                                        strokeWidth={5}
                                    >
                                        <Label
                                            content={({ viewBox }) => {
                                                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                                    return (
                                                        <text
                                                            x={viewBox.cx}
                                                            y={viewBox.cy}
                                                            textAnchor="middle"
                                                            dominantBaseline="middle"
                                                        >
                                                            <tspan
                                                                x={viewBox.cx}
                                                                y={viewBox.cy}
                                                                className="fill-primary text-3xl font-bold"
                                                            >
                                                                {
                                                                    totalProperties
                                                                }
                                                            </tspan>
                                                            <tspan
                                                                x={viewBox.cx}
                                                                y={
                                                                    (viewBox.cy ||
                                                                        0) + 24
                                                                }
                                                                className="fill-muted-foreground"
                                                            >
                                                                Biens total
                                                            </tspan>
                                                        </text>
                                                    );
                                                }
                                            }}
                                        />
                                    </Pie>
                                </RechartsPieChart>
                            </ChartContainer>
                        </CardContent>
                        <CardFooter className="flex-col gap-2 text-sm">
                            <div className="flex items-center gap-2 font-medium leading-none">
                                {availabilityStats.find(s => s.status === 'Disponible')?.count} biens prêts à louer <TrendingUp className="h-4 w-4" />
                            </div>
                            <div className="leading-none text-muted-foreground">
                                Basé sur les villas et appartements
                            </div>
                        </CardFooter>
                    </Card>

                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Évolution du chiffre d'affaires</CardTitle>
                            <CardDescription>
                                Revenus mensuels encaissés
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={revenueChartConfig} className="aspect-auto h-[250px] w-full">
                                <AreaChart
                                    accessibilityLayer
                                    data={revenueEvolution}
                                    margin={{
                                        left: 12,
                                        right: 12,
                                    }}
                                >
                                    <CartesianGrid vertical={false} />
                                    <XAxis
                                        dataKey="month"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                        tickFormatter={(value) => value}
                                    />
                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                                    />
                                    <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent indicator="dot" hideLabel />}
                                    />
                                    <Area
                                        dataKey="revenue"
                                        type="natural"
                                        fill="hsl(var(--primary))"
                                        fillOpacity={0.4}
                                        stroke="hsl(var(--primary))"
                                        stackId="a"
                                    />
                                </AreaChart>
                            </ChartContainer>
                        </CardContent>
                        <CardFooter>
                            <div className="flex w-full items-start gap-2 text-sm">
                                <div className="grid gap-2">
                                    <div className="flex items-center gap-2 font-medium leading-none">
                                        Performance financière sur la période sélectionnée <TrendingUp className="h-4 w-4" />
                                    </div>
                                    <div className="flex items-center gap-2 leading-none text-muted-foreground">
                                        Total: {formatCurrency(revenueEvolution.reduce((acc, curr) => acc + curr.revenue, 0))}
                                    </div>
                                </div>
                            </div>
                        </CardFooter>
                    </Card>

                    <Card className="lg:col-span-3">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="grid gap-1">
                                <CardTitle>Créances à recouvrer</CardTitle>
                                <CardDescription>Montants en attente de paiement par mois</CardDescription>
                            </div>
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={debtChartConfig} className="aspect-auto h-[250px] w-full">
                                <BarChart
                                    accessibilityLayer
                                    data={debtEvolution}
                                    margin={{
                                        top: 20,
                                    }}
                                >
                                    <CartesianGrid vertical={false} />
                                    <XAxis
                                        dataKey="month"
                                        tickLine={false}
                                        tickMargin={10}
                                        axisLine={false}
                                        tickFormatter={(value) => value}
                                    />
                                    <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent hideLabel />}
                                    />
                                    <Bar dataKey="amount" fill="hsl(var(--destructive))" radius={8}>
                                        <LabelList
                                            position="top"
                                            offset={12}
                                            className="fill-muted-foreground"
                                            fontSize={12}
                                            formatter={(value: number) => `${(value / 1000).toFixed(0)}k`}
                                        />
                                    </Bar>
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                        <CardFooter className="flex-col items-start gap-2 text-sm">
                            <div className="flex items-center gap-2 font-medium leading-none">
                                Total des créances: {formatCurrency(debtEvolution.reduce((acc, curr) => acc + curr.amount, 0))}
                            </div>
                            <div className="leading-none text-muted-foreground">
                                Somme des factures en attente pour la période
                            </div>
                        </CardFooter>
                    </Card>
                </div>

                <Tabs defaultValue="late" className="w-full space-y-6">
                    <TabsList className="bg-muted/50 p-1">
                        <TabsTrigger value="late" className="gap-2">
                            <AlertCircle className="h-4 w-4" />
                            Retards sur recouvrement
                            {latePayments.length > 0 && (
                                <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                                    {latePayments.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="pending" className="gap-2">
                            <FileText className="h-4 w-4" />
                            Factures clients
                            {pendingInvoices.length > 0 && (
                                <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                                    {pendingInvoices.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="upcoming" className="gap-2">
                            <Calendar className="h-4 w-4" />
                            Paiements à venir
                        </TabsTrigger>
                        <TabsTrigger value="available" className="gap-2">
                            <Building2 className="h-4 w-4" />
                            Disponibilité immobilière
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="late" className="space-y-6 outline-none">
                        <div className="flex items-center gap-2 border-b pb-4">
                            <AlertCircle className="h-5 w-5 text-destructive" />
                            <h2 className="text-xl font-semibold tracking-tight">Retards sur Factures Émises</h2>
                        </div>
                        <DataTable
                            data={latePayments}
                            columns={[
                                {
                                    header: "Facture",
                                    accessor: (row: Invoice) => (
                                        <div className="flex flex-col">
                                            <span className="font-medium text-foreground">{row.invoice_number}</span>
                                            <span className="text-xs text-muted-foreground">{row.rental.property.title}</span>
                                        </div>
                                    )
                                },
                                {
                                    header: "Locataire",
                                    accessor: (row: Invoice) => (
                                        <span className="font-medium">
                                            {row.rental.tenant.first_name} {row.rental.tenant.last_name}
                                        </span>
                                    )
                                },
                                {
                                    header: "Échéance",
                                    accessor: (row: Invoice) => (
                                        <span className="text-destructive font-semibold">
                                            {format(new Date(row.due_date), 'dd MMM yyyy', { locale: fr })}
                                        </span>
                                    )
                                },
                                {
                                    header: "Montant",
                                    className: "text-right font-medium",
                                    accessor: (row: Invoice) => (
                                        <div className="text-right">
                                            {formatCurrency(row.total_amount)}
                                        </div>
                                    )
                                },
                                {
                                    header: "",
                                    className: "text-right",
                                    accessor: (row: Invoice) => (
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={invoicesShow({ invoice: row.id })}>Voir</Link>
                                        </Button>
                                    )
                                }
                            ]}
                        />
                    </TabsContent>

                    <TabsContent value="pending" className="space-y-6 outline-none">
                        <div className="flex items-center gap-2 border-b pb-4">
                            <FileText className="h-5 w-5 text-orange-500" />
                            <h2 className="text-xl font-semibold tracking-tight">Factures en attente</h2>
                        </div>
                        <DataTable
                            data={pendingInvoices}
                            columns={[
                                {
                                    header: "Référence",
                                    accessor: (row: Invoice) => (
                                        <div className="flex flex-col">
                                            <span className="font-medium">{row.invoice_number}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {format(new Date(row.date), 'dd MMM yyyy', { locale: fr })}
                                            </span>
                                        </div>
                                    )
                                },
                                {
                                    header: "Locataire",
                                    accessor: (row: Invoice) => (
                                        <div className="font-medium">
                                            {row.rental.tenant.first_name} {row.rental.tenant.last_name}
                                        </div>
                                    )
                                },
                                {
                                    header: "Montant",
                                    className: "text-right font-medium",
                                    accessor: (row: Invoice) => (
                                        <div className="text-right">
                                            {formatCurrency(row.total_amount)}
                                        </div>
                                    )
                                },
                                {
                                    header: "",
                                    className: "text-right",
                                    accessor: (row: Invoice) => (
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={invoicesShow({ invoice: row.id })}>Détails</Link>
                                        </Button>
                                    )
                                }
                            ]}
                        />
                    </TabsContent>

                    <TabsContent value="upcoming" className="space-y-6 outline-none">
                        <div className="flex items-center gap-2 border-b pb-4">
                            <Calendar className="h-5 w-5 text-primary" />
                            <h2 className="text-xl font-semibold tracking-tight">Paiements à venir (30j)</h2>
                        </div>
                        <DataTable
                            data={upcomingPayments}
                            columns={[
                                {
                                    header: "Locataire",
                                    accessor: (row: Rental) => (
                                        <div className="font-medium">{row.tenant.first_name} {row.tenant.last_name}</div>
                                    )
                                },
                                {
                                    header: "Date prévue",
                                    accessor: (row: Rental) => format(new Date(row.next_payment_date), 'dd MMMM yyyy', { locale: fr })
                                },
                                {
                                    header: "Montant",
                                    className: "text-right font-semibold text-primary",
                                    accessor: (row: Rental) => (
                                        <div className="text-right">
                                            {formatCurrency(row.rent_amount)}
                                        </div>
                                    )
                                }
                            ]}
                        />
                    </TabsContent>

                    <TabsContent value="available" className="space-y-6 outline-none">
                        <div className="flex items-center gap-2 border-b pb-4">
                            <Building2 className="h-5 w-5 text-blue-500" />
                            <h2 className="text-xl font-semibold tracking-tight">Biens disponibles</h2>
                        </div>
                        <DataTable
                            data={availableProperties}
                            columns={[
                                {
                                    header: "Titre",
                                    accessor: (row: Property) => (
                                        <div className="font-medium">{row.title}</div>
                                    )
                                },
                                {
                                    header: "Catégorie",
                                    accessor: (row: Property) => <Badge variant="secondary" className="font-normal">{row.category.name}</Badge>
                                },
                                {
                                    header: "Loyer",
                                    className: "text-right font-medium",
                                    accessor: (row: Property) => (
                                        <div className="text-right">
                                            {formatCurrency(row.price)}
                                        </div>
                                    )
                                },
                                {
                                    header: "",
                                    className: "text-right",
                                    accessor: (row: Property) => (
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={`/properties/${row.id}`}>Détails</Link>
                                        </Button>
                                    )
                                }
                            ]}
                        />
                    </TabsContent>
                </Tabs>
            </div>
    );
}

Dashboard.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[{ title: 'Tableau de bord', href: dashboard() }]}>{page}</AppLayout>
);
