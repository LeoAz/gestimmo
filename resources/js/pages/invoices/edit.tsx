import * as React from "react"
import { Head, router, useForm } from "@inertiajs/react"
import { toast } from "sonner"

import Heading from "@/components/heading"
import { Card, CardContent } from "@/components/ui/card"
import AppLayout from "@/layouts/app-layout"
import type { BreadcrumbItem } from "@/types"
import { InvoiceForm } from "./invoice-form"

interface Rental {
  id: number
  property: { title: string }
  tenant: { first_name: string; last_name: string }
  rent_amount: string
}

interface InvoiceItem {
  id: number
  designation: string
  period: string | null
  months_count: number
  total: number
  unit_price?: number
  quantity?: number
}

interface Invoice {
  id: number
  rental_id: number
  date: string
  due_date: string | null
  type: string
  notes: string | null
  items: InvoiceItem[]
}

interface Props {
  invoice: Invoice
  rentals: Rental[]
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Factures", href: "/invoices" },
  { title: "Modifier la facture", href: "#" },
]

export default function Edit({ invoice, rentals }: Props) {
  const { patch, processing, errors } = useForm({})

  const handleSubmit = (data: any) => {
    router.patch(`/invoices/${invoice.id}`, data, {
      onSuccess: () => {
        toast.success("Facture mise à jour avec succès")
      }
    })
  }

  return (
    <>
      <Head title={`Modifier la facture ${invoice.id}`} />

      <div className="flex h-full flex-1 flex-col gap-4 p-4 lg:p-8">
        <div className="flex items-center justify-between">
          <Heading
            title="Modifier la facture"
            description={`Modification de la facture #${invoice.id}`}
          />
        </div>

        <Card className="border-none shadow-none bg-transparent sm:bg-card sm:border sm:shadow-sm">
          <CardContent className="p-0 sm:p-6">
            <InvoiceForm
              rentals={rentals}
              initialData={invoice}
              onSubmit={handleSubmit}
              processing={processing}
              errors={errors}
            />
          </CardContent>
        </Card>
      </div>
    </>
  )
}

Edit.layout = (page: any) => <AppLayout children={page} breadcrumbs={breadcrumbs} />
