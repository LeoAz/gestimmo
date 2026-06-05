import { useForm } from "@inertiajs/react"
import * as React from "react"
import { toast } from "sonner"

import InputError from "@/components/input-error"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { store, update } from "@/routes/property-categories"

interface Category {
  id: number
  name: string
  slug: string
  description: string | null
}

interface CategoryFormProps {
  category?: Category | null
  onSuccess: () => void
  onCancel: () => void
}

export function CategoryForm({ category, onSuccess, onCancel }: CategoryFormProps) {
  const { data, setData, post, put, processing, errors, reset } = useForm({
    name: category?.name || "",
    description: category?.description || "",
  })

  React.useEffect(() => {
    if (category) {
      setData({
        name: category.name,
        description: category.description || "",
      })
    } else {
      reset()
    }
  }, [category])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (category) {
      put(update({ property_category: category.id }), {
        onSuccess: () => {
          toast.success("Catégorie mise à jour avec succès")
          onSuccess()
        },
      })
    } else {
      post(store(), {
        onSuccess: () => {
          toast.success("Catégorie créée avec succès")
          onSuccess()
          reset()
        },
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nom</Label>
        <Input
          id="name"
          value={data.name}
          onChange={(e) => setData("name", e.target.value)}
          placeholder="Ex: Villa, Immeuble..."
          required
        />
        <InputError message={errors.name} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={data.description}
          onChange={(e) => setData("description", e.target.value)}
          placeholder="Description facultative du type de bien"
          rows={4}
        />
        <InputError message={errors.description} />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={processing}>
          {category ? "Mettre à jour" : "Enregistrer"}
        </Button>
      </div>
    </form>
  )
}
