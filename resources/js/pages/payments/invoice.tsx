import { Head } from "@inertiajs/react"
import { Download, Printer } from "lucide-react"
import * as React from "react"

import { InvoiceView } from "@/components/invoice-view"
import type { Payment } from "@/components/invoice-view"
import { Button } from "@/components/ui/button"
import AppLayout from "@/layouts/app-layout"

interface Props {
  payment: Payment
}

export default function Invoice({ payment }: Props) {
  const [printMode, setPrintMode] = React.useState<"standard" | "receipt">("standard")

  const handlePrint = () => {
    window.print()
  }

  return (
    <>
      <Head title={`Facture ${payment.invoice_number}`} />

      <div className="flex flex-col gap-6 p-4 sm:p-8 print:bg-white print:p-0">
        <div className="mx-auto w-full max-w-4xl space-y-6">
          <div className="flex justify-between items-center print:hidden">
            <div className="flex gap-2 bg-white p-1 rounded-lg border shadow-sm">
                <Button
                    variant={printMode === 'standard' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setPrintMode('standard')}
                >
                    Format Facture
                </Button>
                <Button
                    variant={printMode === 'receipt' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setPrintMode('receipt')}
                >
                    Format Ticket
                </Button>
            </div>
            <div className="flex gap-2">
                <Button onClick={handlePrint} variant="outline" className="flex items-center gap-2">
                    <Printer className="h-4 w-4" /> Imprimer
                </Button>
                <Button onClick={handlePrint} variant="outline" className="flex items-center gap-2">
                    <Download className="h-4 w-4" /> PDF
                </Button>
            </div>
          </div>

          <div className="bg-white shadow-sm print:shadow-none border border-gray-100 print:border-none rounded-lg overflow-hidden">
            <InvoiceView payment={payment} printMode={printMode} />
          </div>
        </div>
      </div>
    </>
  )
}

Invoice.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: "Factures & Reçus", href: "/payments" },
            { title: "Facture", href: "#" },
        ]}
    >
        {page}
    </AppLayout>
)
