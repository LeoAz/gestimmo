import { Head, Link, useForm, usePage } from "@inertiajs/react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { CalendarIcon, CheckCircle2, History, Printer } from "lucide-react"
import * as React from "react"
import { toast } from "sonner"

import { FormAlert } from "@/components/form-alert"
import Heading from "@/components/heading"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import AppLayout from "@/layouts/app-layout"
import { cn } from "@/lib/utils"

interface Payment {
  id: number
  amount: string
  payment_date: string
  period_start: string
  period_end: string
  type: string
  status: string
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
  const { data, setData, post, processing, errors, reset } = useForm({
    rental_id: rental.id,
    amount: rental.rent_amount,
    payment_date: new Date(),
    notes: "",
  })

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault()
    post("/payments", {
      transform: (data) => ({
        ...data,
        payment_date: format(data.payment_date, "yyyy-MM-dd"),
      }),
      onSuccess: () => {
        toast.success("Paiement enregistré avec succès")
        reset("notes")
      },
    })
  }

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF" }).format(Number(amount))
  }

  const isLate = rental.next_payment_date && new Date(rental.next_payment_date) < new Date()

  return (
    <>
      <Head title={`Location - ${rental.property.title}`} />

      <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
        <Heading
            title={`Détails de la location - ${rental.property.title}`}
            description={`Contrat de location pour ${rental.tenant.first_name} ${rental.tenant.last_name}`}
        />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Sidebar: Info locataire et bien */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Résumé de la location</CardTitle>
                <CardDescription>
                    Statut: <Badge variant={rental.status === 'active' ? 'default' : 'secondary'}>
                        {rental.status === 'active' ? 'En cours' : rental.status}
                    </Badge>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Locataire</Label>
                  <p className="font-medium">
                    {rental.tenant.first_name} {rental.tenant.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">{rental.tenant.phone}</p>
                </div>
                <Separator />
                <div>
                  <Label className="text-muted-foreground">Bien immobilier</Label>
                  <p className="font-medium">{rental.property.title}</p>
                </div>
                <Separator />
                <div>
                  <Label className="text-muted-foreground">Conditions financières</Label>
                  <div className="flex justify-between">
                    <span>Loyer:</span>
                    <span className="font-semibold">{formatCurrency(rental.rent_amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Fréquence:</span>
                    <span>{rental.payment_frequency === 'monthly' ? 'Mensuel' : rental.payment_frequency}</span>
                  </div>
                  <div className="mt-2 flex justify-between">
                    <span>Caution:</span>
                    <span>{formatCurrency(rental.deposit_amount)}</span>
                  </div>
                </div>
                <Separator />
                <div className={cn("p-3 rounded-md", isLate ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary")}>
                  <Label className="block mb-1">Prochain paiement</Label>
                  <p className="text-lg font-bold">
                    {rental.next_payment_date
                        ? format(new Date(rental.next_payment_date), "dd MMMM yyyy", { locale: fr })
                        : "N/A"}
                  </p>
                  {isLate && <p className="text-xs font-medium uppercase mt-1">Impayé / En retard</p>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href={`/tenants/${rental.tenant_id}`}>
                        <History className="mr-2 h-4 w-4" /> Historique locataire
                    </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start text-destructive hover:bg-destructive/10">
                    Arrêter la location
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content: Paiements et Enregistrement */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Enregistrer un paiement / Reconduire</CardTitle>
                <CardDescription>
                    Validez le paiement du loyer pour prolonger la période de location.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormAlert message={errors.error || pageErrors?.error || flash?.error || flash?.success} />
                <form onSubmit={handleSubmitPayment} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Montant payé (XOF)</Label>
                      <Input
                        id="amount"
                        name="amount"
                        type="number"
                        value={data.amount}
                        onChange={(e) => setData("amount", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payment_date">Date du paiement</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
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
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes / Observations</Label>
                    <Input
                      id="notes"
                      value={data.notes}
                      onChange={(e) => setData("notes", e.target.value)}
                      placeholder="Ex: Payé en espèces, par virement..."
                    />
                  </div>
                  <Button type="submit" disabled={processing} className="w-full">
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Valider le paiement & Reconduire
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Historique des paiements</CardTitle>
                <CardDescription>Liste des factures et reçus générés.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Facture</TableHead>
                      <TableHead>Période</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rental.payments.length > 0 ? (
                      rental.payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">{payment.invoice_number}</TableCell>
                          <TableCell className="text-xs">
                            {format(new Date(payment.period_start), "dd/MM/yy")} au {format(new Date(payment.period_end), "dd/MM/yy")}
                          </TableCell>
                          <TableCell>{formatCurrency(payment.amount)}</TableCell>
                          <TableCell>{format(new Date(payment.payment_date), "dd/MM/yyyy")}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" asChild>
                                <a href={`/payments/${payment.id}/invoice`} target="_blank">
                                    <Printer className="h-4 w-4" />
                                </a>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                          Aucun paiement enregistré pour le moment.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
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
