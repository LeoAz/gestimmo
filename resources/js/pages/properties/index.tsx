import { Head, Link } from "@inertiajs/react"
import { Edit, Eye, Plus, Trash } from "lucide-react"
import * as React from "react"

import { index as propertiesIndex, show as propertiesShow } from '@/actions/App/Http/Controllers/PropertyController';
import { DataTable } from "@/components/data-table"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
import Heading from "@/components/heading"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { destroy } from "@/routes/properties"
import type { BreadcrumbItem } from "@/types"

import { PropertyForm } from "./property-form"

interface Property {
  id: number
  property_category_id: number
  parent_id: number | null
  title: string
  description: string | null
  address: string | null
  city: string | null
  floor_number: number | null
  price: string | null
  surface_area: string | null
  rooms_count: number | null
  bedrooms_count: number | null
  bathrooms_count: number | null
  living_rooms_count: number | null
  has_kitchen: boolean
  has_solar_panels: boolean
  has_generator: boolean
  status: 'available' | 'sold' | 'rented'
  category: {
    id: number
    name: string
    slug: string
  }
  apartments?: any[]
}

interface Category {
  id: number
  name: string
  slug: string
}

interface Props {
  properties: Property[]
  categories: Category[]
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Biens immobiliers",
    href: propertiesIndex().url,
  },
]

export default function Index({ properties, categories }: Props) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
  const [selectedProperty, setSelectedProperty] = React.useState<Property | null>(null)

  const handleCreate = () => {
    setSelectedProperty(null)
    setIsOpen(true)
  }

  const handleEdit = (property: Property) => {
    setSelectedProperty(property)
    setIsOpen(true)
  }

  const handleDelete = (property: Property) => {
    setSelectedProperty(property)
    setIsDeleteOpen(true)
  }

  const columns = [
    { header: "Titre", accessor: "title" as const, sortable: true, sortKey: "title" as const },
    { header: "Catégorie", accessor: (row: Property) => row.category.name },
    {
      header: "Détails",
      accessor: (row: Property) => {
        if (row.category.slug === 'villa' && row.type) {
          return row.type
        }

        if (row.apartments && row.apartments.length > 0) {
          return `${row.apartments.length} unités`
        }

        return "-"
      }
    },
    { header: "Ville", accessor: "city" as const, sortable: true, sortKey: "city" as const },
    {
      header: "Prix",
      accessor: (row: Property) =>
        row.price ? new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF" }).format(Number(row.price)) : "-",
      sortable: true,
      sortKey: "price",
    },
    {
      header: "Statut",
      accessor: (row: Property) => {
        const variants = {
          available: "default",
          sold: "destructive",
          rented: "secondary",
        } as const
        const labels = {
          available: "Disponible",
          sold: "Vendu",
          rented: "Loué",
        }

        return <Badge variant={variants[row.status]}>{labels[row.status]}</Badge>
      },
    },
    {
      header: "Actions",
      accessor: (row: Property) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href={propertiesShow(row.id).url}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
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
          <Head title="Biens immobiliers" />
          <div className="flex flex-col gap-6 p-4">
              <div className="flex items-center justify-between">
                  <Heading
                      title="Biens immobiliers"
                      description="Gérez votre parc immobilier."
                  />
                  <Button onClick={handleCreate}>
                      <Plus className="mr-2 h-4 w-4" />
                      Ajouter un bien
                  </Button>
              </div>

              <DataTable
                  columns={columns}
                  data={properties}
                  searchKey={(row) => `${row.title} ${row.city || ""} ${row.category.name}`}
                  filters={[
                      {
                          label: "Catégorie",
                          key: "property_category_id",
                          options: categories.map(c => ({ label: c.name, value: String(c.id) }))
                      },
                      {
                          label: "Statut",
                          key: "status",
                          options: [
                              { label: "Disponible", value: "available" },
                              { label: "Vendu", value: "sold" },
                              { label: "Loué", value: "rented" },
                          ]
                      }
                  ]}
                  emptyMessage="Aucun bien trouvé."
              />
          </div>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogContent className="flex w-full max-w-[800px] flex-col gap-0 p-0 sm:max-w-3xl">
                  <div className="overflow-y-auto p-6">
                      <DialogHeader>
                          <DialogTitle>
                              {selectedProperty
                                  ? 'Modifier le bien'
                                  : 'Ajouter un bien'}
                          </DialogTitle>
                          <DialogDescription>
                              Remplissez les informations du bien immobilier
                              ci-dessous.
                          </DialogDescription>
                      </DialogHeader>
                      <PropertyForm
                          property={selectedProperty}
                          categories={categories}
                          onSuccess={() => setIsOpen(false)}
                          onCancel={() => setIsOpen(false)}
                      />
                  </div>
              </DialogContent>
          </Dialog>

          <DeleteConfirmDialog
              open={isDeleteOpen}
              onOpenChange={setIsDeleteOpen}
              url={
                  selectedProperty
                      ? destroy({ property: selectedProperty.id })
                      : ''
              }
              title="Supprimer le bien immobilier"
              description={`Êtes-vous sûr de vouloir supprimer le bien "${selectedProperty?.title}" ? Cette action supprimera également tous les appartements liés s'il s'agit d'un immeuble.`}
              onSuccess={() => setSelectedProperty(null)}
          />
      </>
  );
}

Index.layout = {
  breadcrumbs: breadcrumbs,
}
