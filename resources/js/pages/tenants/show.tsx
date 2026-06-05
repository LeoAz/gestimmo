import { Head, Link } from "@inertiajs/react"
import { Calendar, MapPin, Phone, ArrowLeft, Building2, Home } from "lucide-react"
import * as React from "react"

import Heading from "@/components/heading"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import AppLayout from "@/layouts/app-layout"

interface Tenant {
  id: number
  first_name: string
  last_name: string
  phone: string
  address: string | null
  photo: string | null
  id_card: string | null
}

interface Property {
  id: number
  title: string
  parent?: {
    title: string
  }
}

interface Rental {
  id: number
  property: Property
  deposit_amount: string
  start_date: string
  end_date: string | null
  status: 'active' | 'completed' | 'cancelled'
  created_at: string
}

interface Props {
  tenant: Tenant
  rentals: Rental[]
}

export default function Show({ tenant, rentals }: Props) {
  return (
    <>
      <Head title={`Historique - ${tenant.first_name} ${tenant.last_name}`} />

      <div className="flex h-full flex-1 flex-col gap-6 p-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/rentals">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Heading
            title={`${tenant.first_name} ${tenant.last_name}`}
            description="Historique complet des locations."
          />
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Tenant Info Card */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Informations Locataire</CardTitle>
              <CardDescription>Détails du profil</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{tenant.phone}</span>
              </div>
              {tenant.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{tenant.address}</span>
                </div>
              )}
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium">Nombre total de locations</p>
                <p className="text-2xl font-bold">{rentals.length}</p>
              </div>
            </CardContent>
          </Card>

          {/* Rentals Timeline */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Historique des locations</CardTitle>
              <CardDescription>Liste chronologique des contrats</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {rentals.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Aucun historique de location trouvé.</p>
                ) : (
                  rentals.map((rental) => (
                    <div key={rental.id} className="relative pl-6 pb-6 border-l last:pb-0">
                      <div className="absolute left-[-5px] top-1 h-2 w-2 rounded-full bg-primary" />
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-lg flex items-center gap-2">
                            {rental.property.parent ? (
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Home className="h-4 w-4 text-muted-foreground" />
                            )}
                            {rental.property.title}
                            {rental.property.parent && (
                              <span className="text-sm font-normal text-muted-foreground">
                                ({rental.property.parent.title})
                              </span>
                            )}
                          </h4>
                          <Badge variant={
                            rental.status === 'active' ? 'default' :
                            rental.status === 'completed' ? 'secondary' : 'destructive'
                          }>
                            {rental.status === 'active' ? 'En cours' :
                             rental.status === 'completed' ? 'Terminée' : 'Annulée'}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              Du {new Date(rental.start_date).toLocaleDateString('fr-FR')}
                              {rental.end_date ? ` au ${new Date(rental.end_date).toLocaleDateString('fr-FR')}` : ' (Indéfini)'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">Caution:</span>
                            <span>
                              {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF" }).format(Number(rental.deposit_amount))}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}

Show.layout = (page: any) => {
  const tenant = page.props?.tenant

  return (
    <AppLayout
      breadcrumbs={[
        { title: "Locations", href: "/rentals" },
        { title: tenant ? `Historique - ${tenant.first_name} ${tenant.last_name}` : "Détails Locataire", href: "#" },
      ]}
    >
      {page}
    </AppLayout>
  )
}
