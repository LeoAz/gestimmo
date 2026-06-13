import { Head, Link, router } from "@inertiajs/react"
import { format } from "date-fns"
import { Download, Edit, Plus, Printer, Trash2 } from "lucide-react"
import * as React from "react"

import { DataTable } from "@/components/data-table"
import Heading from "@/components/heading"
import { Button } from "@/components/ui/button"
import { Combobox } from "@/components/ui/combobox"
import { DatePicker } from "@/components/ui/date-picker"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import AppLayout from "@/layouts/app-layout"

interface ExpenseItem {
    id: number
    description: string
    quantity: string | number
    unit_price: string | number
    total: string | number
}

interface Expense {
    id: number
    reference: string
    date: string
    provider: string
    total_amount: string | number
    property: {
        id: number
        title: string
    }
    items: ExpenseItem[]
}

interface Props {
    expenses: {
        data: Expense[]
        links: any[]
        current_page: number
        last_page: number
    }
    properties: { id: number; title: string }[]
    filters: {
        search?: string
        property_id?: string
        date_from?: string
        date_to?: string
    }
}

export default function Index({ expenses, properties, filters }: Props) {
    const [search, setSearch] = React.useState(filters.search || "")
    const [propertyId, setPropertyId] = React.useState(filters.property_id || "all")
    const [dateFrom, setDateFrom] = React.useState(filters.date_from || "")
    const [dateTo, setDateTo] = React.useState(filters.date_to || "")
    const [deleteId, setDeleteId] = React.useState<number | null>(null)

    const propertyOptions = React.useMemo(() => [
        { value: "all", label: "Tous les biens" },
        ...properties.map(p => ({ value: p.id.toString(), label: p.title }))
    ], [properties])

    const formatCurrency = (amount: string | number) => {
        return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF" }).format(Number(amount))
    }

    const handleSearch = () => {
        router.get('/expenses', {
            search,
            property_id: propertyId === "all" ? undefined : propertyId,
            date_from: dateFrom,
            date_to: dateTo
        }, { preserveState: true })
    }

    const handleExport = () => {
        window.location.href = `/expenses?export=excel&search=${search}&property_id=${propertyId === "all" ? "" : propertyId}&date_from=${dateFrom}&date_to=${dateTo}`
    }

    const confirmDelete = () => {
        if (deleteId) {
            router.delete(`/expenses/${deleteId}`, {
                onFinish: () => setDeleteId(null)
            })
        }
    }

    const columns = [
        {
            header: "Référence",
            accessor: (row: Expense) => <span className="font-medium">{row.reference}</span>,
        },
        {
            header: "Date",
            accessor: (row: Expense) => format(new Date(row.date), "dd/MM/yyyy"),
        },
        {
            header: "Prestataire",
            accessor: (row: Expense) => row.provider,
        },
        {
            header: "Bien",
            accessor: (row: Expense) => row.property?.title || "N/A",
        },
        {
            header: "Montant Total",
            accessor: (row: Expense) => formatCurrency(row.total_amount),
        },
        {
            header: "Actions",
            accessor: (row: Expense) => (
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" asChild title="Imprimer">
                        <Link href={`/expenses/${row.id}`}>
                            <Printer className="h-4 w-4" />
                        </Link>
                    </Button>
                    <Button variant="ghost" size="icon" asChild title="Modifier">
                        <Link href={`/expenses/${row.id}/edit`}>
                            <Edit className="h-4 w-4" />
                        </Link>
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(row.id)} title="Supprimer">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            )
        }
    ]

    return (
        <>
            <Head title="Dépenses" />

            <div className="flex flex-col gap-6 p-4 sm:p-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <Heading title="Dépenses" description="Gérez l'ensemble des dépenses effectuées sur vos biens." />
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleExport} className="flex items-center gap-2">
                            <Download className="h-4 w-4" /> Excel
                        </Button>
                        <Button asChild className="flex items-center gap-2">
                            <Link href="/expenses/create">
                                <Plus className="h-4 w-4" /> Saisir une dépense
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-2">
                            <Input
                                placeholder="Rechercher (réf, prestataire...)"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Combobox
                                options={propertyOptions}
                                value={propertyId}
                                onValueChange={setPropertyId}
                                placeholder="Tous les biens"
                            />
                        </div>
                        <div className="md:col-span-2 flex flex-col sm:flex-row gap-4 items-end">
                            <div className="flex-1 w-full space-y-2">
                                <DatePicker
                                    date={dateFrom ? new Date(dateFrom) : undefined}
                                    onChange={(date) => setDateFrom(date ? date.toISOString().split('T')[0] : "")}
                                    placeholder="Du"
                                />
                            </div>
                            <div className="flex-1 w-full space-y-2">
                                <DatePicker
                                    date={dateTo ? new Date(dateTo) : undefined}
                                    onChange={(date) => setDateTo(date ? date.toISOString().split('T')[0] : "")}
                                    placeholder="Au"
                                />
                            </div>
                            <Button onClick={handleSearch} className="w-full sm:w-auto">Filtrer</Button>
                        </div>
                    </div>

                    <DataTable
                        columns={columns as any}
                        data={expenses.data}
                    />
                </div>
            </div>

            <Dialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmer la suppression</DialogTitle>
                        <DialogDescription>
                            Êtes-vous sûr de vouloir supprimer cette dépense ? Cette action est irréversible.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteId(null)}>Annuler</Button>
                        <Button variant="destructive" onClick={confirmDelete}>Supprimer</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

Index.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[{ title: "Dépenses", href: "/expenses" }]}>
        {page}
    </AppLayout>
)
