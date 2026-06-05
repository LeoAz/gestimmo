import { Head } from "@inertiajs/react"
import { format } from "date-fns"
import { Download, Printer } from "lucide-react"
import * as React from "react"

import { index as depositsIndex } from "@/actions/App/Http/Controllers/DepositController"
import { DataTable } from "@/components/data-table"
import Heading from "@/components/heading"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import AppLayout from "@/layouts/app-layout"

interface Deposit {
    id: number
    tenant: {
        id: number
        first_name: string
        last_name: string
    }
    property: {
        id: number
        title: string
    }
    deposit_amount: string
    unpaid_amount: number
    remaining_deposit: number
    status: string
    start_date: string
}

interface Props {
    deposits: Deposit[]
}

export default function Index({ deposits }: Props) {
    const formatCurrency = (amount: string | number) => {
        return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF" }).format(Number(amount))
    }

    const handlePrint = () => {
        window.print()
    }

    const columns = [
        {
            header: "Locataire",
            accessor: (row: Deposit) => `${row.tenant.first_name} ${row.tenant.last_name}`,
        },
        {
            header: "Bien",
            accessor: (row: Deposit) => row.property.title,
        },
        {
            header: "Caution Initiale",
            accessor: (row: Deposit) => formatCurrency(row.deposit_amount),
            className: "font-medium",
        },
        {
            header: "Impayés (Défalqués)",
            accessor: (row: Deposit) => (
                <span className={row.unpaid_amount > 0 ? "text-destructive font-medium" : "text-muted-foreground"}>
                    {formatCurrency(row.unpaid_amount)}
                </span>
            ),
        },
        {
            header: "Caution Restante",
            accessor: (row: Deposit) => (
                <Badge variant={row.remaining_deposit > 0 ? "default" : "destructive"}>
                    {formatCurrency(row.remaining_deposit)}
                </Badge>
            ),
        },
        {
            header: "Date début",
            accessor: (row: Deposit) => format(new Date(row.start_date), "dd/MM/yyyy"),
        },
        {
            header: "Statut Location",
            accessor: (row: Deposit) => (
                <Badge variant="outline">
                    {row.status === 'active' ? 'En cours' : row.status}
                </Badge>
            ),
        },
    ]

    return (
        <>
            <Head title="Gestion des Cautions" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between print:hidden">
                    <Heading
                        title="Gestion des Cautions"
                        description="Suivi des cautions encaissées et simulation du solde restant après déduction des impayés."
                    />
                    <div className="flex gap-2">
                        <Button onClick={handlePrint} variant="outline" size="sm" className="flex items-center gap-2">
                            <Printer className="h-4 w-4" /> Imprimer Rapport
                        </Button>
                        <Button onClick={handlePrint} variant="outline" size="sm" className="flex items-center gap-2">
                            <Download className="h-4 w-4" /> Excel
                        </Button>
                    </div>
                </div>

                <div className="hidden print:block mb-8">
                    <h1 className="text-2xl font-bold">Rapport des Cautions</h1>
                    <p className="text-muted-foreground">Généré le {format(new Date(), "dd/MM/yyyy HH:mm")}</p>
                </div>

                <DataTable
                    data={deposits}
                    columns={columns}
                    searchKey={(row) => `${row.tenant.first_name} ${row.tenant.last_name} ${row.property.title}`}
                />
            </div>
        </>
    )
}

Index.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: "Cautions", href: depositsIndex() },
        ]}
    >
        {page}
    </AppLayout>
)
