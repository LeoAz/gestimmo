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
import Heading from "@/components/heading"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import AppLayout from "@/layouts/app-layout"
import { cn } from "@/lib/utils"

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

  return (
    <>
      <Head title={property.title} />
      <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href={propertiesIndex().url}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <Heading title={property.title} description={property.category.name} />
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {property.city}, {property.address}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={statusVariants[property.status]} className="px-3 py-1 text-sm">
              {statusLabels[property.status]}
            </Badge>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenu Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.total_revenue)}</div>
              <p className="text-xs text-muted-foreground mt-1">Généré par ce bien</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenu du Mois</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.monthly_revenue)}</div>
              <p className="text-xs text-muted-foreground mt-1">Paiements encaissés ce mois</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Locations Actives</CardTitle>
              <KeyIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active_rentals_count}</div>
              <p className="text-xs text-muted-foreground mt-1">Contrats en cours</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Locations</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_rentals_count}</div>
              <p className="text-xs text-muted-foreground mt-1">Historique des locataires</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Current Rentals Section */}
            {activeRentals.length > 0 && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    Locations en cours
                  </CardTitle>
                  <CardDescription>Locataires occupant actuellement le bien ou ses unités.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activeRentals.map((rental) => (
                      <div key={rental.id} className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border bg-background p-4 shadow-sm">
                        <div className="space-y-1">
                          <p className="font-bold text-lg">
                            {rental.tenant.first_name} {rental.tenant.last_name}
                          </p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Depuis le {format(new Date(rental.start_date), "dd/MM/yyyy")}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Prochain : {rental.next_payment_date ? format(new Date(rental.next_payment_date), "dd MMMM", { locale: fr }) : "-"}
                            </span>
                          </div>
                        </div>
                        <div className="mt-4 sm:mt-0 flex items-center justify-between sm:justify-end gap-4 border-t pt-4 sm:border-0 sm:pt-0">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Loyer</p>
                            <p className="font-bold text-primary">{formatCurrency(rental.rent_amount)}</p>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/rentals/${rental.id}`}>
                              Détails
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Description Card */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                  {property.description || "Aucune description fournie."}
                </p>
              </CardContent>
            </Card>

            {/* Apartments Section */}
            {property.apartments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Unités ({property.apartments.length})</CardTitle>
                  <CardDescription>Liste des appartements ou unités de ce bien.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {property.apartments.map((apt) => (
                      <div key={apt.id} className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                        <div className="space-y-1">
                          <p className="font-medium flex items-center gap-2">
                            <Home className="h-4 w-4 text-muted-foreground" />
                            {apt.title}
                          </p>
                          <div className="flex gap-3 text-xs text-muted-foreground">
                            <span>Étage {apt.floor_number}</span>
                            <span>•</span>
                            <span>{apt.surface_area} m²</span>
                            <span>•</span>
                            <span>{apt.bedrooms_count || 0} ch</span>
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="font-bold">{formatCurrency(apt.price)}</p>
                          <Badge variant={apt.status === 'available' ? 'outline' : 'secondary'} className="text-[10px]">
                            {statusLabels[apt.status as keyof typeof statusLabels] || apt.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment History Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Historique des paiements
                </CardTitle>
                <CardDescription>Les derniers versements reçus pour ce bien.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Facture</TableHead>
                        <TableHead>Locataire</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rentals.flatMap(r => r.payments).sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()).slice(0, 5).length > 0 ? (
                        rentals.flatMap(r => r.payments)
                          .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
                          .slice(0, 10)
                          .map((payment) => {
                            const rental = rentals.find(r => r.payments.some(p => p.id === payment.id))

                            return (
                              <TableRow key={payment.id}>
                                <TableCell className="font-medium text-xs">{payment.invoice_number}</TableCell>
                                <TableCell className="text-sm">
                                  {rental?.tenant.first_name} {rental?.tenant.last_name}
                                </TableCell>
                                <TableCell>{formatCurrency(payment.amount)}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {format(new Date(payment.payment_date), "dd/MM/yyyy")}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button variant="ghost" size="icon" asChild>
                                    <a href={`/payments/${payment.id}/invoice`} target="_blank">
                                      <Printer className="h-4 w-4" />
                                    </a>
                                  </Button>
                                </TableCell>
                              </TableRow>
                            )
                          })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                            Aucun paiement enregistré.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Details Card */}
            <Card>
              <CardHeader>
                <CardTitle>Détails du bien</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-muted-foreground">Prix de location estimé</span>
                  <span className="text-xl font-bold text-primary">{formatCurrency(property.price)}</span>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Surface</span>
                    <p className="flex items-center gap-2 font-medium">
                      <Maximize className="h-4 w-4 text-muted-foreground" />
                      {property.surface_area ? `${property.surface_area} m²` : "-"}
                    </p>
                  </div>
                  <div className="space-y-1 text-right">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Type</span>
                    <p className="font-medium">{property.type || property.category.name}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Pièces & Commodités</span>
                  <div className="grid grid-cols-2 gap-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Bed className="h-4 w-4 text-muted-foreground" />
                      {property.bedrooms_count || 0} chambres
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Bath className="h-4 w-4 text-muted-foreground" />
                      {property.bathrooms_count || 0} toilettes
                    </div>
                    {property.has_kitchen && (
                      <div className="flex items-center gap-2 text-sm">
                        <ChefHat className="h-4 w-4 text-muted-foreground" />
                        Cuisine équipée
                      </div>
                    )}
                    {property.has_solar_panels && (
                      <div className="flex items-center gap-2 text-sm">
                        <Sun className="h-4 w-4 text-muted-foreground" />
                        Panneaux solaires
                      </div>
                    )}
                    {property.has_generator && (
                      <div className="flex items-center gap-2 text-sm">
                        <Zap className="h-4 w-4 text-muted-foreground" />
                        Groupe électrogène
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Localisation</span>
                  <p className="text-sm font-medium">{property.city}</p>
                  <p className="text-sm text-muted-foreground">{property.address}</p>
                </div>
              </CardContent>
            </Card>

            {/* Tenant History Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Historique Locataire</CardTitle>
                <CardDescription>Derniers locataires ayant occupé le bien.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {rentals.slice(0, 5).map((rental) => (
                    <div key={rental.id} className="flex items-start gap-3">
                      <div className={cn(
                        "mt-1 flex h-2 w-2 rounded-full",
                        rental.status === 'active' ? "bg-green-500" : "bg-slate-300"
                      )} />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {rental.tenant.first_name} {rental.tenant.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(rental.start_date), "MMM yyyy")}
                          {rental.status === 'active' ? " - Présent" : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                  {rentals.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">Aucun locataire enregistré.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Button className="w-full" variant="outline" asChild>
              <Link href={propertiesIndex().url}>
                Retour à la liste
              </Link>
            </Button>
          </div>
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
