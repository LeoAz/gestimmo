import { Head } from "@inertiajs/react"
import { format } from "date-fns"
import { Check, ChevronsUpDown, FileText, TrendingUp, AlertCircle, Home, Download, Printer, Calculator } from "lucide-react"
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
import {
    availability,
    exploitation,
    latePayments,
    rentFollowUp,
    revenue,
} from "@/routes/reports"

interface Property {
    id: number
    title: string
    parent_id: number | null
}

interface Category {
    id: number
    name: string
}

interface Props {
    properties: Property[]
    categories: Category[]
    filters: {
        property_id?: string
        category_id?: string
        start_date?: string
        end_date?: string
    }
}

type ReportType = 'late_payments' | 'revenue' | 'availability' | 'exploitation' | 'rent_follow_up'

const reportEndpoints = {
    late_payments: latePayments,
    revenue,
    availability,
    exploitation,
    rent_follow_up: rentFollowUp,
}

export default function ReportsIndex({ properties, categories, filters }: Props) {
    const [activeReport, setActiveReport] = React.useState<ReportType>('late_payments')
    const [propertyId, setPropertyId] = React.useState(filters.property_id || "all")
    const [categoryId, setCategoryId] = React.useState(filters.category_id || "all")
    const [propertyOpen, setPropertyOpen] = React.useState(false)
    const [categoryOpen, setCategoryOpen] = React.useState(false)
    const [startDate, setStartDate] = React.useState(filters.start_date || "")
    const [endDate, setEndDate] = React.useState(filters.end_date || "")
    const [reportData, setReportData] = React.useState<any[]>([])
    const [exploitationData, setExploitationData] = React.useState<any>(null)
    const [loading, setLoading] = React.useState(false)

    const fetchReportData = React.useCallback(async (signal: AbortSignal) => {
        setLoading(true)

        try {
            const params = new URLSearchParams()

            if (propertyId !== "all") {
                params.append('property_id', propertyId)
            }

            if (categoryId !== "all") {
                params.append('category_id', categoryId)
            }

            if (startDate) {
                params.append('start_date', startDate)
            }

            if (endDate) {
                params.append('end_date', endDate)
            }

            const endpoint = reportEndpoints[activeReport].url()
            const response = await fetch(`${endpoint}?${params.toString()}`, { signal })
            const data = await response.json()

            if (!signal.aborted) {
                if (activeReport === 'exploitation') {
                    setExploitationData(data)
                } else {
                    setReportData(data)
                }
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
    }, [activeReport, propertyId, categoryId, startDate, endDate])

    React.useEffect(() => {
        const controller = new AbortController()

        const load = async () => {
            await fetchReportData(controller.signal)
        }

        void load()

        return () => {
            controller.abort()
        }
    }, [fetchReportData, activeReport, propertyId, categoryId, startDate, endDate])

    const handleExport = (type: 'excel' | 'pdf') => {
        const params = new URLSearchParams()

        if (propertyId !== "all") {
            params.append('property_id', propertyId)
        }

        if (categoryId !== "all") {
            params.append('category_id', categoryId)
        }

        if (startDate) {
            params.append('start_date', startDate)
        }

        if (endDate) {
            params.append('end_date', endDate)
        }

        params.append('export', type)

        const endpoint = reportEndpoints[activeReport].url()

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
            {
                header: "Période de facturation",
                accessor: (row: any) => row.billing_period || "-",
                sortable: true,
                sortKey: "period_start"
            },
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
        exploitation: [
            { header: "Référence", accessor: "invoice_number" },
            { header: "Date", accessor: (row: any) => new Date(row.date).toLocaleDateString() },
            { header: "Période", accessor: "period" },
            { header: "Immeuble", accessor: (row: any) => row.building_title || "-" },
            { header: "Appartement", accessor: "property_title" },
            { header: "Statut", accessor: (row: any) => (
                <span className={cn(
                    "font-medium uppercase text-[10px]",
                    row.status === 'paid' ? "text-green-600" : "text-red-600"
                )}>
                    {row.status === 'paid' ? 'Payé' : 'Impayé'}
                </span>
            )},
            { header: "Montant", accessor: (row: any) => <span className="text-green-600 font-medium">{formatCurrency(row.total_amount)}</span> },
        ],
        rent_follow_up: [
            {
                header: "Bien Immobilier",
                accessor: "property_title",
                className: "sticky left-0 bg-white z-10 min-w-[200px]"
            },
            { header: "Locataire", accessor: "tenant_name", className: "sticky left-[200px] bg-white z-10 border-r min-w-[150px]" },
        ],
        exploitation_expenses: [
            { header: "Référence", accessor: "reference" },
            { header: "Date", accessor: (row: any) => new Date(row.date).toLocaleDateString() },
            {
                header: "Bien immo",
                accessor: (row: any) => row.building_title
                    ? `${row.building_title} / ${row.property_title}`
                    : row.property_title
            },
            { header: "Fournisseur", accessor: "provider" },
            { header: "Description", accessor: "description" },
            { header: "Montant", accessor: (row: any) => <span className="text-red-600 font-medium">{formatCurrency(row.total_amount)}</span> },
        ]
    }

    const searchKeys: Record<ReportType, string> = {
        late_payments: "invoice_number",
        revenue: "invoice_number",
        availability: "title",
        exploitation: "invoice_number",
        rent_follow_up: "tenant_name"
    }

    const reports = [
        { id: 'rent_follow_up', title: 'Suivi des Loyers', icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { id: 'late_payments', title: 'Retards de Paiement', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
        { id: 'revenue', title: 'Chiffre d\'Affaire', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
        { id: 'availability', title: 'Disponibilité des Biens', icon: Home, color: 'text-amber-600', bg: 'bg-amber-50' },
        { id: 'exploitation', title: 'Exploitation Détaillé', icon: Calculator, color: 'text-purple-600', bg: 'bg-purple-50' },
    ]

    const getRentFollowUpColumns = () => {
        if (activeReport !== 'rent_follow_up' || reportData.length === 0) {
            return columns.rent_follow_up
        }

        // Get all unique month keys across all rows
        const allMonths = new Set<string>()
        reportData.forEach((row: any) => {
            if (row.months) {
                Object.keys(row.months).forEach(m => allMonths.add(m))
            }
        })

        const months = Array.from(allMonths).sort()
        const monthColumns = months.map((month) => ({
            header: format(new Date(month + "-01"), "MMM yy"),
            className: "text-center",
            accessor: (row: any) => {
                const data = row.months ? row.months[month] : null

                if (!data) {
                    return (
                        <div className="text-[10px] font-medium p-1 rounded text-center min-w-[100px] bg-gray-100 text-gray-400">
                            -
                        </div>
                    )
                }

                return (
                    <div className={cn(
                        "min-w-[100px] rounded p-1 text-center text-xs font-medium",
                        Number(data.amount) === 0 && "border border-orange-200 bg-orange-100 text-orange-800",
                        Number(data.amount) !== 0 && data.status === 'paid' && "border border-emerald-200 bg-emerald-100 text-emerald-800",
                        Number(data.amount) !== 0 && data.status === 'unpaid' && "border border-rose-200 bg-rose-100 text-rose-800",
                    )}>
                        {data.label}
                    </div>
                )
            }
        }))

        return [...columns.rent_follow_up, ...monthColumns]
    }

    const getFooter = () => {
        if (loading || reportData.length === 0) {
            return null
        }

        let total = 0
        let colSpan = 0

        switch (activeReport) {
            case 'rent_follow_up': {
                const allMonths = new Set<string>()
                reportData.forEach((row: any) => {
                    if (row.months) {
                        Object.keys(row.months).forEach(m => allMonths.add(m))
                    }
                })
                const months = Array.from(allMonths).sort()

                return (
                    <TableRow className="bg-muted/50 font-bold">
                        <TableCell colSpan={2} className="text-right">Total Mensuel</TableCell>
                        {months.map((month) => {
                            const monthlyTotal = reportData.reduce((acc, curr) => acc + Number(curr.months?.[month]?.amount || 0), 0)

                            return (
                                <TableCell key={month} className={cn("text-center text-xs", monthlyTotal === 0 && "text-orange-600")}>
                                    {formatCurrency(monthlyTotal).replace(',00', '')}
                                </TableCell>
                            )
                        })}
                    </TableRow>
                )
            }
            case 'late_payments':
                total = reportData.reduce((acc, curr) => acc + Number(curr.amount_due), 0)
                colSpan = 4
                break
            case 'revenue':
                total = reportData.reduce((acc, curr) => acc + Number(curr.amount), 0)
                colSpan = 5
                break
            case 'exploitation': {
                return null
            }
            default:
                return null
        }

        return (
            <TableRow className="bg-muted/50 font-bold">
                <TableCell colSpan={colSpan} className="text-right">Total</TableCell>
                <TableCell className={activeReport === 'late_payments' ? "text-red-600" : ""}>
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
                                <label className="text-sm font-medium">Catégorie</label>
                                <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={categoryOpen}
                                            className="w-full justify-between font-normal"
                                        >
                                            {categoryId === "all"
                                                ? "Toutes les catégories"
                                                : categories.find((c) => c.id.toString() === categoryId)?.name || "Sélectionner une catégorie"}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Rechercher une catégorie..." />
                                            <CommandList>
                                                <CommandEmpty>Aucune catégorie trouvée.</CommandEmpty>
                                                <CommandGroup>
                                                    <CommandItem
                                                        value="all"
                                                        onSelect={() => {
                                                            setCategoryId("all")
                                                            setCategoryOpen(false)
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                categoryId === "all" ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        Toutes les catégories
                                                    </CommandItem>
                                                    {categories.map((c) => (
                                                        <CommandItem
                                                            key={c.id}
                                                            value={c.name}
                                                            onSelect={() => {
                                                                setCategoryId(c.id.toString())
                                                                setCategoryOpen(false)
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    categoryId === c.id.toString() ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {c.name}
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
                                    onChange={(date) => {
                                        const newDate = date ? format(date, "yyyy-MM-dd") : ""
                                        setStartDate(newDate)
                                    }}
                                    placeholder="Choisir une date de début"
                                />
                            </div>
                            <div className="space-y-2 flex flex-col">
                                <label className="text-sm font-medium">Date de fin</label>
                                <DatePicker
                                    date={endDate ? new Date(endDate) : undefined}
                                    onChange={(date) => {
                                        const newDate = date ? format(date, "yyyy-MM-dd") : ""
                                        setEndDate(newDate)
                                    }}
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
                    ) : activeReport === 'exploitation' && exploitationData ? (
                        <div className="space-y-16 py-8" key={`report-exploitation-${startDate}-${endDate}-${propertyId}`}>
                            {/* 1. Tableau Chiffre d'Affaires */}
                            <div className="space-y-6">
                                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 px-1 border-l-2 border-gray-900 ml-1 pl-4">1. Chiffre d'Affaires</h3>
                                <div className="rounded-none border-y border-gray-100 bg-white overflow-hidden">
                                    <DataTable
                                        data={exploitationData.invoices || []}
                                        columns={columns.exploitation}
                                        searchKey="invoice_number"
                                        showPagination={false}
                                        footer={
                                            <TableRow className="border-t border-gray-100 font-bold bg-white">
                                                <TableCell colSpan={6} className="text-right py-6 text-[10px] uppercase tracking-widest text-gray-400 font-medium">Total Chiffre d'Affaires</TableCell>
                                                <TableCell className="text-green-600 py-6 font-bold text-base">{formatCurrency(exploitationData.summary?.total_invoices || 0)}</TableCell>
                                            </TableRow>
                                        }
                                    />
                                </div>
                            </div>

                            {/* 2. Tableau Dépenses */}
                            <div className="space-y-6">
                                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 px-1 border-l-2 border-gray-900 ml-1 pl-4">2. Dépenses</h3>
                                <div className="rounded-none border-y border-gray-100 bg-white overflow-hidden">
                                    <DataTable
                                        data={exploitationData.expenses || []}
                                        columns={columns.exploitation_expenses}
                                        searchKey="reference"
                                        showPagination={false}
                                        footer={
                                            <TableRow className="border-t border-gray-100 font-bold bg-white">
                                                <TableCell colSpan={5} className="text-right py-6 text-[10px] uppercase tracking-widest text-gray-400 font-medium">Total Dépenses</TableCell>
                                                <TableCell className="text-red-600 py-6 font-bold text-base">{formatCurrency(exploitationData.summary?.total_expenses || 0)}</TableCell>
                                            </TableRow>
                                        }
                                    />
                                </div>
                            </div>

                            {/* 3. Tableau Récapitulatif */}
                            <div className="space-y-6">
                                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 px-1 border-l-2 border-gray-900 ml-1 pl-4">3. Bilan d'Exploitation</h3>
                                <div className="border border-gray-100 bg-slate-50/30">
                                    <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                                        <div className="p-10">
                                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.2em] mb-4 text-center md:text-left">Total Revenus</p>
                                            <p className="text-3xl font-light text-green-600 text-center md:text-left tracking-tighter">{formatCurrency(exploitationData.summary?.total_invoices || 0)}</p>
                                        </div>
                                        <div className="p-10">
                                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.2em] mb-4 text-center md:text-left">Total Dépenses</p>
                                            <p className="text-3xl font-light text-red-600 text-center md:text-left tracking-tighter">{formatCurrency(exploitationData.summary?.total_expenses || 0)}</p>
                                        </div>
                                        <div className="p-10 bg-white">
                                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.2em] mb-4 text-center md:text-left">Solde d'Exploitation</p>
                                            <p className={cn(
                                                "text-3xl font-bold text-center md:text-left tracking-tighter",
                                                (exploitationData.summary?.balance || 0) >= 0 ? "text-slate-900" : "text-amber-600"
                                            )}>{formatCurrency(exploitationData.summary?.balance || 0)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <DataTable
                            key={`report-${activeReport}-${startDate}-${endDate}-${propertyId}-${reportData.length}`}
                            data={reportData}
                            columns={activeReport === 'rent_follow_up' ? getRentFollowUpColumns() : columns[activeReport]}
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
