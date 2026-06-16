import { Head, Link } from "@inertiajs/react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Download, Eye, Printer, AlertCircle, Calendar, History } from "lucide-react"
import * as React from "react"

import { index as paymentsIndex } from "@/actions/App/Http/Controllers/PaymentController"
import { show as rentalsShow } from "@/actions/App/Http/Controllers/RentalController"
import { DataTable } from "@/components/data-table"
import Heading from "@/components/heading"
import { InvoiceView } from "@/components/invoice-view"
import type { Payment } from "@/components/invoice-view"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AppLayout from "@/layouts/app-layout"

interface Rental {
    id: number
    tenant: {
        first_name: string
        last_name: string
    }
    property: {
        title: string
    }
    next_payment_date: string
    rent_amount: string
}

interface Props {
    payments: Payment[]
    futurePayments: Rental[]
    debts: Payment[]
    filters: {
        search?: string
        status?: string
    }
    organization?: any
}
export default function Index({ payments, futurePayments, debts, organization }: Props) {
    const [selectedPayment, setSelectedPayment] = React.useState<Payment | null>(null)
    const [printMode, setPrintMode] = React.useState<"standard" | "receipt">("standard")

    const handlePrint = () => {
        window.print()
    }

    const formatCurrency = (amount: string | number) => {
        return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF" }).format(Number(amount))
    }

    const columns = [
        {
            header: "N° Facture",
            accessor: (row: Payment) => <span className="font-medium">{row.invoice_number}</span>,
            sortable: true,
            sortKey: "invoice_number"
        },
        {
            header: "Locataire",
            accessor: (row: Payment) => `${row.rental.tenant.first_name} ${row.rental.tenant.last_name}`
        },
        {
            header: "Bien",
            accessor: (row: Payment) => row.rental.property.title
        },
        {
            header: "Montant",
            accessor: (row: Payment) => formatCurrency(row.amount),
            sortable: true,
            sortKey: "amount"
        },
        {
            header: "Statut",
            accessor: (row: Payment) => (
                <Badge variant={row.status === 'paid' ? 'default' : 'destructive'}>
                    {row.status === 'paid' ? 'Payé' : 'Impayé'}
                </Badge>
            )
        },
        {
            header: "Date Paiement",
            accessor: (row: Payment) => row.payment_date ? format(new Date(row.payment_date), "dd/MM/yyyy") : "-",
            sortable: true,
            sortKey: "payment_date"
        },
        {
            header: "Actions",
            accessor: (row: Payment) => (
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        title="Voir la facture"
                        onClick={() => setSelectedPayment(row)}
                    >
                        <Printer className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" asChild title="Détails de la location">
                        <Link href={rentalsShow({ rental: row.rental.id })}>
                            <Eye className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            ),
        },
    ]

    const futureColumns = [
        {
            header: "Locataire",
            accessor: (row: Rental) => `${row.tenant.first_name} ${row.tenant.last_name}`
        },
        {
            header: "Bien",
            accessor: (row: Rental) => row.property.title
        },
        {
            header: "Montant prévu",
            accessor: (row: Rental) => formatCurrency(row.rent_amount)
        },
        {
            header: "Date prévue",
            accessor: (row: Rental) => format(new Date(row.next_payment_date), "dd/MM/yyyy", { locale: fr })
        },
        {
            header: "Actions",
            accessor: (row: Rental) => (
                <Button variant="ghost" size="icon" asChild title="Gérer la location">
                    <Link href={rentalsShow({ rental: row.id })}>
                        <Eye className="h-4 w-4" />
                    </Link>
                </Button>
            ),
        },
    ]

    return (
        <>
            <Head title="Paiements & Créances" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <Heading
                    title="Paiements & Créances"
                    description="Gérez vos paiements, créances à recouvrer et futurs paiements."
                />

                <Tabs defaultValue="history" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                        <TabsTrigger value="history" className="flex items-center gap-2">
                            <History className="h-4 w-4" /> Historique
                        </TabsTrigger>
                        <TabsTrigger value="debts" className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-destructive" /> Créances
                        </TabsTrigger>
                        <TabsTrigger value="future" className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" /> Futurs
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="history" className="mt-4">
                        <DataTable
                            data={payments}
                            columns={columns}
                            searchKey={(row) => `${row.invoice_number} ${row.rental.tenant.first_name} ${row.rental.tenant.last_name}`}
                        />
                    </TabsContent>

                    <TabsContent value="debts" className="mt-4">
                        <DataTable
                            data={debts}
                            columns={columns}
                            emptyMessage="Aucune créance en attente."
                        />
                    </TabsContent>

                    <TabsContent value="future" className="mt-4">
                        <DataTable
                            data={futurePayments}
                            columns={futureColumns}
                            emptyMessage="Aucun paiement prévu prochainement."
                        />
                    </TabsContent>
                </Tabs>

                <Dialog open={!!selectedPayment} onOpenChange={(open) => !open && setSelectedPayment(null)}>
                    <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader className="print:hidden">
                            <DialogTitle>Facture {selectedPayment?.invoice_number}</DialogTitle>
                            <DialogDescription>
                                Visualisation et impression de la facture.
                            </DialogDescription>
                        </DialogHeader>

                        {selectedPayment && (
                            <div className="mt-6 space-y-6">
                                <div className="flex justify-between items-center print:hidden">
                                    <div className="flex gap-2 bg-muted p-1 rounded-lg border">
                                        <Button
                                            variant={printMode === 'standard' ? 'secondary' : 'ghost'}
                                            size="sm"
                                            onClick={() => setPrintMode('standard')}
                                        >
                                            Standard
                                        </Button>
                                        <Button
                                            variant={printMode === 'receipt' ? 'secondary' : 'ghost'}
                                            size="sm"
                                            onClick={() => setPrintMode('receipt')}
                                        >
                                            Ticket
                                        </Button>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button onClick={handlePrint} variant="outline" size="sm" className="flex items-center gap-2">
                                            <Printer className="h-4 w-4" /> Imprimer
                                        </Button>
                                        <Button onClick={handlePrint} variant="outline" size="sm" className="flex items-center gap-2">
                                            <Download className="h-4 w-4" /> PDF
                                        </Button>
                                    </div>
                                </div>

                                <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
                                    <InvoiceView payment={selectedPayment} printMode={printMode} organization={organization} />
                                </div>
                                <div className="flex justify-center mt-4 print:hidden">
                                    <Button asChild variant="link">
                                        <Link href={`/payments/${selectedPayment.id}/invoice`}>
                                            Ouvrir en plein écran pour impression
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </>
    )
}

Index.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: "Factures & Reçus", href: paymentsIndex() },
        ]}
    >
        {page}
    </AppLayout>
)
