import { Head, Link, useForm } from "@inertiajs/react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { AlertCircle, ArrowLeft, CalendarIcon, Eye, FileText, History, Home, Info, Printer, User, XCircle } from "lucide-react"
import * as React from "react"

import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import AppLayout from "@/layouts/app-layout"
import { cn } from "@/lib/utils"

interface Payment {
  id: number
  amount: string
  payment_date: string | null
  payment_method: string | null
  period_start: string
  period_end: string
  type: string
  status: 'pending' | 'paid'
  invoice_number: string
  notes: string | null
}

interface InvoiceItem {
    id: number
    designation: string
    period: string | null
    months_count: number | null
    unit_price: string
    quantity: string
    total: string
}

interface Invoice {
    id: number
    invoice_number: string
    date: string
    due_date: string | null
    type: string
    amount_ht: string
    total_amount: string
    status: string
    notes: string | null
    items: InvoiceItem[]
    rental: Rental
}

interface Rental {
  id: number
  property_id: number
  tenant_id: number
  deposit_amount: string
  rent_amount: string
  start_date: string
  next_payment_date: string | null
  payment_frequency: 'monthly' | 'quarterly' | 'semiannual'
  status: 'active' | 'completed' | 'cancelled'
  termination_date: string | null
  termination_reason: string | null
  property: {
      id: number
      title: string
  }
  tenant: {
      id: number
      first_name: string
      last_name: string
      phone: string
      balance: string
  }
  payments: Payment[]
  invoices: Invoice[]
}

interface Props {
  rental: Rental
  organization?: any
}
export default function Show({ rental }: Props) {
  const [selectedPendingPayment, setSelectedPendingPayment] = React.useState<Payment | null>(null)
  const [showTerminationDialog, setShowTerminationDialog] = React.useState(false)

  const markAsPaidForm = useForm({
    payment_date: new Date(),
    payment_method: "cash",
  })

  const terminationForm = useForm({
    termination_date: new Date(),
    termination_reason: "",
  })

  const handleMarkAsPaid = (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedPendingPayment) {
        return
    }

    markAsPaidForm.patch(`/payments/${selectedPendingPayment.id}/mark-as-paid`, {
      transform: (data) => ({
        ...data,
        payment_date: format(data.payment_date, "yyyy-MM-dd"),
      }),
      onSuccess: () => {
        setSelectedPendingPayment(null)
      },
    })
  }


  const handleSubmitTermination = (e: React.FormEvent) => {
    e.preventDefault()
    terminationForm.post(`/rentals/${rental.id}/terminate`, {
      transform: (data) => ({
        ...data,
        termination_date: format(data.termination_date, "yyyy-MM-dd"),
      }),
      onSuccess: () => {
        setShowTerminationDialog(false)
      },
    })
  }

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF" }).format(Number(amount))
  }

  const isLate = rental.next_payment_date && new Date(rental.next_payment_date) < new Date()

  const paymentColumns = [
    {
      header: "Encaissement",
      accessor: "invoice_number" as const,
      className: "font-mono text-xs",
    },
    {
      header: "Date",
      accessor: (row: any) => row.payment_date ? format(new Date(row.payment_date), "dd/MM/yyyy") : "-",
    },
    {
      header: "Montant",
      accessor: (row: any) => (
        <div className="text-right font-semibold">
          {formatCurrency(row.amount)}
        </div>
      ),
      className: "text-right"
    },
    {
      header: "Méthode",
      accessor: (row: any) => (
        <span className="text-xs italic text-muted-foreground">
          {row.payment_method === 'cash' ? 'Espèces' :
           row.payment_method === 'bank_transfer' ? 'Virement' :
           row.payment_method === 'balance' ? 'Solde/Avance' : 'Mobile Money'}
        </span>
      ),
    },
    {
      header: "Actions",
      accessor: (row: any) => (
        <div className="flex justify-end gap-2">
          {/* Action d'impression supprimée car gérée au niveau de la facture */}
        </div>
      ),
      className: "text-right"
    }
  ]

  const invoiceColumns = [
      {
          header: "N° Facture",
          accessor: (row: Invoice) => <span className="font-mono font-medium">{row.invoice_number}</span>
      },
      {
          header: "Date",
          accessor: (row: Invoice) => format(new Date(row.date), "dd/MM/yyyy")
      },
      {
        header: "Période",
        accessor: (row: Invoice) => (
            <div className="flex flex-col text-[11px] leading-tight text-muted-foreground">
                {row.items?.map((item, idx) => (
                    <span key={idx} className="block">{item.period || '-'}</span>
                ))}
            </div>
        )
      },
      {
        header: "Mois",
        accessor: (row: Invoice) => (
            <div className="text-center font-medium">
                {row.items?.map((item, idx) => (
                    <span key={idx} className="block">{item.months_count || '-'}</span>
                ))}
            </div>
        )
      },
      {
          header: "Type",
          accessor: (row: Invoice) => (
              <Badge variant="outline">{row.type}</Badge>
          )
      },
      {
          header: "Montant",
          accessor: (row: Invoice) => (
              <div className="text-right font-semibold">
                  {formatCurrency(row.total_amount)}
              </div>
          ),
          className: "text-right"
      },
      {
          header: "Statut",
          accessor: (row: Invoice) => (
              <Badge variant={row.status === 'paid' ? 'success' : 'destructive'} className="text-[10px] uppercase font-bold">
                  {row.status === 'paid' ? 'Payée' : row.status === 'partial' ? 'Partiel' : 'En attente'}
              </Badge>
          )
      },
      {
          header: "Actions",
          accessor: (row: Invoice) => (
              <div className="flex justify-end gap-2">
                  {row.status !== 'paid' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8"
                        asChild
                      >
                        <Link href="/payments">Encaisser</Link>
                      </Button>
                  )}
                  <Link href={`/invoices/${row.id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
              </div>
          ),
          className: "text-right"
      }
  ]

  return (
    <>
      <Head title={`Location - ${rental.property.title}`} />

      <div className="flex flex-col gap-8 p-6 max-w-full">
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b pb-6">
          <div className="flex items-start gap-4">
            <Button variant="outline" size="icon" asChild className="mt-1">
              <Link href="/rentals">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={rental.status === 'active' ? 'default' : 'secondary'} className="font-medium">
                  {rental.status === 'active' ? 'Contrat actif' : rental.status}
                </Badge>
                {isLate && (
                  <Badge variant="destructive" className="flex items-center gap-1 animate-pulse">
                    <AlertCircle className="h-3 w-3" /> En retard de paiement
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Location #{rental.id}</h1>
              <p className="text-muted-foreground mt-1">
                 {rental.property.title} — {rental.tenant.first_name} {rental.tenant.last_name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="outline" asChild>
                <Link href={`/rentals/${rental.id}/edit`}>Modifier le contrat</Link>
             </Button>
            {rental.status === 'active' && (
              <Button
                variant="outline"
                className="text-destructive hover:bg-destructive/10 border-destructive/20 hover:border-destructive"
                onClick={() => setShowTerminationDialog(true)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Résilier le contrat
              </Button>
            )}
          </div>
        </div>

        {showTerminationDialog && (
          <Dialog open={showTerminationDialog} onOpenChange={setShowTerminationDialog}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-destructive flex items-center gap-2">
                  <XCircle className="h-5 w-5" />
                  Résiliation du contrat
                </DialogTitle>
                <DialogDescription>
                  Cette action mettra fin au contrat de location. L'appartement sera de nouveau disponible.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmitTermination} className="space-y-6 py-4">
                <div className="space-y-2">
                  <Label htmlFor="termination_date" className="font-semibold">Date de résiliation</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal h-11",
                          !terminationForm.data.termination_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {terminationForm.data.termination_date ? format(terminationForm.data.termination_date, "PPP", { locale: fr }) : <span>Choisir une date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={terminationForm.data.termination_date}
                        onSelect={(date) => date && terminationForm.setData("termination_date", date)}
                        initialFocus
                        locale={fr}
                      />
                    </PopoverContent>
                  </Popover>
                  {terminationForm.errors.termination_date && <p className="text-xs text-destructive">{terminationForm.errors.termination_date}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="termination_reason" className="font-semibold">Motif de la résiliation</Label>
                  <Textarea
                    id="termination_reason"
                    value={terminationForm.data.termination_reason}
                    onChange={(e) => terminationForm.setData("termination_reason", e.target.value)}
                    placeholder="Ex: Fin de bail, départ anticipé, non-respect des conditions..."
                    className="min-h-32"
                    required
                  />
                  {terminationForm.errors.termination_reason && <p className="text-xs text-destructive">{terminationForm.errors.termination_reason}</p>}
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button type="button" variant="ghost" onClick={() => setShowTerminationDialog(false)}>Annuler</Button>
                  <Button type="submit" variant="destructive" disabled={terminationForm.processing}>
                    Confirmer la résiliation
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}

        <div className="grid gap-10 lg:grid-cols-12">
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-10">

            {/* Quick Stats / Info Cards */}
            <div className="grid gap-4 sm:grid-cols-4">
                <div className="rounded-xl border bg-card p-4 space-y-1">
                   <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Loyer Mensuel</p>
                   <p className="text-2xl font-bold">{formatCurrency(rental.rent_amount)}</p>
                </div>
                <div className="rounded-xl border bg-card p-4 space-y-1">
                   <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Caution versée</p>
                   <p className="text-2xl font-bold">{formatCurrency(rental.deposit_amount)}</p>
                </div>
                <div className="rounded-xl border bg-primary/5 border-primary/20 p-4 space-y-1">
                   <p className="text-xs font-semibold text-primary uppercase tracking-wider">Solde Avance</p>
                   <p className="text-2xl font-bold text-primary">{formatCurrency(rental.tenant.balance)}</p>
                </div>
                <div className={cn(
                  "rounded-xl border p-4 space-y-1 transition-colors",
                  isLate ? "bg-destructive/5 border-destructive/20" : "bg-primary/5 border-primary/20"
                )}>
                   <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Prochain terme</p>
                   <p className={cn("text-2xl font-bold", isLate ? "text-destructive" : "text-primary")}>
                      {rental.next_payment_date ? format(new Date(rental.next_payment_date), "dd MMM yyyy", { locale: fr }) : "N/A"}
                   </p>
                </div>
            </div>

            <Tabs defaultValue="invoices" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="invoices" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Historique des Factures
                    </TabsTrigger>
                    <TabsTrigger value="payments" className="flex items-center gap-2">
                        <History className="h-4 w-4" />
                        Historique des Encaissements
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="invoices" className="space-y-4">
                    <DataTable
                        columns={invoiceColumns}
                        data={rental.invoices}
                        searchKey="invoice_number"
                        emptyMessage="Aucune facture générée pour cette location."
                    />
                </TabsContent>

                <TabsContent value="payments" className="space-y-4">
                    <DataTable
                        columns={paymentColumns}
                        data={rental.payments}
                        searchKey="invoice_number"
                        emptyMessage="Aucun encaissement enregistré."
                    />
                </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar Area */}
          <aside className="lg:col-span-4 space-y-8">

            {/* Tenant Info Card */}
            <div className="rounded-2xl border bg-card overflow-hidden">
               <div className="bg-muted/30 p-4 border-b">
                  <h3 className="font-bold flex items-center gap-2">
                     <User className="h-4 w-4 text-muted-foreground" /> Locataire
                  </h3>
               </div>
               <div className="p-5 space-y-4">
                  <div>
                    <p className="text-xl font-bold leading-none mb-1">
                      {rental.tenant.first_name} {rental.tenant.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">{rental.tenant.phone}</p>
                  </div>
                  <Separator />
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" className="w-full rounded-full" asChild>
                      <Link href={`/tenants/${rental.tenant.id}`}>
                        Profil complet du locataire
                      </Link>
                    </Button>
                    <Button variant="ghost" className="w-full rounded-full flex items-center gap-2" asChild>
                      <a href={`/rentals/${rental.id}/statement`} target="_blank">
                        <Printer className="h-4 w-4" /> Relevé de compte
                      </a>
                    </Button>
                  </div>
               </div>
            </div>

            {/* Property Info Card */}
            <div className="rounded-2xl border bg-card overflow-hidden">
               <div className="bg-muted/30 p-4 border-b">
                  <h3 className="font-bold flex items-center gap-2">
                     <Home className="h-4 w-4 text-muted-foreground" /> Bien immobilier
                  </h3>
               </div>
               <div className="p-5 space-y-4">
                  <p className="font-bold">{rental.property.title}</p>
                  <Separator />
                  <Button variant="outline" className="w-full rounded-full" asChild>
                    <Link href={`/properties/${rental.property.id}`}>
                      Voir la fiche du bien
                    </Link>
                  </Button>
               </div>
            </div>

            {/* Contract Terms Card */}
            <div className="rounded-2xl border bg-card p-6 space-y-4">
                <h3 className="font-bold flex items-center gap-2">
                   <Info className="h-4 w-4 text-muted-foreground" /> Conditions du contrat
                </h3>
                <div className="space-y-4 text-sm">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Fréquence</span>
                        <span className="font-semibold uppercase tracking-wider text-[11px] bg-muted px-2 py-0.5 rounded">
                           {rental.payment_frequency === 'monthly' ? 'Mensuel' : rental.payment_frequency}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Date de début</span>
                        <span className="font-semibold">{format(new Date(rental.start_date), "dd/MM/yyyy")}</span>
                    </div>
                    {rental.status === 'completed' && rental.termination_date && (
                        <>
                            <Separator />
                            <div className="space-y-2 pt-2 text-destructive">
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold">Résilié le</span>
                                    <span className="font-bold">{format(new Date(rental.termination_date), "dd/MM/yyyy")}</span>
                                </div>
                                {rental.termination_reason && (
                                    <div className="bg-destructive/5 p-2 rounded text-xs italic">
                                        " {rental.termination_reason} "
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

          </aside>
        </div>
      </div>

      <Dialog open={!!selectedPendingPayment} onOpenChange={(open) => !open && setSelectedPendingPayment(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Marquer comme payée</DialogTitle>
            <DialogDescription>
              Enregistrez le règlement de la facture {selectedPendingPayment?.invoice_number}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleMarkAsPaid} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="mark_payment_date">Date du paiement</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !markAsPaidForm.data.payment_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {markAsPaidForm.data.payment_date ? format(markAsPaidForm.data.payment_date, "PPP", { locale: fr }) : <span>Choisir une date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={markAsPaidForm.data.payment_date}
                    onSelect={(date) => date && markAsPaidForm.setData("payment_date", date)}
                    initialFocus
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mark_payment_method">Moyen de paiement</Label>
              <Select value={markAsPaidForm.data.payment_method} onValueChange={(value) => markAsPaidForm.setData("payment_method", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Moyen de paiement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Espèces</SelectItem>
                  <SelectItem value="bank_transfer">Virement Bancaire</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="balance" disabled={Number(rental.tenant.balance) < Number(selectedPendingPayment?.amount)}>
                    Utiliser le solde ({formatCurrency(rental.tenant.balance)})
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={markAsPaidForm.processing}>Confirmer le règlement</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>


      {/* Dialog for NEW Invoices et Payments supprimés car on utilise maintenant la page dédiée */}
    </>
  )
}

Show.layout = (page: any) => {
  const rental = page.props?.rental

  return (
    <AppLayout
      breadcrumbs={[
        { title: "Locations", href: "/rentals" },
        { title: rental ? `Détails - ${rental.property.title}` : "Détails", href: rental ? `/rentals/${rental.id}` : "#" },
      ]}
    >
      {page}
    </AppLayout>
  )
}
