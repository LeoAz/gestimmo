import { Head, Link } from "@inertiajs/react"
import { ArrowLeft, Download, Printer } from "lucide-react"
import * as React from "react"

import { InvoiceView } from "@/components/invoice-view"
import type { Invoice } from "@/components/invoice-view"
import { Button } from "@/components/ui/button"
import AppLayout from "@/layouts/app-layout"
import type { BreadcrumbItem } from "@/types"

interface Props {
  invoice: Invoice
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Factures", href: "/invoices" },
  { title: "Consultation", href: "#" },
]

export default function Show({ invoice }: Props) {
  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = () => {
    // On change temporairement le titre du document pour que le nom du fichier PDF soit correct lors de l'enregistrement
    const originalTitle = document.title;
    document.title = `Facture_${invoice.invoice_number}`;

    window.print();

    // On restaure le titre original après un court délai pour laisser le temps au navigateur de capturer le titre
    setTimeout(() => {
      document.title = originalTitle;
    }, 100);
  }

  return (
    <>
      <Head title={`Facture ${invoice.invoice_number}`} />

      <div className="flex flex-col gap-6 p-4 sm:p-8 print:p-0 print:block">
        <div className="mx-auto w-full max-w-5xl space-y-6 print:max-w-none print:space-y-0">
          <div className="flex justify-between items-center print:hidden">
            <Link href="/invoices">
              <Button variant="ghost" className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Retour
              </Button>
            </Link>
            <div className="flex gap-2">
                <Button onClick={handlePrint} variant="outline" className="gap-2">
                    <Printer className="h-4 w-4" /> Imprimer
                </Button>
                <Button onClick={handleDownloadPDF} variant="default" className="gap-2">
                    <Download className="h-4 w-4" /> Télécharger en PDF
                </Button>
            </div>
          </div>

          <div className="bg-white shadow-sm border rounded-lg overflow-hidden print:shadow-none print:border-none print:rounded-none">
            <InvoiceView invoice={invoice} />
          </div>
        </div>
      </div>
    </>
  )
}

Show.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>
        {page}
    </AppLayout>
)
