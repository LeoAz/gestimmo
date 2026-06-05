import { Head, Link, useForm, usePage } from "@inertiajs/react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { CalendarIcon, CheckCircle2, CreditCard, History, Printer, ArrowLeft, User, Home, Info, AlertCircle } from "lucide-react"
import * as React from "react"
import { toast } from "sonner"

import { DataTable } from "@/components/data-table"
import { FormAlert } from "@/components/form-alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
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
  property: {
      id: number
      title: string
  }
  tenant: {
      id: number
      first_name: string
      last_name: string
      phone: string
  }
  payments: Payment[]
}

interface Props {
  rental: Rental
}

export default function Show({ rental }: Props) {
  const { flash } = usePage<any>().props
  const pageErrors = usePage().props.errors
  const { data, setData, post, patch, processing, errors, reset } = useForm({
    rental_id: rental.id,
    amount: rental.rent_amount,
    payment_date: new Date(),
    payment_method: "cash",
    status: "paid",
    notes: "",
  })

  const [selectedPendingPayment, setSelectedPendingPayment] = React.useState<Payment | null>(null)
  const markAsPaidForm = useForm({
    payment_date: new Date(),
    payment_method: "cash",
  })

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault()
    post("/payments", {
      transform: (data) => ({
        ...data,
        payment_date: data.status === 'paid' ? format(data.payment_date, "yyyy-MM-dd") : null,
      }),
      onSuccess: () => {
        toast.success(data.status === 'paid' ? "Paiement enregistré avec succès" : "Facture (créance) générée")
        reset("notes")
      },
    })
  }

  const handleMarkAsPaid = (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedPendingPayment) {
        return
    }

    patch(`/payments/${selectedPendingPayment.id}/mark-as-paid`, {
      transform: (data) => ({
        ...data,
        payment_date: format(data.payment_date, "yyyy-MM-dd"),
      }),
      onSuccess: () => {
        toast.success("Facture marquée comme payée")
        setSelectedPendingPayment(null)
      },
    })
  }

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF" }).format(Number(amount))
  }

  const isLate = rental.next_payment_date && new Date(rental.next_payment_date) < new Date()

  const paymentColumns = [
    {
      header: "Facture",
      accessor: "invoice_number" as const,
      className: "font-mono text-xs",
      sortable: true,
      sortKey: "invoice_number" as any
    },
    {
      header: "Période",
      accessor: (row: any) => (
        <span className="text-xs">
          {format(new Date(row.period_start), "dd/MM/yy")} au {format(new Date(row.period_end), "dd/MM/yy")}
        </span>
      ),
    },
    {
      header: "Montant",
      accessor: (row: any) => (
        <div className="text-right">
          {formatCurrency(row.amount)}
        </div>
      ),
      sortable: true,
      sortKey: "amount" as any,
      className: "text-right"
    },
    {
      header: "Statut",
      accessor: (row: any) => (
        <Badge variant={row.status === 'paid' ? 'default' : 'destructive'} className="text-[10px] uppercase font-bold">
          {row.status === 'paid' ? 'Payé' : 'Impayé'}
        </Badge>
      ),
      sortable: true,
      sortKey: "status" as any
    },
    {
      header: "Paiement",
      accessor: (row: any) => (
        <div className="text-xs">
           <div>{row.payment_date ? format(new Date(row.payment_date), "dd/MM/yyyy") : "-"}</div>
           {row.payment_method && (
              <div className="text-muted-foreground italic">
                {row.payment_method === 'cash' ? 'Espèces' :
                 row.payment_method === 'bank_transfer' ? 'Virement' : 'Mobile Money'}
              </div>
            )}
        </div>
      ),
    },
    {
      header: "Actions",
      accessor: (row: any) => (
        <div className="flex justify-end gap-2">
          {row.status === 'pending' && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2"
              onClick={() => setSelectedPendingPayment(row)}
            >
              Payer
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <a href={`/payments/${row.id}/invoice`} target="_blank" rel="noreferrer">
                  <Printer className="h-4 w-4" />
              </a>
          </Button>
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
             <Button variant="destructive" variant="outline" className="text-destructive hover:bg-destructive/10">
                Résilier le contrat
             </Button>
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-12">
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-10">

            {/* Quick Stats / Info Cards */}
            <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border bg-card p-4 space-y-1">
                   <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Loyer Mensuel</p>
                   <p className="text-2xl font-bold">{formatCurrency(rental.rent_amount)}</p>
                </div>
                <div className="rounded-xl border bg-card p-4 space-y-1">
                   <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Caution versée</p>
                   <p className="text-2xl font-bold">{formatCurrency(rental.deposit_amount)}</p>
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

            {/* Payment Recording Form Section */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Enregistrement de paiement
              </h2>
              <div className="rounded-2xl border bg-card p-6">
                <FormAlert message={errors.error || pageErrors?.error || flash?.error || flash?.success} />
                <form onSubmit={handleSubmitPayment} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="amount" className="font-semibold">Montant à encaisser (XOF)</Label>
                      <Input
                        id="amount"
                        name="amount"
                        type="number"
                        value={data.amount}
                        onChange={(e) => setData("amount", e.target.value)}
                        required
                        className="h-11 text-lg font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status" className="font-semibold">Nature de l'opération</Label>
                      <Select value={data.status} onValueChange={(value: any) => setData("status", value)}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Choisir le statut" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="paid">Paiement immédiat (Reçu)</SelectItem>
                          <SelectItem value="pending">Facturer (Créance)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {data.status === "paid" && (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="space-y-2">
                        <Label htmlFor="payment_date" className="font-semibold">Date de réception</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal h-11",
                                !data.payment_date && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {data.payment_date ? format(data.payment_date, "PPP", { locale: fr }) : <span>Choisir une date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={data.payment_date}
                              onSelect={(date) => date && setData("payment_date", date)}
                              initialFocus
                              locale={fr}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="payment_method" className="font-semibold">Moyen de règlement</Label>
                        <Select value={data.payment_method} onValueChange={(value) => setData("payment_method", value)}>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Moyen de paiement" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Espèces</SelectItem>
                            <SelectItem value="bank_transfer">Virement Bancaire</SelectItem>
                            <SelectItem value="mobile_money">Mobile Money</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="notes" className="font-semibold">Notes / Observations</Label>
                    <Input
                      id="notes"
                      value={data.notes}
                      onChange={(e) => setData("notes", e.target.value)}
                      placeholder="Information complémentaire sur ce paiement..."
                      className="h-11"
                    />
                  </div>
                  <Button type="submit" disabled={processing} className="w-full h-12 text-md font-bold transition-all shadow-md hover:shadow-lg">
                    {data.status === 'paid' ? (
                      <><CheckCircle2 className="mr-2 h-5 w-5" /> Valider l'encaissement</>
                    ) : (
                      <><CreditCard className="mr-2 h-5 w-5" /> Générer la facture impayée</>
                    )}
                  </Button>
                </form>
              </div>
            </section>

            {/* History Table Section */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Historique des paiements
              </h2>
              <DataTable
                columns={paymentColumns}
                data={rental.payments}
                searchKey="invoice_number"
                emptyMessage="Aucun historique de paiement disponible."
              />
            </section>
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
                  <Button variant="outline" className="w-full rounded-full" asChild>
                    <Link href={`/tenants/${rental.tenant.id}`}>
                      Profil complet du locataire
                    </Link>
                  </Button>
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
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={markAsPaidForm.processing}>Confirmer le règlement</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
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
