import { Head, Link } from "@inertiajs/react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import {
  Building2,
  Calendar,
  History,
  Users,
  TrendingUp,
  ArrowLeft,
  Home,
  MapPin,
  Maximize,
  Bed,
  Bath,
  ChefHat,
  Sun,
  Zap,
  Eye,
  CreditCard,
  CheckCircle2,
  Clock,
  Printer,
  Key as KeyIcon
} from "lucide-react"
import * as React from "react"

import { index as propertiesIndex } from '@/actions/App/Http/Controllers/PropertyController'
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import AppLayout from "@/layouts/app-layout"

interface Apartment {
  id: number
  title: string
  floor_number: number
  price: string | null
  surface_area: string | null
  bedrooms_count: number | null
  bathrooms_count: number | null
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
  has_kitchen: boolean
  has_solar_panels: boolean
  has_generator: boolean
  status: 'available' | 'sold' | 'rented'
  category: {
    name: string
    slug: string
  }
  apartments: Apartment[]
}

interface Props {
  property: Property
  rentals: Rental[]
  stats: {
    total_revenue: number
    active_rentals_count: number
    total_rentals_count: number
    monthly_revenue: number
  }
}

export default function Show({ property, rentals, stats }: Props) {
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
                <span className="flex items-center gap-1.5">
                  <Maximize className="h-4 w-4" />
                  {property.surface_area || "-"} m²
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="outline" asChild>
                <Link href={`/properties/${property.id}/edit`}>Modifier le bien</Link>
             </Button>
             <Button asChild>
                <Link href={`/rentals/create?property_id=${property.id}`}>Nouvelle location</Link>
             </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1 p-1">
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Revenu Total
            </p>
            <p className="text-2xl font-bold tracking-tight">{formatCurrency(stats.total_revenue)}</p>
          </div>
          <div className="space-y-1 p-1 border-l pl-6">
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> Ce mois
            </p>
            <p className="text-2xl font-bold tracking-tight">{formatCurrency(stats.monthly_revenue)}</p>
          </div>
          <div className="space-y-1 p-1 border-l pl-6">
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <KeyIcon className="h-4 w-4" /> Locations actives
            </p>
            <p className="text-2xl font-bold tracking-tight">{stats.active_rentals_count}</p>
          </div>
          <div className="space-y-1 p-1 border-l pl-6">
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" /> Total locataires
            </p>
            <p className="text-2xl font-bold tracking-tight">{stats.total_rentals_count}</p>
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-12 mt-4">
          <div className="lg:col-span-8 space-y-10">
            {/* Description Section */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold border-b pb-2 flex items-center gap-2">
                <Sun className="h-5 w-5 text-orange-500" />
                Description
              </h2>
              <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed text-[15px]">
                {property.description || "Aucune description fournie."}
              </p>
            </section>

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
            {property.apartments.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-500" />
                    Unités & Appartements
                  </h2>
                  <Badge variant="secondary">{property.apartments.length} unités</Badge>
                </div>
                <div className="grid gap-3">
                  {property.apartments.map((apt) => (
                    <div key={apt.id} className="group flex items-center justify-between rounded-lg border p-4 hover:bg-muted/30 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                           <Home className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold">{apt.title}</p>
                          <div className="flex gap-4 text-xs text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-1"><Maximize className="h-3 w-3" /> Étage {apt.floor_number}</span>
                            <span className="flex items-center gap-1"><Maximize className="h-3 w-3" /> {apt.surface_area} m²</span>
                            <span className="flex items-center gap-1"><Bed className="h-3 w-3" /> {apt.bedrooms_count || 0} ch</span>
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
                        <Button variant="ghost" size="icon" asChild>
                           <Link href={`/properties/${apt.id}`}>
                              <Eye className="h-4 w-4" />
                           </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
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
            {/* Financial Overview */}
            <div className="rounded-2xl bg-primary/5 p-6 border border-primary/10 space-y-6">
                <h3 className="font-bold text-lg">Synthèse Financière</h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Valeur locative</span>
                        <span className="text-2xl font-black text-primary">{formatCurrency(property.price)}</span>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="space-y-4">
              <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Caractéristiques</h3>
              <div className="flex gap-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                    <Bed className="h-5 w-5 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Chambres</span>
                      <span className="font-bold">{property.bedrooms_count || 0}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                    <Bath className="h-5 w-5 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Salles de bain</span>
                      <span className="font-bold">{property.bathrooms_count || 0}</span>
                    </div>
                  </div>
                  {property.living_rooms_count !== null && (
                    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Salons</span>
                        <span className="font-bold">{property.living_rooms_count}</span>
                      </div>
                    </div>
                  )}
              </div>
            </div>

            {/* Amenities Section */}
            <div className="space-y-4">
                <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Équipements</h3>
                <div className="flex flex-wrap gap-2">
                    {property.has_kitchen && (
                        <Badge variant="outline" className="flex items-center gap-1.5 py-1.5 px-3">
                           <ChefHat className="h-3.5 w-3.5" /> Cuisine
                        </Badge>
                    )}
                    {property.has_solar_panels && (
                        <Badge variant="outline" className="flex items-center gap-1.5 py-1.5 px-3">
                           <Sun className="h-3.5 w-3.5" /> Solaire
                        </Badge>
                    )}
                    {property.has_generator && (
                        <Badge variant="outline" className="flex items-center gap-1.5 py-1.5 px-3">
                           <Zap className="h-3.5 w-3.5" /> Groupe
                        </Badge>
                    )}
                    {!property.has_kitchen && !property.has_solar_panels && !property.has_generator && (
                       <span className="text-sm text-muted-foreground italic">Aucun équipement spécifié</span>
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
