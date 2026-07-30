import { Link, router } from "@inertiajs/react"
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Home,
  Key as KeyIcon,
  Maximize,
  Pencil,
  Plus,
  Search,
  Trash2,
  Bed,
  ChefHat
} from "lucide-react"
import * as React from "react"
import { toast } from "sonner"
import { destroy as destroyPropertyAction } from '@/actions/App/Http/Controllers/PropertyController'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Apartment, Property } from "../types"

interface UnitsSectionProps {
  property: Property
  onAddApartment: () => void
  onEditApartment: (apt: Apartment) => void
  formatCurrency: (value: string | number | null) => string
  statusLabels: Record<string, string>
}

export function UnitsSection({
  property,
  onAddApartment,
  onEditApartment,
  formatCurrency,
  statusLabels
}: UnitsSectionProps) {
  const [apartmentsSearch, setApartmentsSearch] = React.useState("")
  const [apartmentsPage, setApartmentsPage] = React.useState(1)
  const apartmentsItemsPerPage = 5

  const filteredApartments = React.useMemo(() => {
    return property.apartments.filter((apt) =>
      apt.title.toLowerCase().includes(apartmentsSearch.toLowerCase())
    )
  }, [property.apartments, apartmentsSearch])

  const paginatedApartments = React.useMemo(() => {
    const startIndex = (apartmentsPage - 1) * apartmentsItemsPerPage

    return filteredApartments.slice(startIndex, startIndex + apartmentsItemsPerPage)
  }, [filteredApartments, apartmentsPage])

  const apartmentsTotalPages = Math.ceil(filteredApartments.length / apartmentsItemsPerPage)

  const handleDeleteApartment = (apt: Apartment) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet appartement ?")) {
      router.delete(destroyPropertyAction({ property: apt.id }).url, {
        onSuccess: () => {
          toast.success("Appartement supprimé avec succès")
        }
      })
    }
  }

  if (property.parent_id !== null || property.category.slug === 'terrain' || property.category.slug === 'terrain-vide' || property.type === 'TERRAIN VIDE') {
    return null
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-2">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-500" />
            Unités & Appartements
          </h2>
          <Badge variant="secondary">{property.apartments.length} unités</Badge>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une unité..."
              className="pl-9"
              value={apartmentsSearch}
              onChange={(e) => {
                setApartmentsSearch(e.target.value)
                setApartmentsPage(1)
              }}
            />
          </div>
          <Button size="sm" onClick={onAddApartment}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter
          </Button>
        </div>
      </div>

      <div className="grid gap-3">
        {paginatedApartments.length > 0 ? (
          <>
            {paginatedApartments.map((apt) => (
              <div key={apt.id} className="group flex items-center justify-between rounded-lg border p-4 hover:bg-muted/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <Home className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">{apt.title}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1"><Maximize className="h-3 w-3" /> Étage {apt.floor_number}</span>
                      <span className="flex items-center gap-1"><Bed className="h-3 w-3" /> {apt.bedrooms_count || 0} ch</span>
                      <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {apt.living_rooms_count || 0} sal</span>
                      <span className="flex items-center gap-1"><Maximize className="h-3 w-3" /> {apt.balconies_count || 0} bal</span>
                      <span className="flex items-center gap-1"><ChefHat className="h-3 w-3" /> {apt.kitchens_count || 0} cuis</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(apt.price)}</p>
                    <Badge variant={apt.status === 'available' ? 'outline' : 'secondary'} className="text-[10px] h-5 px-1.5">
                      {statusLabels[apt.status] || apt.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" asChild title="Voir détails">
                      <Link href={`/properties/${apt.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onEditApartment(apt)} title="Modifier">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteApartment(apt)} title="Supprimer" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    {apt.status === 'available' && (
                      <Button variant="ghost" size="icon" asChild title="Nouvelle location">
                        <Link href={`/rentals/create?property_id=${apt.id}`}>
                          <KeyIcon className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {apartmentsTotalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setApartmentsPage(p => Math.max(1, p - 1))}
                  disabled={apartmentsPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {apartmentsPage} sur {apartmentsTotalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setApartmentsPage(p => Math.min(apartmentsTotalPages, p + 1))}
                  disabled={apartmentsPage === apartmentsTotalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <p className="text-center py-8 text-muted-foreground italic border rounded-lg border-dashed">
            {apartmentsSearch ? "Aucune unité ne correspond à votre recherche." : "Aucun appartement enregistré pour ce bien."}
          </p>
        )}
      </div>
    </section>
  )
}
