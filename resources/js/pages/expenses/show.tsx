import { Head } from "@inertiajs/react"
import { Printer } from "lucide-react"
import * as React from "react"

import { ExpenseView } from "@/components/expense-view"
import type { Expense } from "@/components/expense-view"
import { Button } from "@/components/ui/button"
import PrintLayout from "@/layouts/print-layout"

interface Props {
  expense: Expense
  organization?: any
}

export default function Show({ expense, organization }: Props) {
  const handlePrint = () => {
    window.print()
  }

  return (
    <>
      <Head title={`Dépense ${expense.reference}`} />

      <div className="flex flex-col gap-6 p-4 sm:p-8 print:bg-white print:p-0 print:m-0">
        <div className="mx-auto w-full max-w-4xl space-y-6 print:max-w-none print:space-y-0">
          <div className="flex justify-between items-center print:hidden">
            <div className="flex gap-2">
                <Button variant="ghost" asChild>
                    <a href="/expenses">← Retour</a>
                </Button>
            </div>
            <div className="flex gap-2">
                <Button onClick={handlePrint} variant="outline" className="flex items-center gap-2">
                    <Printer className="h-4 w-4" /> Imprimer
                </Button>
            </div>
          </div>

          <div className="bg-white shadow-sm print:shadow-none border border-gray-100 print:border-none rounded-lg overflow-hidden">
            <ExpenseView expense={expense} organization={organization} />
          </div>
        </div>
      </div>
    </>
  )
}

Show.layout = (page: React.ReactNode) => (
    <PrintLayout>
        {page}
    </PrintLayout>
)
