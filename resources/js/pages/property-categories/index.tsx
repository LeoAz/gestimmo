import { Head } from "@inertiajs/react"
import { Edit, Plus, Trash } from "lucide-react"
import * as React from "react"

import { index as propertyCategoriesIndex } from '@/actions/App/Http/Controllers/PropertyCategoryController';
import { DataTable } from "@/components/data-table"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
import Heading from "@/components/heading"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { destroy } from "@/routes/property-categories"
import type { BreadcrumbItem } from "@/types"

import { CategoryForm } from "./category-form"

interface Category {
  id: number
  name: string
  slug: string
  description: string | null
}

interface Props {
  categories: Category[]
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Catégories",
    href: propertyCategoriesIndex().url,
  },
]

export default function Index({ categories }: Props) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
  const [selectedCategory, setSelectedCategory] = React.useState<Category | null>(null)

  const handleCreate = () => {
    setSelectedCategory(null)
    setIsOpen(true)
  }

  const handleEdit = (category: Category) => {
    setSelectedCategory(category)
    setIsOpen(true)
  }

  const handleDelete = (category: Category) => {
    setSelectedCategory(category)
    setIsDeleteOpen(true)
  }

  const columns = [
    { header: "Nom", accessor: "name" as const, sortable: true, sortKey: "name" as const },
    { header: "Description", accessor: (row: Category) => row.description || "-" },
    {
      header: "Actions",
      accessor: (row: Category) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => handleEdit(row)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(row)}>
            <Trash className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
      className: "text-right",
    },
  ]

  return (
    <>
      <Head title="Catégories de biens" />
      <div className="flex flex-col gap-6 p-4">
        <div className="flex items-center justify-between">
          <Heading title="Catégories de biens" description="Gérez les types de biens immobiliers." />
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter une catégorie
          </Button>
        </div>

        <DataTable columns={columns} data={categories} searchKey="name" emptyMessage="Aucune catégorie trouvée." />
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="flex flex-col gap-0 p-0 sm:max-w-xl">
          <div className="overflow-y-auto p-6">
            <DialogHeader>
              <DialogTitle>{selectedCategory ? "Modifier la catégorie" : "Ajouter une catégorie"}</DialogTitle>
              <DialogDescription>
                {selectedCategory
                  ? "Modifiez les informations de la catégorie sélectionnée."
                  : "Remplissez le formulaire pour créer une nouvelle catégorie."}
              </DialogDescription>
            </DialogHeader>
            <CategoryForm
              category={selectedCategory}
              onSuccess={() => setIsOpen(false)}
              onCancel={() => setIsOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        url={selectedCategory ? destroy({ property_category: selectedCategory.id }) : ""}
        title="Supprimer la catégorie"
        description={`Êtes-vous sûr de vouloir supprimer la catégorie "${selectedCategory?.name}" ? Cette action supprimera également tous les biens associés.`}
        onSuccess={() => setSelectedCategory(null)}
      />
    </>
  )
}

Index.layout = {
  breadcrumbs: breadcrumbs,
}
