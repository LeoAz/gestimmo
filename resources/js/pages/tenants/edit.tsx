import { Head, Link, useForm } from "@inertiajs/react"
import { ArrowLeft, Loader2, Upload } from "lucide-react"
import * as React from "react"

import { index, update } from "@/actions/App/Http/Controllers/TenantController"

import Heading from "@/components/heading"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { BreadcrumbItem } from "@/types"

interface Tenant {
  id: number
  first_name: string
  last_name: string
  phone: string
  address: string
  photo: string | null
  id_card: string | null
}

interface Props {
  tenant: Tenant
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Locataires",
    href: "/tenants",
  },
  {
    title: "Modifier",
    href: "#",
  },
]

export default function Edit({ tenant }: Props) {
  const { data, setData, post, processing, errors } = useForm({
    first_name: tenant.first_name,
    last_name: tenant.last_name,
    phone: tenant.phone,
    address: tenant.address,
    photo: null as File | null,
    id_card: null as File | null,
    _method: "PUT",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post(update(tenant.id).url)
  }

  return (
    <>
      <Head title={`Modifier ${tenant.first_name} ${tenant.last_name}`} />

      <div className="flex h-full flex-1 flex-col gap-4 p-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={index().url}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Heading title="Modifier le locataire" description={`Modification des informations de ${tenant.first_name} ${tenant.last_name}`} />
        </div>

        <div className="max-w-2xl">
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">Prénom</Label>
                    <Input
                      id="first_name"
                      value={data.first_name}
                      onChange={(e) => setData("first_name", e.target.value)}
                      required
                    />
                    {errors.first_name && <p className="text-sm text-destructive">{errors.first_name}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Nom</Label>
                    <Input
                      id="last_name"
                      value={data.last_name}
                      onChange={(e) => setData("last_name", e.target.value)}
                      required
                    />
                    {errors.last_name && <p className="text-sm text-destructive">{errors.last_name}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={data.phone}
                    onChange={(e) => setData("phone", e.target.value)}
                    required
                  />
                  {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Textarea
                    id="address"
                    value={data.address}
                    onChange={(e) => setData("address", e.target.value)}
                    required
                  />
                  {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="photo">Photo (laisser vide pour conserver l'actuelle)</Label>
                    <div className="flex flex-col gap-2">
                        <Input
                            id="photo"
                            type="file"
                            accept="image/*"
                            onChange={(e) => setData("photo", e.target.files?.[0] || null)}
                            className="cursor-pointer"
                        />
                        {tenant.photo && <p className="text-xs text-muted-foreground italic">Une photo est déjà enregistrée</p>}
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Upload className="h-3 w-3" /> Max 2Mo (JPG, PNG)
                        </p>
                    </div>
                    {errors.photo && <p className="text-sm text-destructive">{errors.photo}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="id_card">Pièce d'identité (laisser vide pour conserver l'actuelle)</Label>
                    <div className="flex flex-col gap-2">
                        <Input
                            id="id_card"
                            type="file"
                            onChange={(e) => setData("id_card", e.target.files?.[0] || null)}
                            className="cursor-pointer"
                        />
                        {tenant.id_card && <p className="text-xs text-muted-foreground italic">Une pièce d'identité est déjà enregistrée</p>}
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Upload className="h-3 w-3" /> Max 2Mo (PDF, Image)
                        </p>
                    </div>
                    {errors.id_card && <p className="text-sm text-destructive">{errors.id_card}</p>}
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="outline" asChild disabled={processing}>
                    <Link href={index().url}>Annuler</Link>
                  </Button>
                  <Button type="submit" disabled={processing}>
                    {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Mettre à jour le locataire
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}

Edit.layout = {
  breadcrumbs: breadcrumbs,
}
