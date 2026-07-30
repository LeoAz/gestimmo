import { useForm } from "@inertiajs/react"
import * as React from "react"
import { toast } from "sonner"
import { addApartment as addApartmentAction } from '@/actions/App/Http/Controllers/PropertyController'
import InputError from "@/components/input-error"
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
import type { Apartment } from "../types"

interface ApartmentModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  propertyId: number
  apartment: Apartment | null
  onSuccess: () => void
}

export function ApartmentModal({ isOpen, onOpenChange, propertyId, apartment, onSuccess }: ApartmentModalProps) {
  const { data, setData, post, put, processing, errors, reset } = useForm({
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

  React.useEffect(() => {
    if (apartment) {
      setData({
        title: apartment.title || "",
        floor_number: apartment.floor_number?.toString() || "",
        price: apartment.price || "",
        surface_area: apartment.surface_area || "",
        rooms_count: "",
        bedrooms_count: apartment.bedrooms_count?.toString() || "",
        bathrooms_count: apartment.bathrooms_count?.toString() || "",
        living_rooms_count: apartment.living_rooms_count?.toString() || "",
        balconies_count: apartment.balconies_count?.toString() || "",
        kitchens_count: apartment.kitchens_count?.toString() || "",
        has_kitchen: apartment.has_kitchen,
        status: (apartment.status as any) || "available",
      })
    } else {
      reset()
    }
  }, [apartment, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (apartment) {
      put(`/properties/${apartment.id}`, {
        onSuccess: () => {
          onOpenChange(false)
          onSuccess()
          toast.success("Appartement mis à jour avec succès")
        }
      })
    } else {
      post(addApartmentAction({ property: propertyId }).url, {
        onSuccess: () => {
          onOpenChange(false)
          reset()
          onSuccess()
          toast.success("Appartement ajouté avec succès")
        }
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{apartment ? "Modifier l'appartement" : "Ajouter un appartement"}</DialogTitle>
          <DialogDescription>
            {apartment ? "Modifiez les informations de l'appartement." : "Saisissez les informations du nouvel appartement pour ce bien."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={processing}>
              {apartment ? "Mettre à jour" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
