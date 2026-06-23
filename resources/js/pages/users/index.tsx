import { Head, Link, usePage } from "@inertiajs/react"
import { Pencil, Plus, Trash2, User as UserIcon } from "lucide-react"
import * as React from "react"

import {
    create as createUser,
    destroy as destroyUser,
    edit as editUser,
} from "@/actions/App/Http/Controllers/UserController"
import { DataTable } from "@/components/data-table"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
import Heading from "@/components/heading"
import { Button } from "@/components/ui/button"
import type { BreadcrumbItem } from "@/types"

interface User {
  id: number
  name: string
  email: string
  created_at: string
}

interface Props {
  users: User[]
  filters: {
    search?: string
  }
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Utilisateurs",
    href: "/users",
  },
]

export default function Index({ users }: Props) {
  const [deleteId, setDeleteId] = React.useState<number | null>(null)
  const { auth } = usePage().props as any

  const columns = [
    {
        header: "Nom",
        accessor: (row: User) => (
            <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <UserIcon className="h-4 w-4" />
                </div>
                <span className="font-medium">
                    {row.name}
                </span>
            </div>
        )
    },
    {
        header: "Email",
        accessor: (row: User) => row.email
    },
    {
        header: "Date d'ajout",
        accessor: (row: User) => new Date(row.created_at).toLocaleDateString('fr-FR')
    },
    {
      header: "Actions",
      accessor: (row: User) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild title="Modifier">
            <Link href={editUser(row.id)}>
              <Pencil className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteId(row.id)}
            disabled={row.id === auth.user.id}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            title={row.id === auth.user.id ? "Vous ne pouvez pas supprimer votre propre compte" : "Supprimer"}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <>
      <Head title="Utilisateurs" />

      <div className="flex h-full flex-1 flex-col gap-4 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Heading title="Utilisateurs" description="Gestion des comptes utilisateurs du système." />
          <Button asChild>
            <Link href={createUser()}>
              <Plus className="mr-2 h-4 w-4" />
              Nouvel utilisateur
            </Link>
          </Button>
        </div>

        <DataTable
            data={users}
            columns={columns}
            searchKey={(row) => `${row.name} ${row.email}`}
        />
      </div>

      <DeleteConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        url={deleteId ? destroyUser(deleteId).url : ""}
        title="Supprimer l'utilisateur"
        description="Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible."
      />
    </>
  )
}

Index.layout = {
  breadcrumbs: breadcrumbs,
}
