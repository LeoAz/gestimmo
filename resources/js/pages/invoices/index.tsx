import { router } from "@inertiajs/react"
import { Head, Link } from "@inertiajs/react"
import { format } from "date-fns"
import { Edit2, Eye, Plus, Trash2 } from "lucide-react"
import * as React from "react"

import { DataTable } from "@/components/data-table"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
import Heading from "@/components/heading"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import AppLayout from "@/layouts/app-layout"
import type { BreadcrumbItem } from "@/types"

interface InvoiceItem {
  id?: number
  designation: string
  period: string | null
  months_count: number
  unit_price?: number
  quantity?: number
  total: number
}

interface Invoice {
  id: number
  invoice_number: string
  date: string
  due_date: string | null
  type: string
  amount_ht: string
  total_amount: string
  status: string
  notes: string | null
  rental: {
    id: number
    property: {
      title: string
      parent?: { title: string }
    }
    tenant: { first_name: string; last_name: string; phone: string; address: string | null }
  }
  items: InvoiceItem[]
}

interface Rental {
  id: number
  property: { title: string }
  tenant: { first_name: string; last_name: string }
  rent_amount: string
}

interface Category {
  id: number
  name: string
}

interface Property {
  id: number
  title: string
}

interface Props {
  invoices: {
      data: Invoice[]
      links: any[]
  }
  rentals: Rental[]
  categories: Category[]
  properties: Property[]
  filters: {
      category_id?: string
      status?: string
      property_id?: string
  }
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Factures", href: "/invoices" },
]

export default function Index({ invoices, categories, properties, filters }: Props) {
  const [deleteId, setDeleteId] = React.useState<number | null>(null)

  const handleFilterChange = (newFilters: Record<string, string>) => {
      router.get('/invoices', newFilters, {
          preserveState: true,
          replace: true
      })
  }

  const columns = [
    {
      header: "N° Facture",
      accessor: (row: Invoice) => (
        <span className="font-mono font-medium">{row.invoice_number}</span>
      )
    },
    {
      header: "Date",
      accessor: (row: Invoice) => format(new Date(row.date), "dd/MM/yyyy")
    },
    {
      header: "Locataire",
      accessor: (row: Invoice) => `${row.rental.tenant.first_name} ${row.rental.tenant.last_name}`
    },
    {
      header: "Bien",
      accessor: (row: Invoice) => (
        <div className="flex flex-col">
            {row.rental.property.parent && (
                <span className="text-[10px] text-muted-foreground uppercase leading-tight">
                    {row.rental.property.parent.title}
                </span>
            )}
            <span className="font-medium">{row.rental.property.title}</span>
        </div>
      )
    },
    {
        header: "Type",
        accessor: (row: Invoice) => row.type
    },
    {
      header: "Montant",
      accessor: (row: Invoice) => (
        <span className="font-semibold">
          {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", minimumFractionDigits: 0 }).format(parseFloat(row.total_amount))}
        </span>
      )
    },
    {
      header: "Statut",
      accessor: (row: Invoice) => (
        <Badge variant={row.status === 'paid' ? 'success' : 'outline'}>
          {row.status === 'paid' ? 'Payée' : 'En attente'}
        </Badge>
      )
    },
    {
      header: "Actions",
      accessor: (row: Invoice) => (
        <div className="flex items-center gap-2">
          <Link href={`/invoices/${row.id}`}>
            <Button variant="ghost" size="icon">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/invoices/${row.id}/edit`}>
            <Button variant="ghost" size="icon">
              <Edit2 className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteId(row.id)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <>
      <Head title="Factures" />

      <div className="flex h-full flex-1 flex-col gap-4 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Heading title="Factures" description="Gestion des factures de location." />
          <Link href="/invoices/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle facture
            </Button>
          </Link>
        </div>

        <DataTable
            data={invoices.data}
            columns={columns}
            searchKey={(row) => `${row.invoice_number} ${row.rental.tenant.first_name} ${row.rental.tenant.last_name}`}
            initialFilters={filters}
            onFilterChange={handleFilterChange}
            filters={[
                {
                    label: "Catégorie",
                    key: "category_id",
                    options: categories.map(c => ({ label: c.name, value: c.id.toString() }))
                },
                {
                    label: "Bien immobilier",
                    key: "property_id",
                    options: properties.map(p => ({ label: p.title, value: p.id.toString() }))
                },
                {
                    label: "Statut",
                    key: "status",
                    options: [
                        { label: "Payée", value: "paid" },
                        { label: "En attente", value: "pending" },
                    ]
                }
            ]}
        />
      </div>

      <DeleteConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        url={deleteId ? `/invoices/${deleteId}` : ""}
        title="Supprimer la facture"
        description="Êtes-vous sûr de vouloir supprimer cette facture ? Cette action est irréversible."
      />
    </>
  )
}

Index.layout = (page: any) => <AppLayout children={page} breadcrumbs={breadcrumbs} />
