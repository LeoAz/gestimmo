import { router, Head, Link, useForm } from "@inertiajs/react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Eye, Printer, AlertCircle, Calendar, History, Plus } from "lucide-react"
import * as React from "react"
import { toast } from "sonner"

import { show as rentalsShow } from "@/actions/App/Http/Controllers/RentalController"
import { DataTable } from "@/components/data-table"
import Heading from "@/components/heading"
import type { Payment, Invoice } from "@/components/invoice-view"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import AppLayout from "@/layouts/app-layout"

interface Rental {
    id: number
    tenant: {
        first_name: string
        last_name: string
        balance: string
    }
    property: {
        title: string
        parent?: { title: string }
    }
    next_payment_date: string
    rent_amount: string
}

interface Category {
    id: number
    name: string
}

interface Property {
    id: number
    title: string
}

interface Props {
    payments: Payment[]
    futurePayments: Rental[]
    debts: Invoice[] // Les dettes sont maintenant basées sur les factures impayées
    categories: Category[]
    properties: Property[]
    filters: {
        search?: string
        status?: string
        category_id?: string
        property_id?: string
    }
    organization?: any
}

export default function Index({ payments, futurePayments, debts, categories, properties, filters }: Props) {
    const [showCreateModal, setShowCreateModal] = React.useState(false)

    const handleFilterChange = (newFilters: Record<string, string>) => {
        router.get('/payments', newFilters, {
            preserveState: true,
            replace: true
        })
    }

    const { data, setData, post, processing, reset, errors } = useForm({
        invoice_id: "",
        amount: "",
        payment_date: format(new Date(), "yyyy-MM-dd"),
        payment_method: "cash",
        notes: "",
    })

    const formatCurrency = (amount: string | number) => {
        return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", minimumFractionDigits: 0 }).format(Number(amount))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        post("/payments", {
            onSuccess: () => {
                setShowCreateModal(false)
                reset()
                toast.success("Encaissement enregistré avec succès")
            }
        })
    }

    const handleInvoiceChange = (invoiceId: string) => {
        const invoice = debts.find(d => d.id === parseInt(invoiceId))

        if (invoice) {
            setData(d => ({
                ...d,
                invoice_id: invoiceId,
                amount: invoice.total_amount.toString()
            }))
        } else {
            setData("invoice_id", invoiceId)
        }
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
            accessor: (row: Payment) => (
                <div className="flex flex-col text-left">
                    {row.rental.property.parent && (
                        <span className="text-[10px] text-muted-foreground uppercase leading-tight">
                            {row.rental.property.parent.title}
                        </span>
                    )}
                    <span className="font-medium">{row.rental.property.title}</span>
                </div>
            )
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
                        asChild
                    >
                        <Link href={`/invoices/${row.invoice_id}`}>
                            <Printer className="h-4 w-4" />
                        </Link>
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

    const debtColumns = [
        {
            header: "N° Facture",
            accessor: (row: Invoice) => <span className="font-medium">{row.invoice_number}</span>,
        },
        {
            header: "Locataire",
            accessor: (row: Invoice) => `${row.rental.tenant.first_name} ${row.rental.tenant.last_name}`
        },
        {
            header: "Bien",
            accessor: (row: Invoice) => (
                <div className="flex flex-col text-left">
                    {row.rental.property.parent && (
                        <span className="text-[10px] text-muted-foreground uppercase leading-tight">
                            {row.rental.property.parent.title}
                        </span>
                    )}
                    <span className="font-medium">{row.rental.property.title}</span>
                </div>
            )
        },
        {
            header: "Montant à payer",
            accessor: (row: Invoice) => (
                <span className="text-destructive font-bold">
                    {formatCurrency(row.total_amount)}
                </span>
            )
        },
        {
            header: "Date Facture",
            accessor: (row: Invoice) => format(new Date(row.date), "dd/MM/yyyy")
        },
        {
            header: "Actions",
            accessor: (row: Invoice) => (
                <Button variant="outline" size="sm" onClick={() => {
                    handleInvoiceChange(row.id.toString())
                    setShowCreateModal(true)
                }}>
                    Encaisser
                </Button>
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
            accessor: (row: Rental) => (
                <div className="flex flex-col text-left">
                    {row.property.parent && (
                        <span className="text-[10px] text-muted-foreground uppercase leading-tight">
                            {row.property.parent.title}
                        </span>
                    )}
                    <span className="font-medium">{row.property.title}</span>
                </div>
            )
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <Heading
                        title="Paiements & Créances"
                        description="Gérez vos paiements, créances à recouvrer et futurs paiements."
                    />
                    <Button onClick={() => setShowCreateModal(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nouvel encaissement
                    </Button>
                </div>

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
                            initialFilters={filters}
                            onFilterChange={handleFilterChange}
                            filters={[
                                {
                                    label: "Catégorie",
                                    key: "category_id" as any,
                                    options: categories.map(c => ({ label: c.name, value: c.id.toString() }))
                                },
                                {
                                    label: "Bien immobilier",
                                    key: "property_id" as any,
                                    options: properties.map(p => ({ label: p.title, value: p.id.toString() }))
                                }
                            ]}
                        />
                    </TabsContent>

                    <TabsContent value="debts" className="mt-4">
                        <DataTable
                            data={debts}
                            columns={debtColumns}
                            emptyMessage="Aucune créance en attente."
                            initialFilters={filters}
                            onFilterChange={handleFilterChange}
                            filters={[
                                {
                                    label: "Catégorie",
                                    key: "category_id" as any,
                                    options: categories.map(c => ({ label: c.name, value: c.id.toString() }))
                                },
                                {
                                    label: "Bien immobilier",
                                    key: "property_id" as any,
                                    options: properties.map(p => ({ label: p.title, value: p.id.toString() }))
                                }
                            ]}
                        />
                    </TabsContent>

                    <TabsContent value="future" className="mt-4">
                        <DataTable
                            data={futurePayments}
                            columns={futureColumns}
                            initialFilters={filters}
                            onFilterChange={handleFilterChange}
                            filters={[
                                {
                                    label: "Catégorie",
                                    key: "category_id" as any,
                                    options: categories.map(c => ({ label: c.name, value: c.id.toString() }))
                                },
                                {
                                    label: "Bien immobilier",
                                    key: "property_id" as any,
                                    options: properties.map(p => ({ label: p.title, value: p.id.toString() }))
                                }
                            ]}
                        />
                    </TabsContent>
                </Tabs>

                {/* Modal Création Encaissement */}
                <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Enregistrer un encaissement</DialogTitle>
                            <DialogDescription>
                                Un encaissement doit obligatoirement être lié à une facture existante.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="invoice">Facture à encaisser</Label>
                                <Select onValueChange={handleInvoiceChange} value={data.invoice_id}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner une facture" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {debts.map((invoice) => (
                                            <SelectItem key={invoice.id} value={invoice.id.toString()}>
                                                {invoice.invoice_number} - {invoice.rental.tenant.first_name} {invoice.rental.tenant.last_name} ({formatCurrency(invoice.total_amount)})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.invoice_id && <p className="text-xs text-destructive">{errors.invoice_id}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="amount">Montant encaissé (XOF)</Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        value={data.amount}
                                        onChange={(e) => setData("amount", e.target.value)}
                                        required
                                    />
                                    {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="payment_date">Date d'encaissement</Label>
                                    <Input
                                        id="payment_date"
                                        type="date"
                                        value={data.payment_date}
                                        onChange={(e) => setData("payment_date", e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="payment_method">Moyen de paiement</Label>
                                <Select onValueChange={(v) => setData("payment_method", v)} value={data.payment_method}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner un moyen" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cash">Espèces</SelectItem>
                                        <SelectItem value="bank_transfer">Virement Bancaire</SelectItem>
                                        <SelectItem value="mobile_money">Mobile Money</SelectItem>
                                        <SelectItem value="balance">Utiliser le solde (Avance)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e) => setData("notes", e.target.value)}
                                    placeholder="Commentaires éventuels..."
                                />
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>Annuler</Button>
                                <Button type="submit" disabled={processing}>Confirmer l'encaissement</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    )
}

Index.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: "Encaissements", href: "/payments" },
        ]}
    >
        {page}
    </AppLayout>
)
