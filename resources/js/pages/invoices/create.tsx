import { Head, router, useForm } from "@inertiajs/react"
import { toast } from "sonner"
import * as React from "react"

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

interface Props {
  rentals: Rental[]
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Factures", href: "/invoices" },
  { title: "Nouvelle facture", href: "/invoices/create" },
]

export default function Create({ rentals }: Props) {
  const { post, processing, errors } = useForm({})

  const handleSubmit = (data: any) => {
    router.post("/invoices", data, {
      onSuccess: () => {
        toast.success("Facture créée avec succès")
      }
    })
  }

  return (
    <>
      <Head title="Créer une facture" />

      <div className="flex h-full flex-1 flex-col gap-4 p-4 lg:p-8">
        <div className="flex items-center justify-between">
          <Heading
            title="Créer une nouvelle facture"
            description="Générez une facture pour une location spécifique."
          />
        </div>

        <Card className="border-none shadow-none bg-transparent sm:bg-card sm:border sm:shadow-sm">
          <CardContent className="p-0 sm:p-6">
            <InvoiceForm
              rentals={rentals}
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

Create.layout = (page: any) => <AppLayout children={page} breadcrumbs={breadcrumbs} />
