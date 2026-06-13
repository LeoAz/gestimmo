import { format } from "date-fns"
import { fr } from "date-fns/locale"
import * as React from "react"
import { Separator } from "@/components/ui/separator"

export interface ExpenseItem {
    id: number
    description: string
    quantity: string | number
    unit_price: string | number
    total: string | number
}

export interface Expense {
    id: number
    reference: string
    date: string
    provider: string
    total_amount: string | number
    notes: string | null
    property: {
        title: string
    }
    items: ExpenseItem[]
}

interface Props {
    expense: Expense
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

export function ExpenseView({ expense, organization }: Props) {
    const formatCurrency = (amount: string | number) => {
        return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF" }).format(Number(amount))
    }

    return (
        <div className="bg-white p-4 sm:p-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-8 mb-12">
                <div className="flex flex-col gap-4">
                    {organization?.logo_url && (
                        <div className="w-24 h-24 overflow-hidden rounded mb-2">
                            <img src={organization.logo_url} alt="Logo" className="w-full h-full object-contain object-left" />
                        </div>
                    )}
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-primary mb-2">
                            {organization?.name || 'IMO-APP'}
                        </h1>
                        <p className="text-gray-500 text-xs">Gestion Immobilière</p>
                        <div className="mt-4 text-xs space-y-1">
                            <p>{organization?.address || '123 Rue de l\'Immobilier'}</p>
                            <p>{organization?.city ? `${organization.city}, ${organization.country || ''}` : 'Dakar, Sénégal'}</p>
                            <p>{organization?.phone || '+221 33 000 00 00'}</p>
                            {organization?.email && <p>{organization.email}</p>}
                        </div>
                    </div>
                </div>

                <div className="text-right sm:text-right w-full sm:w-auto">
                    <h2 className="text-xl font-semibold text-gray-900 mb-1">
                        FICHE DE DÉPENSE
                    </h2>
                    <p className="text-gray-500 font-medium mb-4 text-sm">{expense.reference}</p>
                    <div className="flex justify-end">
                        <div className="text-left bg-gray-50 p-3 rounded-md border text-sm">
                            <p><span className="text-gray-400 uppercase text-[10px] font-bold">Date:</span> {format(new Date(expense.date), "dd MMMM yyyy", { locale: fr })}</p>
                            <p><span className="text-gray-400 uppercase text-[10px] font-bold">Bien:</span> {expense.property?.title || 'N/A'}</p>
                        </div>
                    </div>
                </div>
            </div>

            <Separator />

            {/* Provider Info */}
            <div className="my-10">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Prestataire</h3>
                <p className="text-lg font-bold text-gray-900">{expense.provider}</p>
            </div>

            {/* Table */}
            <div className="mt-12">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-gray-200">
                            <th className="py-4 text-xs font-bold uppercase tracking-wider text-gray-400">Description</th>
                            <th className="py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-400">Qté</th>
                            <th className="py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-400">P.U</th>
                            <th className="py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-400">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {expense.items.map((item) => (
                            <tr key={item.id}>
                                <td className="py-6">
                                    <p className="font-medium text-gray-900">{item.description}</p>
                                </td>
                                <td className="py-6 text-right text-gray-600">
                                    {Number(item.quantity)}
                                </td>
                                <td className="py-6 text-right text-gray-600">
                                    {formatCurrency(item.unit_price)}
                                </td>
                                <td className="py-6 text-right font-semibold text-gray-900">
                                    {formatCurrency(item.total)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Totals */}
            <div className="mt-8 flex justify-end">
                <div className="space-y-2 w-full sm:w-64">
                    <div className="flex justify-between border-t border-gray-200 pt-3 text-lg font-bold text-gray-900">
                        <span>MONTANT TOTAL</span>
                        <span>{formatCurrency(expense.total_amount)}</span>
                    </div>
                </div>
            </div>

            {/* Notes */}
            {expense.notes && (
                <div className="mt-12 p-4 bg-gray-50 rounded-md border border-dashed">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Notes / Commentaires</h3>
                    <p className="text-sm text-gray-600 italic">{expense.notes}</p>
                </div>
            )}

            {/* Footer */}
            <div className="mt-20 pt-10 border-t border-gray-100 text-center">
                <p className="text-gray-400 text-[9px] mt-1 italic">Fiche de dépense générée électroniquement par IMO-APP.</p>
            </div>
        </div>
    )
}
