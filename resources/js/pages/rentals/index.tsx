import { Head, Link } from "@inertiajs/react"
import { Eye, Plus } from "lucide-react"
import * as React from "react"

import { DataTable } from "@/components/data-table"
import Heading from "@/components/heading"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { BreadcrumbItem } from "@/types"

interface Property {
  id: number
  title: string
  city: string | null
  price: string | null
}

interface Tenant {
  id: number
  first_name: string
  last_name: string
  phone: string
}

interface Rental {
  id: number
  property_id: number
  tenant_id: number
  deposit_amount: string
  start_date: string
  status: 'active' | 'completed' | 'cancelled'
  property: Property
  tenant: Tenant
}

interface Props {
  rentals: Rental[]
  filters: {
    search?: string
    status?: string
  }
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Locations",
    href: "/rentals",
  },
]

export default function Index({ rentals }: Props) {
  const columns = [
    {
        header: "Locataire",
        accessor: (row: Rental) => (
            <Link
                href={`/tenants/${row.tenant_id}`}
                className="font-medium text-primary hover:underline"
            >
                {row.tenant.first_name} {row.tenant.last_name}
            </Link>
        )
    },
    {
        header: "Bien",
        accessor: (row: Rental) => row.property.title
    },
    {
        header: "Téléphone",
        accessor: (row: Rental) => row.tenant.phone
    },
    {
      header: "Date début",
      accessor: (row: Rental) => new Date(row.start_date).toLocaleDateString('fr-FR'),
      sortable: true,
      sortKey: "start_date"
    },
    {
      header: "Caution",
      accessor: (row: Rental) =>
        row.deposit_amount ? new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF" }).format(Number(row.deposit_amount)) : "-",
    },
    {
      header: "Statut",
      accessor: (row: Rental) => {
        const variants = {
          active: "default",
          completed: "secondary",
          cancelled: "destructive",
        } as const

        const labels = {
          active: "En cours",
          completed: "Terminée",
          cancelled: "Annulée",
        }

        return <Badge variant={variants[row.status]}>{labels[row.status]}</Badge>
      },
    },
    {
      header: "Actions",
      accessor: (row: Rental) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild title="Voir détails">
            <Link href={`/rentals/${row.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      ),
    },
  ]

  return (
    <>
      <Head title="Locations" />

      <div className="flex h-full flex-1 flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <Heading title="Locations" description="Liste des contrats de location en cours et passés." />
          <Button asChild>
            <Link href="/rentals/create">
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle location
            </Link>
          </Button>
        </div>

        <DataTable
            data={rentals}
            columns={columns}
            searchKey={(row) => `${row.tenant.first_name} ${row.tenant.last_name} ${row.property.title} ${row.tenant.phone}`}
            filters={[
                {
                    label: "Statut",
                    key: "status",
                    options: [
                        { label: "En cours", value: "active" },
                        { label: "Terminée", value: "completed" },
                        { label: "Annulée", value: "cancelled" },
                    ]
                }
            ]}
        />
      </div>
    </>
  )
}

Index.layout = {
  breadcrumbs: breadcrumbs,
}
