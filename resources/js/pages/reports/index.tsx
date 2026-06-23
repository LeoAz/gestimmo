import { Head } from "@inertiajs/react"
import { format } from "date-fns"
import { Check, ChevronsUpDown, FileText, TrendingUp, AlertCircle, Home, Download, Printer } from "lucide-react"
import * as React from "react"

import { DataTable } from "@/components/data-table"
import Heading from "@/components/heading"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { DatePicker } from "@/components/ui/date-picker"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { TableCell, TableRow } from "@/components/ui/table"
import AppLayout from "@/layouts/app-layout"
import { cn } from "@/lib/utils"

interface Property {
    id: number
    title: string
    parent_id: number | null
}

interface Building {
    id: number
    title: string
}

interface Props {
    properties: Property[]
    buildings: Building[]
    filters: {
        property_id?: string
        building_id?: string
        start_date?: string
        end_date?: string
    }
}

type ReportType = 'late_payments' | 'revenue' | 'availability' | 'forecast'

export default function ReportsIndex({ properties, buildings, filters }: Props) {
    const [activeReport, setActiveReport] = React.useState<ReportType>('late_payments')
    const [propertyId, setPropertyId] = React.useState(filters.property_id || "all")
    const [buildingId, setBuildingId] = React.useState(filters.building_id || "all")
    const [propertyOpen, setPropertyOpen] = React.useState(false)
    const [buildingOpen, setBuildingOpen] = React.useState(false)
    const [startDate, setStartDate] = React.useState(filters.start_date || "")
    const [endDate, setEndDate] = React.useState(filters.end_date || "")
    const [reportData, setReportData] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(false)

    const fetchReportData = React.useCallback(async (signal: AbortSignal) => {
        setLoading(true)

        try {
            const params = new URLSearchParams()

            if (propertyId !== "all") {
                params.append('property_id', propertyId)
            }

            if (buildingId !== "all") {
                params.append('building_id', buildingId)
            }

            if (startDate) {
                params.append('start_date', startDate)
            }

            if (endDate) {
                params.append('end_date', endDate)
            }

            const endpoint = `/reports/${activeReport.replace('_', '-')}`
            const response = await fetch(`${endpoint}?${params.toString()}`, { signal })
            const data = await response.json()

            if (!signal.aborted) {
                setReportData(data)
            }
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                console.error("Erreur lors du chargement du rapport", error)
            }
        } finally {
            if (!signal.aborted) {
                setLoading(false)
            }
        }
    }, [activeReport, propertyId, buildingId, startDate, endDate])

    React.useEffect(() => {
        const controller = new AbortController()

        const load = async () => {
            await fetchReportData(controller.signal)
        }

        void load()

        return () => {
            controller.abort()
        }
    }, [fetchReportData])

    const handleExport = (type: 'excel' | 'pdf') => {
        const params = new URLSearchParams()

        if (propertyId !== "all") {
            params.append('property_id', propertyId)
        }

        if (buildingId !== "all") {
            params.append('building_id', buildingId)
        }

        if (startDate) {
            params.append('start_date', startDate)
        }

        if (endDate) {
            params.append('end_date', endDate)
        }

        params.append('export', type)

        const endpoint = `/reports/${activeReport.replace('_', '-')}`

        window.open(`${endpoint}?${params.toString()}`, '_blank')
    }

    const formatCurrency = (amount: string | number) => {
        return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF" }).format(Number(amount))
    }

    const columns: any = {
        late_payments: [
            { header: "N° Facture", accessor: "invoice_number", sortable: true, sortKey: "invoice_number" },
            { header: "Immeuble", accessor: (row: any) => row.building_title || "-", sortable: true, sortKey: "building_title" },
            { header: "Bien Immobilier", accessor: "property_title", sortable: true, sortKey: "property_title" },
            { header: "Locataire", accessor: "tenant_name", sortable: true, sortKey: "tenant_name" },
            { header: "Date d'échéance", accessor: (row: any) => new Date(row.due_date).toLocaleDateString(), sortable: true, sortKey: "due_date" },
            { header: "Jours de retard", accessor: (row: any) => <span className="text-red-600 font-bold">{Math.floor(row.days_late)}</span>, sortable: true, sortKey: "days_late" },
            { header: "Montant dû", accessor: (row: any) => formatCurrency(row.amount_due), sortable: true, sortKey: "amount_due" },
        ],
        revenue: [
            { header: "Immeuble", accessor: (row: any) => row.building_title || "-", sortable: true, sortKey: "building_title" },
            { header: "Bien Immobilier", accessor: "property_title", sortable: true, sortKey: "property_title" },
            { header: "Locataire", accessor: "tenant_name", sortable: true, sortKey: "tenant_name" },
            { header: "Date", accessor: (row: any) => new Date(row.payment_date).toLocaleDateString(), sortable: true, sortKey: "payment_date" },
            { header: "Période de facturation", accessor: (row: any) => row.billing_period ?? `${new Date(row.period_start).toLocaleDateString()} - ${new Date(row.period_end).toLocaleDateString()}`, sortable: true, sortKey: "period_start" },
            { header: "N° Facture", accessor: "invoice_number", sortable: true, sortKey: "invoice_number" },
            { header: "Montant", accessor: (row: any) => formatCurrency(row.amount), sortable: true, sortKey: "amount" },
        ],
        availability: [
            { header: "Immeuble", accessor: (row: any) => row.building_title || "-", sortable: true, sortKey: "building_title" },
            { header: "Bien Immobilier", accessor: "title", sortable: true, sortKey: "title" },
            { header: "Type", accessor: "type", sortable: true, sortKey: "type" },
            { header: "Ville", accessor: "city", sortable: true, sortKey: "city" },
            {
                header: "Statut",
                accessor: (row: any) => (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {row.status === 'available' ? 'Disponible' : 'Occupé'}
                    </span>
                ),
                sortable: true,
                sortKey: "status"
            },
            { header: "Prix", accessor: (row: any) => formatCurrency(row.price), sortable: true, sortKey: "price" },
        ],
        forecast: [
            { header: "Immeuble", accessor: (row: any) => row.building_title || "-", sortable: true, sortKey: "building_title" },
            { header: "Bien Immobilier", accessor: "property_title", sortable: true, sortKey: "property_title" },
            { header: "Locataire", accessor: "tenant_name", sortable: true, sortKey: "tenant_name" },
            { header: "Période", accessor: "period", sortable: true, sortKey: "period" },
            { header: "Prévu", accessor: (row: any) => formatCurrency(row.amount_expected), sortable: true, sortKey: "amount_expected" },
            { header: "Recouvré", accessor: (row: any) => formatCurrency(row.amount_collected), sortable: true, sortKey: "amount_collected" },
            {
                header: "Reste",
                accessor: (row: any) => (
                    <span className={row.amount_expected - row.amount_collected > 0 ? 'text-red-600 font-bold' : 'text-green-600'}>
                        {formatCurrency(row.amount_expected - row.amount_collected)}
                    </span>
                ),
                sortable: true,
                sortKey: "amount_expected"
            },
        ]
    }

    const searchKeys: Record<ReportType, string> = {
        late_payments: "invoice_number",
        revenue: "invoice_number",
        availability: "title",
        forecast: "tenant_name"
    }

    const reports = [
        { id: 'late_payments', title: 'Retards de Paiement', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
        { id: 'revenue', title: 'Chiffre d\'Affaire', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
        { id: 'availability', title: 'Disponibilité des Biens', icon: Home, color: 'text-amber-600', bg: 'bg-amber-50' },
        { id: 'forecast', title: 'Prévisions & Recouvrement', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    ]

    const getFooter = () => {
        if (loading || reportData.length === 0) {
            return null
        }

        let total = 0
        let colSpan = 0

        switch (activeReport) {
            case 'late_payments':
                total = reportData.reduce((acc, curr) => acc + Number(curr.amount_due), 0)
                colSpan = 4
                break
            case 'revenue':
                total = reportData.reduce((acc, curr) => acc + Number(curr.amount), 0)
                colSpan = 5
                break
            case 'forecast':
                total = reportData.reduce((acc, curr) => acc + (Number(curr.amount_expected) - Number(curr.amount_collected)), 0)
                colSpan = 5
                break
            default:
                return null
        }

        return (
            <TableRow className="bg-muted/50 font-bold">
                <TableCell colSpan={colSpan} className="text-right">Total</TableCell>
                <TableCell className={activeReport === 'late_payments' || activeReport === 'forecast' ? "text-red-600" : ""}>
                    {formatCurrency(total)}
                </TableCell>
            </TableRow>
        )
    }

    return (
        <>
            <Head title="Rapports & Statistiques" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <Heading
                        title="Rapports & Statistiques"
                        description="Analysez les performances de votre parc immobilier et gérez les paiements."
                    />
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => handleExport('excel')} className="gap-2">
                            <Download className="h-4 w-4" />
                            Excel
                        </Button>
                        <Button onClick={() => handleExport('pdf')} className="gap-2">
                            <Printer className="h-4 w-4" />
                            PDF / Imprimer
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {reports.map((report) => {
                        const Icon = report.icon

                        return (
                            <Card
                                key={report.id}
                                className={`cursor-pointer transition-all hover:ring-2 hover:ring-primary ${activeReport === report.id ? 'ring-2 ring-primary bg-muted/50' : ''}`}
                                onClick={() => setActiveReport(report.id as ReportType)}
                            >
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">{report.title}</CardTitle>
                                    <div className={`p-2 rounded-full ${report.bg}`}>
                                        <Icon className={`h-4 w-4 ${report.color}`} />
                                    </div>
                                </CardHeader>
                            </Card>
                        )
                    })}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Filtres du rapport</CardTitle>
                        <CardDescription>Affinez les données affichées ci-dessous.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-2 flex flex-col">
                                <label className="text-sm font-medium">Immeuble / Bâtiment</label>
                                <Popover open={buildingOpen} onOpenChange={setBuildingOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={buildingOpen}
                                            className="w-full justify-between font-normal"
                                        >
                                            {buildingId === "all"
                                                ? "Tous les immeubles"
                                                : buildings.find((b) => b.id.toString() === buildingId)?.title || "Sélectionner un immeuble"}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Rechercher un immeuble..." />
                                            <CommandList>
                                                <CommandEmpty>Aucun immeuble trouvé.</CommandEmpty>
                                                <CommandGroup>
                                                    <CommandItem
                                                        value="all"
                                                        onSelect={() => {
                                                            setBuildingId("all")
                                                            setBuildingOpen(false)
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                buildingId === "all" ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        Tous les immeubles
                                                    </CommandItem>
                                                    {buildings.map((b) => (
                                                        <CommandItem
                                                            key={b.id}
                                                            value={b.title}
                                                            onSelect={() => {
                                                                setBuildingId(b.id.toString())
                                                                setBuildingOpen(false)
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    buildingId === b.id.toString() ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {b.title}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="space-y-2 flex flex-col">
                                <label className="text-sm font-medium">Bien Immobilier</label>
                                <Popover open={propertyOpen} onOpenChange={setPropertyOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={propertyOpen}
                                            className="w-full justify-between font-normal"
                                        >
                                            {propertyId === "all"
                                                ? "Tous les biens"
                                                : properties.find((p) => p.id.toString() === propertyId)?.title || "Sélectionner un bien"}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Rechercher un bien..." />
                                            <CommandList>
                                                <CommandEmpty>Aucun bien trouvé.</CommandEmpty>
                                                <CommandGroup>
                                                    <CommandItem
                                                        value="all"
                                                        onSelect={() => {
                                                            setPropertyId("all")
                                                            setPropertyOpen(false)
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                propertyId === "all" ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        Tous les biens
                                                    </CommandItem>
                                                    {properties
                                                        .filter(p => buildingId === "all" || p.parent_id?.toString() === buildingId || p.id.toString() === buildingId)
                                                        .map((p) => (
                                                        <CommandItem
                                                            key={p.id}
                                                            value={p.title}
                                                            onSelect={() => {
                                                                setPropertyId(p.id.toString())
                                                                setPropertyOpen(false)
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    propertyId === p.id.toString() ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {p.title}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="space-y-2 flex flex-col">
                                <label className="text-sm font-medium">Date de début</label>
                                <DatePicker
                                    date={startDate ? new Date(startDate) : undefined}
                                    onChange={(date) => setStartDate(date ? format(date, "yyyy-MM-dd") : "")}
                                    placeholder="Choisir une date de début"
                                />
                            </div>
                            <div className="space-y-2 flex flex-col">
                                <label className="text-sm font-medium">Date de fin</label>
                                <DatePicker
                                    date={endDate ? new Date(endDate) : undefined}
                                    onChange={(date) => setEndDate(date ? format(date, "yyyy-MM-dd") : "")}
                                    placeholder="Choisir une date de fin"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex-1 overflow-hidden">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold">{reports.find(r => r.id === activeReport)?.title}</h3>
                    </div>
                    {loading ? (
                        <div className="flex h-64 items-center justify-center">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                        </div>
                    ) : (
                        <DataTable
                            data={reportData}
                            columns={columns[activeReport]}
                            searchKey={searchKeys[activeReport] as any}
                            showPagination={false}
                            footer={getFooter()}
                        />
                    )}
                </div>
            </div>
        </>
    )
}

ReportsIndex.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: "Tableau de bord", href: "/dashboard" },
            { title: "Rapports", href: "/reports" },
        ]}
    >
        {page}
    </AppLayout>
)
