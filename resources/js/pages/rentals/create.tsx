import { Head, Link, useForm, usePage } from "@inertiajs/react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import * as React from "react"
import { toast } from "sonner"

import { FormAlert } from "@/components/form-alert"
import Heading from "@/components/heading"
import InputError from "@/components/input-error"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Combobox } from "@/components/ui/combobox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { BreadcrumbItem } from "@/types"

interface Property {
  id: number
  title: string
  status: string
  price: string | null
  property_category_id: number
  category?: Category
}

interface Category {
  id: number
  name: string
  slug: string
}

interface Building extends Property {
  apartments: Property[]
}

interface Tenant {
  id: number
  first_name: string
  last_name: string
  phone: string
}

interface Props {
  categories: Category[]
  properties: Property[]
  buildings: Building[]
  tenants: Tenant[]
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Locations",
    href: "/rentals",
  },
  {
    title: "Nouvelle location",
    href: "/rentals/create",
  },
]

export default function Create({ categories, properties, buildings, tenants }: Props) {
  const { errors: pageErrors } = usePage().props as any
  const { data, setData, post, processing, errors } = useForm({
    tenant_id: "",
    tenant_first_name: "",
    tenant_last_name: "",
    tenant_phone: "",
    tenant_address: "",
    tenant_photo: null as File | null,
    tenant_id_card: null as File | null,
    property_id: "",
    deposit_amount: "",
    rent_amount: "",
    payment_frequency: "monthly",
    billing_cycle: "monthly",
    start_date: new Date(),
    end_date: null as Date | null,
  })

  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string>("")
  const [selectedBuildingId, setSelectedBuildingId] = React.useState<string>("")

  const selectedCategory = categories.find(c => c.id.toString() === selectedCategoryId)
  const isBuildingType = selectedCategory?.slug === 'immeuble' || selectedCategory?.slug === 'batiment'

  const filteredProperties = properties.filter(p => p.property_category_id.toString() === selectedCategoryId)
  const selectedBuilding = buildings.find(b => b.id.toString() === selectedBuildingId)
  const availableApartments = selectedBuilding?.apartments || []

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post("/rentals", {
      transform: (data) => ({
        ...data,
        tenant_id: data.tenant_id === "new" ? "" : data.tenant_id,
        start_date: format(data.start_date, "yyyy-MM-dd"),
        end_date: data.end_date ? format(data.end_date, "yyyy-MM-dd") : null,
      }),
      onSuccess: () => {
        toast.success("Location enregistrée avec succès")
      },
    })
  }

  return (
    <>
      <Head title="Nouvelle location" />

      <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
        <Heading title="Nouvelle location" description="Enregistrez une nouvelle location en sélectionnant un locataire et un bien." />
        <FormAlert message={errors.error || pageErrors?.error} />
        <form onSubmit={handleSubmit} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Informations du locataire</CardTitle>
              <CardDescription>Sélectionnez un locataire existant ou créez-en un nouveau.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tenant_id">Locataire existant (optionnel)</Label>
                <Combobox
                  options={[
                    { value: "new", label: "--- Nouveau locataire ---" },
                    ...tenants.map(t => ({
                      value: t.id.toString(),
                      label: `${t.first_name} ${t.last_name} (${t.phone})`
                    }))
                  ]}
                  value={data.tenant_id}
                  onValueChange={(value) => {
                    if (value === data.tenant_id) {
                      return;
                    }

                    setData("tenant_id", value);

                    if (value && value !== "new") {
                      const tenant = tenants.find(t => t.id.toString() === value);

                      if (tenant) {
                        setData(data => ({
                          ...data,
                          tenant_id: value,
                          tenant_first_name: tenant.first_name,
                          tenant_last_name: tenant.last_name,
                          tenant_phone: tenant.phone,
                        }));
                      }
                    } else if (value === "new") {
                      setData(data => ({
                        ...data,
                        tenant_id: "new",
                        tenant_first_name: "",
                        tenant_last_name: "",
                        tenant_phone: "",
                      }));
                    }
                  }}
                  placeholder="Choisir un locataire existant"
                  emptyText="Aucun locataire trouvé."
                />
                <InputError message={errors.tenant_id} />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tenant_first_name">Prénom</Label>
                  <Input
                    id="tenant_first_name"
                    value={data.tenant_first_name}
                    onChange={(e) => setData("tenant_first_name", e.target.value)}
                    required={!data.tenant_id || data.tenant_id === "new"}
                    disabled={!!data.tenant_id && data.tenant_id !== "new"}
                  />
                  <InputError message={errors.tenant_first_name} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tenant_last_name">Nom</Label>
                  <Input
                    id="tenant_last_name"
                    value={data.tenant_last_name}
                    onChange={(e) => setData("tenant_last_name", e.target.value)}
                    required={!data.tenant_id || data.tenant_id === "new"}
                    disabled={!!data.tenant_id && data.tenant_id !== "new"}
                  />
                  <InputError message={errors.tenant_last_name} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenant_phone">Numéro de téléphone</Label>
                <Input
                  id="tenant_phone"
                  value={data.tenant_phone}
                  onChange={(e) => setData("tenant_phone", e.target.value)}
                  required={!data.tenant_id || data.tenant_id === "new"}
                  disabled={!!data.tenant_id && data.tenant_id !== "new"}
                />
                <InputError message={errors.tenant_phone} />
              </div>

              {(!data.tenant_id || data.tenant_id === "new") && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="tenant_address">Adresse</Label>
                    <Textarea
                      id="tenant_address"
                      value={data.tenant_address}
                      onChange={(e) => setData("tenant_address", e.target.value)}
                    />
                    <InputError message={errors.tenant_address} />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="tenant_photo">Photo du locataire</Label>
                      <Input
                        id="tenant_photo"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setData("tenant_photo", e.target.files?.[0] || null)}
                      />
                      <InputError message={errors.tenant_photo} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tenant_id_card">Pièce d'identité (PDF/Image)</Label>
                      <Input
                        id="tenant_id_card"
                        type="file"
                        accept=".pdf,image/*"
                        onChange={(e) => setData("tenant_id_card", e.target.files?.[0] || null)}
                      />
                      <InputError message={errors.tenant_id_card} />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bien immobilier & Conditions</CardTitle>
              <CardDescription>Sélectionnez le bien à louer et précisez les conditions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label htmlFor="category_id">Type de bien (Catégorie)</Label>
                <Select
                  value={selectedCategoryId}
                  onValueChange={(value) => {
                    setSelectedCategoryId(value)
                    setData("property_id", "")
                    setSelectedBuildingId("")
                  }}
                >
                  <SelectTrigger id="category_id">
                    <SelectValue placeholder="Sélectionnez une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCategoryId && (
                <>
                  {isBuildingType ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="building_id">Immeuble / Bâtiment</Label>
                        <Combobox
                          options={buildings
                            .filter(b => b.property_category_id.toString() === selectedCategoryId)
                            .map((b) => ({
                              value: b.id.toString(),
                              label: b.title,
                            }))}
                          value={selectedBuildingId}
                          onValueChange={(value) => {
                            setSelectedBuildingId(value)
                            setData("property_id", "")
                          }}
                          placeholder="Choisir l'immeuble"
                          emptyText="Aucun immeuble trouvé."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="apartment_id">Appartement</Label>
                        <Combobox
                          options={availableApartments.map((a) => ({
                            value: a.id.toString(),
                            label: `${a.title} - ${a.price ? `${Number(a.price).toLocaleString()} XOF` : 'Prix non défini'}`,
                          }))}
                          value={data.property_id}
                          onValueChange={(value) => {
                            const property = availableApartments.find((a) => a.id.toString() === value)
                            setData((d) => ({
                              ...d,
                              property_id: value,
                              rent_amount: property?.price || "",
                            }))
                          }}
                          disabled={!selectedBuildingId}
                          placeholder={selectedBuildingId ? "Choisir l'appartement" : "Sélectionnez d'abord un immeuble"}
                          emptyText="Aucun appartement trouvé."
                        />
                        <InputError message={errors.property_id} />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="property_id">Sélectionner le bien ({selectedCategory?.name})</Label>
                      <Combobox
                        options={filteredProperties.map((p) => ({
                          value: p.id.toString(),
                          label: `${p.title} - ${p.price ? `${Number(p.price).toLocaleString()} XOF` : 'Prix non défini'}`,
                        }))}
                        value={data.property_id}
                        onValueChange={(value) => {
                          const property = filteredProperties.find((p) => p.id.toString() === value)
                          setData((d) => ({
                            ...d,
                            property_id: value,
                            rent_amount: property?.price || "",
                          }))
                        }}
                        placeholder={`Choisir un(e) ${selectedCategory?.name}`}
                        emptyText={`Aucun(e) ${selectedCategory?.name} trouvé(e).`}
                      />
                      <InputError message={errors.property_id} />
                    </div>
                  )}
                </>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="deposit_amount">Montant de la caution (XOF)</Label>
                  <Input
                    id="deposit_amount"
                    type="number"
                    value={data.deposit_amount}
                    onChange={(e) => setData("deposit_amount", e.target.value)}
                  />
                  <InputError message={errors.deposit_amount} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rent_amount">Montant du loyer (XOF)</Label>
                  <Input
                    id="rent_amount"
                    type="number"
                    value={data.rent_amount}
                    onChange={(e) => setData("rent_amount", e.target.value)}
                  />
                  <InputError message={errors.rent_amount} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="payment_frequency">Mode de paiement (Récurrence)</Label>
                  <Select
                    value={data.payment_frequency}
                    onValueChange={(value) => setData("payment_frequency", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir la fréquence" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensuel</SelectItem>
                      <SelectItem value="bimonthly">Bimensuel</SelectItem>
                      <SelectItem value="quarterly">Trimestriel</SelectItem>
                      <SelectItem value="bisessional">Bitrimestriel</SelectItem>
                      <SelectItem value="semiannual">Semestriel</SelectItem>
                      <SelectItem value="annual">Annuel</SelectItem>
                    </SelectContent>
                  </Select>
                  <InputError message={errors.payment_frequency} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billing_cycle">Mode de facturation</Label>
                  <Select
                    value={data.billing_cycle}
                    onValueChange={(value) => setData("billing_cycle", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir le cycle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensuel</SelectItem>
                      <SelectItem value="bimonthly">Bimensuel</SelectItem>
                      <SelectItem value="quarterly">Trimestriel</SelectItem>
                      <SelectItem value="bisessional">Bitrimestriel</SelectItem>
                      <SelectItem value="semiannual">Semestriel</SelectItem>
                      <SelectItem value="annual">Annuel</SelectItem>
                    </SelectContent>
                  </Select>
                  <InputError message={errors.billing_cycle} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Date de début</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !data.start_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {data.start_date ? format(data.start_date, "PPP", { locale: fr }) : <span>Choisir une date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={data.start_date}
                        onSelect={(date) => date && setData("start_date", date)}
                        initialFocus
                        locale={fr}
                      />
                    </PopoverContent>
                  </Popover>
                  <InputError message={errors.start_date} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">Date de fin</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !data.end_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {data.end_date ? format(data.end_date, "PPP", { locale: fr }) : <span>Choisir une date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={data.end_date || undefined}
                        onSelect={(date) => setData("end_date", date || null)}
                        initialFocus
                        locale={fr}
                      />
                    </PopoverContent>
                  </Popover>
                  <InputError message={errors.end_date} />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-4">
            <Button variant="outline" asChild>
              <Link href="/rentals">Annuler</Link>
            </Button>
            <Button type="submit" disabled={processing}>
              Enregistrer la location
            </Button>
          </div>
        </form>
      </div>
    </>
  )
}

Create.layout = {
  breadcrumbs: breadcrumbs,
}
