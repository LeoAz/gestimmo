import { Head, Link, useForm } from "@inertiajs/react"
import { Eye, Pencil, Plus, Trash2, User } from "lucide-react"
import * as React from "react"

import {
    create as createTenant,
    destroy as destroyTenant,
    edit as editTenant,
    show as showTenant,
} from "@/actions/App/Http/Controllers/TenantController"
import { DataTable } from "@/components/data-table"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
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
  const [deleteId, setDeleteId] = React.useState<number | null>(null)
  const { delete: destroy, processing } = useForm()

  const handleDelete = () => {
    if (deleteId) {
      destroy(destroyTenant(deleteId), {
        onSuccess: () => setDeleteId(null),
      })
    }
  }

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
        header: "Locations actives",
        accessor: (row: Tenant) => (
            <span className={row.rentals_count > 0 ? "text-green-600 font-semibold" : "text-muted-foreground"}>
                {row.rentals_count}
            </span>
        )
    },
    {
      header: "Actions",
      accessor: (row: Tenant) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild title="Voir l'historique">
            <Link href={showTenant(row.id)}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild title="Modifier">
            <Link href={editTenant(row.id)}>
              <Pencil className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteId(row.id)}
            disabled={row.rentals_count > 0}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            title={row.rentals_count > 0 ? "Impossible de supprimer un locataire ayant une location active" : "Supprimer"}
          >
            <Trash2 className="h-4 w-4" />
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
          <Button asChild>
            <Link href={createTenant()}>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau locataire
            </Link>
          </Button>
        </div>

        <DataTable
            data={tenants}
            columns={columns}
            searchKey={(row) => `${row.first_name} ${row.last_name} ${row.phone}`}
        />
      </div>

      <DeleteConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Supprimer le locataire"
        description="Êtes-vous sûr de vouloir supprimer ce locataire ? Cette action est irréversible."
        loading={processing}
      />
    </>
  )
}

Index.layout = {
  breadcrumbs: breadcrumbs,
}
