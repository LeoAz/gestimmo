import { format } from "date-fns"
import { fr } from "date-fns/locale"
import * as React from "react"
import QRCode from "react-qr-code"
import { Separator } from "@/components/ui/separator"

// @ts-expect-error - QRCode might be in .default depending on build environment
const QRCodeComponent = (QRCode as any).default || QRCode;

export interface Payment {
  id: number
  amount: string
  payment_date: string
  period_start: string
  period_end: string
  invoice_number: string
  type: string
  status: 'pending' | 'paid'
  notes: string | null
  rental: {
    rent_amount: string
    payment_frequency: string
    property: {
      title: string
    }
    tenant: {
      first_name: string
      last_name: string
      phone: string
      address: string | null
    }
  }
}

interface Props {
  payment: Payment
  printMode?: "standard" | "receipt"
  organization?: {
    name: string
    address: string | null
    phone: string | null
    email: string | null
    tax_number: string | null
    registration_number: string | null
    city: string | null
    country: string | null
    logo_url?: string | null
  }
}

export function InvoiceView({ payment, printMode = "standard", organization }: Props) {
  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF" }).format(Number(amount))
  }

  const qrData = JSON.stringify({
    tenant: `${payment.rental.tenant.first_name} ${payment.rental.tenant.last_name}`,
    property: payment.rental.property.title,
    amount: payment.amount,
    date: payment.payment_date,
    invoice: payment.invoice_number
  })

  return (
    <div className={`bg-white ${printMode === 'receipt' ? 'max-w-[80mm] mx-auto p-4' : 'p-4 sm:p-8'}`}>
      {/* Header */}
      <div className={`flex flex-col ${printMode === 'receipt' ? 'items-center text-center mb-6' : 'sm:flex-row justify-between items-start gap-8 mb-12'}`}>
        <div className="flex flex-col gap-4">
          {organization?.logo_url && (
            <div className={`${printMode === 'receipt' ? 'w-16 h-16' : 'w-24 h-24'} overflow-hidden rounded mb-2`}>
              <img src={organization.logo_url} alt="Logo" className="w-full h-full object-contain object-left" />
            </div>
          )}
          <div>
            <h1 className={`${printMode === 'receipt' ? 'text-xl' : 'text-3xl'} font-bold tracking-tight text-primary mb-2`}>
              {organization?.name || 'IMO-APP'}
            </h1>
            <p className="text-gray-500 text-xs">{organization?.name ? 'Gestion Immobilière' : 'Gestion Immobilière Moderne'}</p>
            <div className="mt-4 text-xs space-y-1">
              <p>{organization?.address || '123 Rue de l\'Immobilier'}</p>
              <p>{organization?.city ? `${organization.city}, ${organization.country || ''}` : 'Dakar, Sénégal'}</p>
              <p>{organization?.phone || '+221 33 000 00 00'}</p>
              {organization?.email && <p>{organization.email}</p>}
              {organization?.tax_number && <p className="mt-2 font-semibold">IFU: {organization.tax_number}</p>}
              {organization?.registration_number && <p className="font-semibold">RCCM: {organization.registration_number}</p>}
            </div>
          </div>
        </div>

        <div className={`${printMode === 'receipt' ? 'mt-6 w-full' : 'text-right sm:text-right w-full sm:w-auto'}`}>
          <h2 className={`${printMode === 'receipt' ? 'text-sm font-bold border-y py-2 my-4' : 'text-xl font-semibold text-gray-900 mb-1'}`}>
            {payment.status === 'paid' ? 'REÇU DE PAIEMENT' : 'FACTURE'}
          </h2>
          <p className="text-gray-500 font-medium mb-4 text-sm">{payment.invoice_number}</p>
          <div className={`flex ${printMode === 'receipt' ? 'justify-center' : 'justify-end'}`}>
              <div className="bg-white p-1 border rounded-md">
                  <QRCodeComponent value={qrData} size={printMode === 'receipt' ? 60 : 80} />
              </div>
          </div>
        </div>
      </div>

      {printMode === 'standard' && <Separator />}

      {/* Bill To / Info */}
      <div className={`${printMode === 'receipt' ? 'space-y-4 my-6 text-sm border-b pb-6' : 'grid grid-cols-1 sm:grid-cols-2 gap-12 my-10'}`}>
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Locataire</h3>
          <p className={`${printMode === 'receipt' ? 'text-base' : 'text-lg'} font-bold text-gray-900`}>{payment.rental.tenant.first_name} {payment.rental.tenant.last_name}</p>
          <p className="text-gray-600">{payment.rental.tenant.phone}</p>
          {payment.rental.tenant.address && printMode === 'standard' && <p className="text-gray-600 max-w-xs">{payment.rental.tenant.address}</p>}
        </div>

        <div>
          <div className={`${printMode === 'receipt' ? 'space-y-2' : 'grid grid-cols-2 gap-4'}`}>
              <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Date de paiement</h3>
                  <p className="font-semibold">{format(new Date(payment.payment_date), printMode === 'receipt' ? "dd/MM/yyyy" : "dd MMMM yyyy", { locale: fr })}</p>
              </div>
              <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Période</h3>
                  <p className="font-semibold text-xs">
                      {format(new Date(payment.period_start), "dd/MM/yy")} au {format(new Date(payment.period_end), "dd/MM/yy")}
                  </p>
              </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={`${printMode === 'receipt' ? 'mt-4' : 'mt-12'}`}>
        <table className="w-full text-left">
          {printMode === 'standard' && (
              <thead>
              <tr className="border-b border-gray-200">
                  <th className="py-4 text-xs font-bold uppercase tracking-wider text-gray-400">Description</th>
                  <th className="py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-400">Total</th>
              </tr>
              </thead>
          )}
          <tbody className={`${printMode === 'standard' ? 'divide-y divide-gray-100' : ''}`}>
            <tr>
              <td className={`${printMode === 'receipt' ? 'py-2' : 'py-6'}`}>
                <p className={`font-bold text-gray-900 ${printMode === 'receipt' ? 'text-sm' : ''}`}>
                  {payment.type === 'deposit' ? 'Caution' : 'Loyer'} - {payment.rental.property.title}
                </p>
                {printMode === 'standard' && (
                  <p className="text-sm text-gray-500 mt-1">
                      Fréquence: {payment.rental.payment_frequency === 'monthly' ? 'Mensuelle' :
                                 payment.rental.payment_frequency === 'quarterly' ? 'Trimestrielle' :
                                 payment.rental.payment_frequency === 'semiannual' ? 'Semestrielle' :
                                 payment.rental.payment_frequency}
                  </p>
                )}
              </td>
              <td className={`${printMode === 'receipt' ? 'py-2' : 'py-6'} text-right font-semibold text-gray-900 ${printMode === 'receipt' ? 'text-sm' : ''}`}>
                {formatCurrency(payment.amount)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className={`${printMode === 'receipt' ? 'mt-4 border-t pt-4' : 'mt-8 flex justify-end'}`}>
        <div className={`space-y-2 ${printMode === 'standard' ? 'w-full sm:w-64' : 'w-full text-sm'}`}>
          {printMode === 'standard' && (
              <>
                  <div className="flex justify-between text-gray-600">
                      <span>Sous-total</span>
                      <span>{formatCurrency(payment.amount)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                      <span>Taxe (0%)</span>
                      <span>{formatCurrency(0)}</span>
                  </div>
              </>
          )}
          <div className={`flex justify-between ${printMode === 'standard' ? 'border-t border-gray-200 pt-3 text-lg font-bold text-gray-900' : 'font-bold text-base'}`}>
            <span>TOTAL PAYÉ</span>
            <span>{formatCurrency(payment.amount)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={`${printMode === 'receipt' ? 'mt-8 pt-4 border-t border-dashed' : 'mt-20 pt-10 border-t border-gray-100'} text-center`}>
        <p className="text-gray-500 text-[10px]">Merci de votre confiance.</p>
        <p className="text-gray-400 text-[9px] mt-1 italic">Reçu officiel généré électroniquement.</p>
      </div>
    </div>
  )
}
