import { Head, Link } from "@inertiajs/react"
import { Eye, User } from "lucide-react"
import * as React from "react"

import { DataTable } from "@/components/data-table"
import Heading from "@/components/heading"
import { Button } from "@/components/ui/button"
import type { BreadcrumbItem } from "@/types"

interface Tenant {
  id: number
  first_name: string
  last_name: string
  phone: string
  rentals_count: number
}

interface Props {
  tenants: Tenant[]
  filters: {
    search?: string
  }
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Locataires",
    href: "/tenants",
  },
]

export default function Index({ tenants }: Props) {
  const columns = [
    {
        header: "Nom complet",
        accessor: (row: Tenant) => (
            <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="h-4 w-4" />
                </div>
                <span className="font-medium">
                    {row.first_name} {row.last_name}
                </span>
            </div>
        )
    },
    {
        header: "Téléphone",
        accessor: (row: Tenant) => row.phone
    },
    {
        header: "Nombre de locations",
        accessor: (row: Tenant) => row.rentals_count
    },
    {
      header: "Actions",
      accessor: (row: Tenant) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild title="Voir l'historique">
            <Link href={`/tenants/${row.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      ),
    },
  ]

  return (
    <>
      <Head title="Locataires" />

      <div className="flex h-full flex-1 flex-col gap-4 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Heading title="Locataires" description="Gestion et historique des locataires." />
        </div>

        <DataTable
            data={tenants}
            columns={columns}
            searchKey={(row) => `${row.first_name} ${row.last_name} ${row.phone}`}
        />
      </div>
    </>
  )
}

Index.layout = {
  breadcrumbs: breadcrumbs,
}
