import { Head, Link, useForm } from "@inertiajs/react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import {
  Building2,
  Calendar,
  History,
  ArrowLeft,
  Home,
  MapPin,
  Maximize,
  Bed,
  Bath,
  ChefHat,
  Eye,
  CheckCircle2,
  Clock,
  Printer,
  Key as KeyIcon,
  Plus
} from "lucide-react"
import * as React from "react"
import { toast } from "sonner"

import { index as propertiesIndex, addApartment as addApartmentAction } from '@/actions/App/Http/Controllers/PropertyController'
import { DataTable } from "@/components/data-table"
import InputError from "@/components/input-error"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import AppLayout from "@/layouts/app-layout"
import { PropertyForm } from "./property-form"

interface Apartment {
  id: number
  title: string
  floor_number: number
  price: string | null
  surface_area: string | null
  bedrooms_count: number | null
  bathrooms_count: number | null
  living_rooms_count: number | null
  balconies_count: number | null
  kitchens_count: number | null
  has_kitchen: boolean
  status: string
}

interface Payment {
  id: number
  amount: string
  payment_date: string
  invoice_number: string
  status: string
}

interface Tenant {
  id: number
  first_name: string
  last_name: string
}

interface Rental {
  id: number
  tenant: Tenant
  rent_amount: string
  start_date: string
  next_payment_date: string | null
  status: 'active' | 'completed' | 'cancelled'
  payments: Payment[]
}

interface Property {
  id: number
  property_category_id: number
  title: string
  description: string | null
  address: string | null
  city: string | null
  price: string | null
  type: string | null
  surface_area: string | null
  bedrooms_count: number | null
  bathrooms_count: number | null
  living_rooms_count: number | null
  balconies_count: number | null
  kitchens_count: number | null
  has_kitchen: boolean
  has_solar_panels: boolean
  has_generator: boolean
  status: 'available' | 'sold' | 'rented'
  parent_id: number | null
  category: {
    id: number
    name: string
    slug: string
  }
  apartments: Apartment[]
}

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

  const { data, setData, post, processing, errors, reset } = useForm({
    title: "",
    floor_number: "",
    price: "",
    surface_area: "",
    rooms_count: "",
    bedrooms_count: "",
    bathrooms_count: "",
    living_rooms_count: "",
    balconies_count: "",
    kitchens_count: "",
    has_kitchen: true,
    status: "available",
  })

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

  const activeRentals = rentals.filter(r => r.status === 'active')

  const allPayments = React.useMemo(() => {
    return rentals.flatMap(r =>
      r.payments.map(p => ({
        ...p,
        tenant_name: `${r.tenant.first_name} ${r.tenant.last_name}`,
        rental_id: r.id
      }))
    ).sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
  }, [rentals])

  const handleAddApartment = (e: React.FormEvent) => {
    e.preventDefault()
    post(addApartmentAction({ property: property.id }).url, {
      onSuccess: () => {
        setIsApartmentModalOpen(false)
        reset()
        toast.success("Appartement ajouté avec succès")
      }
    })
  }

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
             <Button asChild>
                <Link href={`/rentals/create?property_id=${property.id}`}>Nouvelle location</Link>
             </Button>
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-12 mt-4">
          <div className="lg:col-span-8 space-y-10">
            {/* Current Rentals Section */}
            {activeRentals.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Locations en cours
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {activeRentals.map((rental) => (
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
              </section>
            )}

            {/* Units Section */}
            {property.parent_id === null && (
              <section className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-500" />
                    Unités & Appartements
                  </h2>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{property.apartments.length} unités</Badge>
                    <Button size="sm" onClick={() => setIsApartmentModalOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Ajouter
                    </Button>
                  </div>
                </div>
                <div className="grid gap-3">
                  {property.apartments.length > 0 ? (
                    property.apartments.map((apt) => (
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
                              {statusLabels[apt.status as keyof typeof statusLabels] || apt.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" asChild title="Voir détails">
                               <Link href={`/properties/${apt.id}`}>
                                  <Eye className="h-4 w-4" />
                               </Link>
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
                    ))
                  ) : (
                    <p className="text-center py-8 text-muted-foreground italic border rounded-lg border-dashed">
                      Aucun appartement enregistré pour ce bien.
                    </p>
                  )}
                </div>
              </section>
            )}

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
               />
            </section>
          </div>

          <aside className="lg:col-span-4 space-y-8">
            {/* Features Section */}
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

            <Button className="w-full" variant="outline" asChild>
              <Link href={propertiesIndex().url}>
                Retour à la liste
              </Link>
            </Button>
          </aside>
        </div>
      </div>

      <Dialog open={isApartmentModalOpen} onOpenChange={setIsApartmentModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Ajouter un appartement</DialogTitle>
            <DialogDescription>
              Saisissez les informations du nouvel appartement pour ce bien.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddApartment} className="space-y-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="apt-title">Titre / N°</Label>
                <Input
                  id="apt-title"
                  value={data.title}
                  onChange={(e) => setData("title", e.target.value)}
                  placeholder="Ex: A101"
                  required
                />
                <InputError message={errors.title} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apt-floor">Étage</Label>
                <Input
                  id="apt-floor"
                  type="number"
                  value={data.floor_number}
                  onChange={(e) => setData("floor_number", e.target.value)}
                  required
                />
                <InputError message={errors.floor_number} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apt-price">Prix de location</Label>
                <Input
                  id="apt-price"
                  type="number"
                  value={data.price}
                  onChange={(e) => setData("price", e.target.value)}
                />
                <InputError message={errors.price} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="apt-bedrooms">Chambres</Label>
                <Input
                  id="apt-bedrooms"
                  type="number"
                  value={data.bedrooms_count}
                  onChange={(e) => setData("bedrooms_count", e.target.value)}
                />
                <InputError message={errors.bedrooms_count} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apt-living">Salons</Label>
                <Input
                  id="apt-living"
                  type="number"
                  value={data.living_rooms_count}
                  onChange={(e) => setData("living_rooms_count", e.target.value)}
                />
                <InputError message={errors.living_rooms_count} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apt-balconies">Balcons</Label>
                <Input
                  id="apt-balconies"
                  type="number"
                  value={data.balconies_count}
                  onChange={(e) => setData("balconies_count", e.target.value)}
                />
                <InputError message={errors.balconies_count} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apt-kitchens">Cuisines</Label>
                <Input
                  id="apt-kitchens"
                  type="number"
                  value={data.kitchens_count}
                  onChange={(e) => setData("kitchens_count", e.target.value)}
                />
                <InputError message={errors.kitchens_count} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apt-bathrooms">Toilettes</Label>
                <Input
                  id="apt-bathrooms"
                  type="number"
                  value={data.bathrooms_count}
                  onChange={(e) => setData("bathrooms_count", e.target.value)}
                />
                <InputError message={errors.bathrooms_count} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apt-status">Statut</Label>
                <Select onValueChange={(value) => setData("status", value)} value={data.status}>
                  <SelectTrigger id="apt-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Disponible</SelectItem>
                    <SelectItem value="rented">Loué</SelectItem>
                    <SelectItem value="sold">Vendu</SelectItem>
                  </SelectContent>
                </Select>
                <InputError message={errors.status} />
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsApartmentModalOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={processing}>
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
