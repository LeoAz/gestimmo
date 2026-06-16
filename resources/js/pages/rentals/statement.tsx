import { Head } from "@inertiajs/react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Printer, ArrowLeft, Building2, Phone, MapPin } from "lucide-react"
import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

interface Payment {
  id: number
  amount: string
  payment_date: string | null
  payment_method: string | null
  period_start: string | null
  period_end: string | null
  type: string
  status: 'pending' | 'paid'
  invoice_number: string
  notes: string | null
  is_advance_payment: boolean
}

interface Rental {
  id: number
  start_date: string
  rent_amount: string
  property: {
    title: string
    address: string
  }
  tenant: {
    first_name: string
    last_name: string
    phone: string
    balance: string
  }
  payments: Payment[]
}

interface Props {
  rental: Rental
  organization: {
    name: string
    address: string | null
    phone: string | null
    email: string | null
    tax_number?: string | null
    registration_number?: string | null
    city?: string | null
    country?: string | null
    logo_url?: string | null
  } | null
}

export default function Statement({ rental, organization }: Props) {
  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF" }).format(Number(amount))
  }

  const handlePrint = () => {
    window.print()
  }

  // Calcul du total facturé et total payé
  const totalInvoiced = rental.payments
    .filter(p => p.type === 'rent' || p.type === 'deposit')
    .reduce((acc, p) => acc + Number(p.amount), 0)

  const totalPaid = rental.payments
    .filter(p => p.status === 'paid')
    .reduce((acc, p) => acc + Number(p.amount), 0)

  const balance = totalInvoiced - totalPaid

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 print:bg-white print:p-0">
      <Head title={`Relevé - ${rental.tenant.first_name} ${rental.tenant.last_name}`} />

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Actions bar */}
        <div className="flex justify-between items-center print:hidden mb-4">
          <Button variant="outline" onClick={() => window.history.back()} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Retour
          </Button>
          <Button onClick={handlePrint} className="flex items-center gap-2">
            <Printer className="h-4 w-4" /> Imprimer le relevé
          </Button>
        </div>

        {/* Statement Document */}
        <div className="bg-white border shadow-sm p-8 sm:p-12 print:border-0 print:shadow-none">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-8 mb-12">
            <div className="space-y-4">
              {organization?.logo_url && (
                <div className="w-24 h-24 overflow-hidden rounded mb-2">
                  <img src={organization.logo_url} alt="Logo" className="w-full h-full object-contain" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-primary">{organization?.name || 'IMO-APP'}</h1>
                <p className="text-sm text-muted-foreground">{organization?.name ? 'Gestion Immobilière' : 'Gestion Immobilière Moderne'}</p>
                <div className="mt-4 text-xs space-y-1 text-muted-foreground">
                  <p className="flex items-center gap-2"><MapPin className="h-3 w-3" /> {organization?.address || '123 Rue de l\'Immobilier'}</p>
                  <p className="flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    {organization?.phone || '+221 33 000 00 00'}
                    {organization?.email ? ` | ${organization.email}` : ''}
                  </p>
                  <p>
                    {organization?.city ? `${organization.city}, ${organization.country || ''}` : 'Dakar, Sénégal'}
                  </p>
                  {organization?.tax_number && <p className="mt-2 font-semibold text-gray-900">IFU: {organization.tax_number}</p>}
                  {organization?.registration_number && <p className="font-semibold text-gray-900">RCCM: {organization.registration_number}</p>}
                </div>
              </div>
            </div>

            <div className="text-right w-full sm:w-auto">
              <h2 className="text-2xl font-bold tracking-tight mb-1">RELEVÉ DE COMPTE</h2>
              <p className="text-muted-foreground text-sm">Date: {format(new Date(), "dd MMMM yyyy", { locale: fr })}</p>
              <div className="mt-8 space-y-1 text-sm text-right">
                 <p className="font-bold">{rental.tenant.first_name} {rental.tenant.last_name}</p>
                 <p>{rental.tenant.phone}</p>
              </div>
            </div>
          </div>

          <Separator className="my-8" />

          {/* Rental Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10">
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Informations Location</h3>
              <p className="font-bold flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /> {rental.property.title}</p>
              <p className="text-sm text-muted-foreground">{rental.property.address}</p>
              <p className="text-sm">Début du contrat: {format(new Date(rental.start_date), "dd/MM/yyyy")}</p>
            </div>
            <div className="sm:text-right space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Résumé Financier</h3>
              <div className="space-y-1">
                <p className="text-sm">Loyer mensuel: <span className="font-bold">{formatCurrency(rental.rent_amount)}</span></p>
                <p className="text-sm text-primary">Solde/Avances dispo: <span className="font-bold">{formatCurrency(rental.tenant.balance)}</span></p>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="mt-8">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-primary/20">
                  <th className="py-4 px-2 text-xs font-bold uppercase text-muted-foreground">Date</th>
                  <th className="py-4 px-2 text-xs font-bold uppercase text-muted-foreground">Référence</th>
                  <th className="py-4 px-2 text-xs font-bold uppercase text-muted-foreground">Désignation</th>
                  <th className="py-4 px-2 text-xs font-bold uppercase text-muted-foreground text-right">Débit</th>
                  <th className="py-4 px-2 text-xs font-bold uppercase text-muted-foreground text-right">Crédit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rental.payments.map((payment) => (
                  <tr key={payment.id} className="text-sm">
                    <td className="py-4 px-2">{payment.payment_date ? format(new Date(payment.payment_date), "dd/MM/yyyy") : "-"}</td>
                    <td className="py-4 px-2 font-mono text-[10px]">{payment.invoice_number}</td>
                    <td className="py-4 px-2">
                      <div className="font-medium">
                        {payment.type === 'deposit' ? 'Caution' :
                         payment.type === 'advance' ? 'Versement Avance' : 'Loyer'}
                        {payment.status === 'pending' && <Badge variant="outline" className="ml-2 text-[8px] h-4">IMPAYÉ</Badge>}
                      </div>
                      {payment.period_start && (
                        <div className="text-[10px] text-muted-foreground italic">
                          Période: {format(new Date(payment.period_start), "dd/MM/yy")} au {format(new Date(payment.period_end!), "dd/MM/yy")}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-2 text-right">
                      {payment.type !== 'advance' ? formatCurrency(payment.amount) : '-'}
                    </td>
                    <td className="py-4 px-2 text-right font-semibold text-green-600">
                      {payment.status === 'paid' ? formatCurrency(payment.amount) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Final Summary */}
          <div className="mt-12 flex justify-end">
            <div className="w-full sm:w-80 space-y-3 bg-gray-50 p-6 rounded-lg print:bg-white print:border">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Facturé:</span>
                <span className="font-semibold">{formatCurrency(totalInvoiced)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Réglé:</span>
                <span className="font-semibold text-green-600">{formatCurrency(totalPaid)}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center pt-2">
                <span className="font-bold text-base">RESTE À PAYER:</span>
                <span className={`text-xl font-black ${balance > 0 ? 'text-destructive' : 'text-primary'}`}>
                  {formatCurrency(balance)}
                </span>
              </div>
              {Number(rental.tenant.balance) > 0 && (
                <div className="mt-2 text-[10px] text-right text-primary font-bold uppercase italic">
                   Dont Avance disponible: {formatCurrency(rental.tenant.balance)}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-20 pt-10 border-t border-gray-100 text-center space-y-2">
            <p className="text-muted-foreground text-[10px]">Arrêté le présent relevé à la somme de : <span className="font-bold italic uppercase">...</span></p>
            <div className="grid grid-cols-2 mt-12">
               <div className="text-sm">
                  <p className="underline underline-offset-4 mb-16">Le Locataire</p>
                  <p className="font-bold text-xs">{rental.tenant.first_name} {rental.tenant.last_name}</p>
               </div>
               <div className="text-sm">
                  <p className="underline underline-offset-4 mb-16">Pour l'Agence</p>
                  <p className="font-bold text-xs">{organization?.name || 'Le Gérant'}</p>
               </div>
            </div>
            <p className="text-gray-400 text-[8px] pt-12 italic">Document édité le {format(new Date(), "dd/MM/yyyy HH:mm")}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
