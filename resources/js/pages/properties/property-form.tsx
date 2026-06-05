import { useForm, usePage } from "@inertiajs/react"
import { Plus, Trash } from "lucide-react"
import * as React from "react"
import { toast } from "sonner"

import { FormAlert } from "@/components/form-alert"
import InputError from "@/components/input-error"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { store, update } from "@/routes/properties"

interface Category {
  id: number
  name: string
  slug: string
}

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
  type: string | null
  surface_area: string | null
  rooms_count: number | null
  bedrooms_count: number | null
  bathrooms_count: number | null
  living_rooms_count: number | null
  has_kitchen: boolean
  has_solar_panels: boolean
  has_generator: boolean
  status: 'available' | 'sold' | 'rented'
  apartments?: any[]
}

interface PropertyFormProps {
  property?: Property | null
  categories: Category[]
  onSuccess: () => void
  onCancel: () => void
}

export function PropertyForm({ property, categories, onSuccess, onCancel }: PropertyFormProps) {
  const { errors: pageErrors } = usePage().props as any
  const { data, setData, post, put, processing, errors, reset } = useForm({
    property_category_id: property?.property_category_id?.toString() || "",
    title: property?.title || "",
    description: property?.description || "",
    address: property?.address || "",
    city: property?.city || "",
    price: property?.price || "",
    type: property?.type || "",
    floor_number: property?.floor_number || "",
    surface_area: property?.surface_area || "",
    rooms_count: property?.rooms_count || "",
    bedrooms_count: property?.bedrooms_count || "",
    bathrooms_count: property?.bathrooms_count || "",
    living_rooms_count: property?.living_rooms_count || "",
    has_kitchen: property?.has_kitchen || false,
    has_solar_panels: property?.has_solar_panels || false,
    has_generator: property?.has_generator || false,
    status: property?.status || "available",
    apartments: property?.apartments || [] as any[],
  })

  const selectedCategory = categories.find(c => c.id === Number(data.property_category_id))
  const isBuildingOrComplex = selectedCategory?.slug === 'immeuble' || selectedCategory?.slug === 'batiment'
  const isVilla = selectedCategory?.slug === 'villa'
  const isApartment = selectedCategory?.slug === 'appartement'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (property) {
      put(update({ property: property.id }), {
        onSuccess: () => {
          toast.success("Bien immobilier mis à jour avec succès")
          onSuccess()
        },
      })
    } else {
      post(store(), {
        onSuccess: () => {
          toast.success("Bien immobilier créé avec succès")
          onSuccess()
          reset()
        },
      })
    }
  }

  const addApartment = () => {
    setData("apartments", [
      ...data.apartments,
      {
        title: `Appartement ${data.apartments.length + 1}`,
        floor_number: 0,
        price: "",
        surface_area: "",
        rooms_count: "",
        bedrooms_count: "",
        bathrooms_count: "",
        living_rooms_count: "",
        has_kitchen: true,
      }
    ])
  }

  const removeApartment = (index: number) => {
    setData("apartments", data.apartments.filter((_, i) => i !== index))
  }

  const updateApartment = (index: number, field: string, value: any) => {
    const newApartments = [...data.apartments]
    newApartments[index] = { ...newApartments[index], [field]: value }
    setData("apartments", newApartments)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto px-1 pt-4 pb-20">
      <FormAlert message={errors.error || pageErrors?.error} />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category">Catégorie</Label>
          <Select
            onValueChange={(value) => setData("property_category_id", value)}
            value={data.property_category_id}
          >
            <SelectTrigger id="category">
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
          <InputError message={errors.property_category_id} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Titre</Label>
          <Input
            id="title"
            value={data.title}
            onChange={(e) => setData("title", e.target.value)}
            placeholder="Ex: Villa des Palmiers"
            required
          />
          <InputError message={errors.title} />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Autres description</Label>
          <Textarea
            id="description"
            value={data.description}
            onChange={(e) => setData("description", e.target.value)}
            rows={3}
          />
          <InputError message={errors.description} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">Ville</Label>
          <Input
            id="city"
            value={data.city}
            onChange={(e) => setData("city", e.target.value)}
          />
          <InputError message={errors.city} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Adresse</Label>
          <Input
            id="address"
            value={data.address}
            onChange={(e) => setData("address", e.target.value)}
          />
          <InputError message={errors.address} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Prix de location (CFA)</Label>
          <Input
            id="price"
            type="number"
            value={data.price}
            onChange={(e) => setData("price", e.target.value)}
          />
          <InputError message={errors.price} />
        </div>

        {(isVilla || isApartment) && (
          <div className="space-y-2">
            <Label htmlFor="type">Type de {isVilla ? 'villa' : 'bien'}</Label>
            <Select onValueChange={(value) => setData("type", value)} value={data.type}>
              <SelectTrigger id="type">
                <SelectValue placeholder="Sélectionnez le type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Studio">Studio</SelectItem>
                <SelectItem value="Chambre salon">Chambre salon</SelectItem>
                <SelectItem value="2 Chambres salon">2 Chambres salon</SelectItem>
                <SelectItem value="3 Chambres salon">3 Chambres salon</SelectItem>
                <SelectItem value="Appartement">Appartement</SelectItem>
                <SelectItem value="Bureau">Bureau</SelectItem>
                <SelectItem value="RDC">RDC</SelectItem>
                <SelectItem value="R+1">R+1</SelectItem>
                <SelectItem value="R+2">R+2</SelectItem>
                <SelectItem value="R+3">R+3</SelectItem>
                <SelectItem value="R+4">R+4</SelectItem>
              </SelectContent>
            </Select>
            <InputError message={errors.type} />
          </div>
        )}

        {!isBuildingOrComplex && (
          <>
            <div className="space-y-2">
              <Label htmlFor="surface_area">Surface (m²)</Label>
              <Input
                id="surface_area"
                type="number"
                value={data.surface_area}
                onChange={(e) => setData("surface_area", e.target.value)}
              />
              <InputError message={errors.surface_area} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bedrooms_count">Nombre de chambres</Label>
              <Input
                id="bedrooms_count"
                type="number"
                value={data.bedrooms_count}
                onChange={(e) => setData("bedrooms_count", e.target.value)}
              />
              <InputError message={errors.bedrooms_count} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bathrooms_count">Nombre de toilette</Label>
              <Input
                id="bathrooms_count"
                type="number"
                value={data.bathrooms_count}
                onChange={(e) => setData("bathrooms_count", e.target.value)}
              />
              <InputError message={errors.bathrooms_count} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="living_rooms_count">Nombre de salon</Label>
              <Input
                id="living_rooms_count"
                type="number"
                value={data.living_rooms_count}
                onChange={(e) => setData("living_rooms_count", e.target.value)}
              />
              <InputError message={errors.living_rooms_count} />
            </div>

            <div className="flex flex-col gap-4 pt-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has_kitchen"
                  checked={data.has_kitchen}
                  onCheckedChange={(checked) => setData("has_kitchen", !!checked)}
                />
                <Label htmlFor="has_kitchen">Cuisine</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has_solar_panels"
                  checked={data.has_solar_panels}
                  onCheckedChange={(checked) => setData("has_solar_panels", !!checked)}
                />
                <Label htmlFor="has_solar_panels">Présence de panneaux solaires</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has_generator"
                  checked={data.has_generator}
                  onCheckedChange={(checked) => setData("has_generator", !!checked)}
                />
                <Label htmlFor="has_generator">Présence de groupe électrogène</Label>
              </div>
            </div>
          </>
        )}

        <div className="space-y-2">
          <Label htmlFor="status">Statut</Label>
          <Select onValueChange={(value: any) => setData("status", value)} value={data.status}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Disponible</SelectItem>
              <SelectItem value="sold">Vendu</SelectItem>
              <SelectItem value="rented">Loué</SelectItem>
            </SelectContent>
          </Select>
          <InputError message={errors.status} />
        </div>
      </div>

      {isBuildingOrComplex && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-primary">Appartements</h3>
            <Button type="button" variant="outline" size="sm" onClick={addApartment} className="h-8">
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un appartement
            </Button>
          </div>
          <div className="space-y-4">
            {data.apartments.map((apt, index) => (
              <div key={index} className="grid gap-3 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Appartement #{index + 1}</span>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeApartment(index)}>
                    <Trash className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Titre / N° Appartement</Label>
                    <Input
                      className="h-8 text-sm"
                      value={apt.title}
                      onChange={(e) => updateApartment(index, "title", e.target.value)}
                      placeholder="Ex: A101"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Étage</Label>
                    <Input
                      className="h-8 text-sm"
                      type="number"
                      value={apt.floor_number}
                      onChange={(e) => updateApartment(index, "floor_number", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Prix de location</Label>
                    <Input
                      className="h-8 text-sm"
                      type="number"
                      value={apt.price}
                      onChange={(e) => updateApartment(index, "price", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Surface (m²)</Label>
                    <Input
                      className="h-8 text-sm"
                      type="number"
                      value={apt.surface_area}
                      onChange={(e) => updateApartment(index, "surface_area", e.target.value)}
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox
                      checked={apt.has_kitchen}
                      onCheckedChange={(checked) => updateApartment(index, "has_kitchen", !!checked)}
                    />
                    <Label className="text-xs">Cuisine</Label>
                  </div>
                </div>
              </div>
            ))}
            {data.apartments.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Aucun appartement ajouté.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="sticky bottom-0 right-0 left-0 bg-background pt-4 pb-2 flex justify-end gap-2 border-t mt-6">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Annuler
        </Button>
        <Button type="submit" disabled={processing} className="flex-1">
          {property ? "Mettre à jour" : "Enregistrer"}
        </Button>
      </div>
    </form>
  )
}
