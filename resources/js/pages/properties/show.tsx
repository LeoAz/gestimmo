import { Head, Link } from "@inertiajs/react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import {
  ArrowLeft,
  MapPin,
  Bed,
  Bath,
  ChefHat,
  Building2,
  Maximize,
  History,
  Clock,
  Printer,
  CheckCircle2,
  Calendar,
  Search,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import * as React from "react"

import { index as propertiesIndex } from '@/actions/App/Http/Controllers/PropertyController'
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { TableCell, TableRow } from "@/components/ui/table"
import AppLayout from "@/layouts/app-layout"

import { ApartmentModal } from "./partials/apartment-modal"
import { UnitsSection } from "./partials/units-section"
import { PropertyForm } from "./property-form"
import type { Apartment, Property, Rental } from "./types"

interface Props {
  property: Property
  rentals: Rental[]
  categories: {
    id: number
    name: string
    slug: string
  }[]
}

export default function Show({ property, rentals, categories }: Props) {
  const [isApartmentModalOpen, setIsApartmentModalOpen] = React.useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false)
  const [selectedApartment, setSelectedApartment] = React.useState<Apartment | null>(null)

  // Rentals state
  const [rentalsSearch, setRentalsSearch] = React.useState("")
  const [rentalsPage, setRentalsPage] = React.useState(1)
  const rentalsItemsPerPage = 4

  const formatCurrency = (value: string | number | null) => {
    if (value === null) {
      return "-"
    }

    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF" }).format(Number(value))
  }

  const statusLabels = {
    available: "Disponible",
    sold: "Vendu",
    rented: "Loué",
  }

  const statusVariants = {
    available: "default",
    sold: "destructive",
    rented: "secondary",
  } as const

  const activeRentals = rentals.filter((r) => r.status === 'active')

  const filteredRentals = React.useMemo(() => {
    return activeRentals.filter((rental) => {
      const fullName = `${rental.tenant.first_name} ${rental.tenant.last_name}`.toLowerCase()

      return fullName.includes(rentalsSearch.toLowerCase())
    })
  }, [activeRentals, rentalsSearch])

  const paginatedRentals = React.useMemo(() => {
    const startIndex = (rentalsPage - 1) * rentalsItemsPerPage

    return filteredRentals.slice(startIndex, startIndex + rentalsItemsPerPage)
  }, [filteredRentals, rentalsPage])

  const rentalsTotalPages = Math.ceil(filteredRentals.length / rentalsItemsPerPage)

  const allPayments = React.useMemo(() => {
    return rentals
      .flatMap((r) =>
        r.payments.map((p) => ({
          ...p,
          tenant_name: `${r.tenant.first_name} ${r.tenant.last_name}`,
          rental_id: r.id,
        })),
      )
      .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
  }, [rentals])

  const handleEditApartment = (apt: Apartment) => {
    setSelectedApartment(apt)
    setIsApartmentModalOpen(true)
  }

  const rentalColumns = [
    {
      header: "Locataire",
      accessor: (row: any) => `${row.tenant.first_name} ${row.tenant.last_name}`,
      sortable: true,
      sortKey: "tenant" as any
    },
    {
      header: "Période",
      accessor: (row: any) => `${format(new Date(row.start_date), "dd/MM/yy")} au ${row.status === 'completed' ? (row.next_payment_date ? format(new Date(row.next_payment_date), "dd/MM/yy") : "-") : "Présent"}`,
    },
    {
      header: "Loyer",
      accessor: (row: any) => formatCurrency(row.rent_amount),
      sortable: true,
      sortKey: "rent_amount" as any,
      className: "text-right font-bold"
    },
    {
      header: "Statut",
      accessor: (row: any) => (
        <div className="text-center">
          <Badge variant={row.status === 'active' ? 'default' : 'secondary'} className="text-[10px] uppercase font-bold">
            {row.status === 'active' ? 'Actif' : row.status === 'completed' ? 'Terminé' : 'Annulé'}
          </Badge>
        </div>
      ),
    },
    {
      header: "Action",
      accessor: (row: any) => (
        <div className="text-right">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/rentals/${row.id}`}>Voir</Link>
          </Button>
        </div>
      ),
      className: "text-right"
    }
  ]

  const paymentColumns = [
    {
      header: "Facture",
      accessor: "invoice_number" as const,
      className: "font-mono text-xs",
      sortable: true,
      sortKey: "invoice_number" as any
    },
    {
      header: "Locataire",
      accessor: (row: any) => row.tenant_name,
      sortable: true,
      sortKey: "tenant_name" as any
    },
    {
      header: "Montant",
      accessor: (row: any) => formatCurrency(row.amount),
      sortable: true,
      sortKey: "amount" as any
    },
    {
      header: "Date",
      accessor: (row: any) => format(new Date(row.payment_date), "dd/MM/yyyy"),
      sortable: true,
      sortKey: "payment_date" as any
    },
    {
      header: "Action",
      accessor: (row: any) => (
        <div className="text-right">
          <Button variant="ghost" size="icon" asChild>
            <a href={`/payments/${row.id}/invoice`} target="_blank" rel="noreferrer">
              <Printer className="h-4 w-4" />
            </a>
          </Button>
        </div>
      ),
      className: "text-right"
    }
  ]

  const isTerrain = property.category.slug === 'terrain' || property.category.slug === 'terrain-vide' || property.type === 'TERRAIN VIDE'
  const isAvailableTerrainVide = property.category.slug === 'terrain-vide' && property.status === 'available'

  return (
    <>
      <Head title={property.title} />
      <div className="flex flex-col gap-8 p-6 max-w-full">
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b pb-6">
          <div className="flex items-start gap-4">
            <Button variant="outline" size="icon" asChild className="mt-1">
              <Link href={propertiesIndex().url}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="font-normal border-primary/20 text-primary">
                  {property.category.name}
                </Badge>
                <Badge variant={statusVariants[property.status]} className="font-medium">
                  {statusLabels[property.status]}
                </Badge>
              </div>
              <h1 className="text-3xl font-bold tracking-tight">{property.title}</h1>
              <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {property.city}, {property.address}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
                Modifier le bien
             </Button>
             {(!isTerrain || isAvailableTerrainVide) && (
               <Button asChild>
                  <Link href={`/rentals/create?property_id=${property.id}`}>Nouvelle location</Link>
               </Button>
             )}
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-12 mt-4">
          <div className="lg:col-span-8 space-y-10">
            {/* Current Rentals Section */}
            {activeRentals.length > 0 && (
              <section className="space-y-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-2">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Locations en cours
                  </h2>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher un locataire..."
                      className="pl-9"
                      value={rentalsSearch}
                      onChange={(e) => {
                        setRentalsSearch(e.target.value)
                        setRentalsPage(1)
                      }}
                    />
                  </div>
                </div>

                {paginatedRentals.length > 0 ? (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {paginatedRentals.map((rental) => (
                        <div key={rental.id} className="flex flex-col justify-between rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="font-bold text-lg leading-none">
                                {rental.tenant.first_name} {rental.tenant.last_name}
                              </p>
                              <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Actif</Badge>
                            </div>
                            <div className="space-y-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Depuis le {format(new Date(rental.start_date), "dd MMMM yyyy", { locale: fr })}
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Prochain paiement : <span className="font-medium text-foreground">{rental.next_payment_date ? format(new Date(rental.next_payment_date), "dd MMM", { locale: fr }) : "-"}</span>
                              </div>
                            </div>
                          </div>
                          <div className="mt-6 flex items-center justify-between border-t pt-4">
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Loyer mensuel</p>
                              <p className="text-xl font-bold text-primary">{formatCurrency(rental.rent_amount)}</p>
                            </div>
                            <Button variant="secondary" size="sm" asChild className="rounded-full px-4">
                              <Link href={`/rentals/${rental.id}`}>
                                Gérer
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {rentalsTotalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setRentalsPage(p => Math.max(1, p - 1))}
                          disabled={rentalsPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          Page {rentalsPage} sur {rentalsTotalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setRentalsPage(p => Math.min(rentalsTotalPages, p + 1))}
                          disabled={rentalsPage === rentalsTotalPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-center py-8 text-muted-foreground italic border rounded-lg border-dashed">
                    Aucune location ne correspond à votre recherche.
                  </p>
                )}
              </section>
            )}

            {/* Units Section */}
            <UnitsSection
              property={property}
              onAddApartment={() => setIsApartmentModalOpen(true)}
              onEditApartment={handleEditApartment}
              formatCurrency={formatCurrency}
              statusLabels={statusLabels}
            />

            {/* Payment History Section */}
            <section className="space-y-4">
               <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" />
                    Historique des paiements
                  </h2>
               </div>
               <DataTable
                  columns={paymentColumns}
                  data={allPayments}
                  searchKey="tenant_name"
                  emptyMessage="Aucun paiement enregistré pour ce bien."
                  showPagination={false}
                  footer={
                     <TableRow className="bg-muted/50 font-bold">
                        <TableCell colSpan={2} className="text-right">Total</TableCell>
                        <TableCell colSpan={3}>{formatCurrency(allPayments.reduce((acc, curr) => acc + Number(curr.amount), 0))}</TableCell>
                     </TableRow>
                  }
               />
            </section>

            {/* Rental History Section */}
            <section className="space-y-4">
               <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Historique des locations
                  </h2>
               </div>
               <DataTable
                  columns={rentalColumns}
                  data={rentals}
                  searchKey={(row: any) => `${row.tenant.first_name} ${row.tenant.last_name}`}
                  emptyMessage="Aucun historique de location pour ce bien."
                  showPagination={false}
                  footer={
                     <TableRow className="bg-muted/50 font-bold">
                        <TableCell colSpan={2} className="text-right">Total</TableCell>
                        <TableCell colSpan={3}>{formatCurrency(rentals.reduce((acc, curr) => acc + Number(curr.rent_amount), 0))}</TableCell>
                     </TableRow>
                  }
               />
            </section>
          </div>

          <aside className="lg:col-span-4 space-y-8">
            {/* Features Section */}
            {!isTerrain && (
              <div className="space-y-4">
                <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Caractéristiques</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                    <Bed className="h-5 w-5 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">
                        {property.bedrooms_count && property.bedrooms_count > 1 ? "Chambres" : "Chambre"}
                      </span>
                      <span className="font-bold">{property.bedrooms_count || 0}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                    <Bath className="h-5 w-5 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">
                        {property.bathrooms_count && property.bathrooms_count > 1 ? "Salles de bain" : "Salle de bain"}
                      </span>
                      <span className="font-bold">{property.bathrooms_count || 0}</span>
                    </div>
                  </div>

                  {property.living_rooms_count !== null && property.living_rooms_count > 0 && (
                    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">
                          {property.living_rooms_count > 1 ? "Salons" : "Salon"}
                        </span>
                        <span className="font-bold">{property.living_rooms_count}</span>
                      </div>
                    </div>
                  )}

                  {property.balconies_count !== null && property.balconies_count > 0 && (
                    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                      <Maximize className="h-5 w-5 text-muted-foreground" />
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">
                          {property.balconies_count > 1 ? "Balcons" : "Balcon"}
                        </span>
                        <span className="font-bold">{property.balconies_count}</span>
                      </div>
                    </div>
                  )}

                  {property.kitchens_count !== null && property.kitchens_count > 0 && (
                    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                      <ChefHat className="h-5 w-5 text-muted-foreground" />
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">
                          {property.kitchens_count > 1 ? "Cuisines" : "Cuisine"}
                        </span>
                        <span className="font-bold">{property.kitchens_count}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <Button className="w-full" variant="outline" asChild>
              <Link href={propertiesIndex().url}>
                Retour à la liste
              </Link>
            </Button>
          </aside>
        </div>
      </div>

      <ApartmentModal
        isOpen={isApartmentModalOpen}
        onOpenChange={setIsApartmentModalOpen}
        propertyId={property.id}
        apartment={selectedApartment}
        onSuccess={() => setSelectedApartment(null)}
      />

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[700px] h-[90vh] flex flex-col p-0">
              <DialogHeader className="p-6 pb-0">
                  <DialogTitle>Modifier le bien</DialogTitle>
                  <DialogDescription>
                      Modifiez les informations du bien immobilier ci-dessous.
                  </DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto p-6 pt-0">
                  <PropertyForm
                      property={property as any}
                      categories={categories}
                      onSuccess={() => setIsEditModalOpen(false)}
                      onCancel={() => setIsEditModalOpen(false)}
                  />
              </div>
          </DialogContent>
      </Dialog>
    </>
  )
}

Show.layout = (page: any) => {
  const property = page.props?.property

  return (
    <AppLayout
      breadcrumbs={[
        { title: "Biens immobiliers", href: propertiesIndex().url },
        { title: property?.title || "Détails", href: property ? `/properties/${property.id}` : "#" },
      ]}
    >
      {page}
    </AppLayout>
  )
}
