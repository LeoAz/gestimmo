import { Link, useForm } from "@inertiajs/react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Plus, X } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { Combobox } from "@/components/ui/combobox"
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface InvoiceItem {
  id?: number
  designation: string
  period: string | null
  months_count: number
  total: number
}

interface Rental {
  id: number
  property: { title: string }
  tenant: { first_name: string; last_name: string }
  rent_amount: string
}

interface InvoiceFormProps {
  rentals: Rental[]
  initialData?: any
  onSubmit: (data: any) => void
  processing: boolean
  errors: any
}

export function InvoiceForm({ rentals, initialData, onSubmit, processing, errors }: InvoiceFormProps) {
  const { data, setData } = useForm(initialData || {
    rental_id: "",
    date: format(new Date(), "yyyy-MM-dd"),
    due_date: "",
    type: "Loyer",
    notes: "",
    items: [{ designation: "Loyer", period: format(new Date(), "MMMM yyyy", { locale: fr }), months_count: 1, total: 0 }],
  })

  // S'assurer que les données du formulaire sont synchronisées si initialData change (cas de l'édition)
  React.useEffect(() => {
    if (initialData) {
        Object.keys(initialData).forEach(key => {
            setData(key as any, initialData[key])
        })
    }
  }, [initialData])

  const addItem = () => {
    setData("items", [...data.items, { designation: "", period: "", months_count: 1, total: 0 }])
  }

  const removeItem = (index: number) => {
    const newItems = [...data.items]
    newItems.splice(index, 1)
    setData("items", newItems)
  }

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...data.items]
    newItems[index] = { ...newItems[index], [field]: value }
    setData("items", newItems)
  }

  const handleRentalChange = (rentalId: string) => {
    const rental = rentals.find(r => r.id === parseInt(rentalId))

    if (rental) {
        setData(d => ({
            ...d,
            rental_id: rentalId,
            items: [{
                designation: "Loyer mensuel",
                period: format(new Date(), "MMMM yyyy", { locale: fr }),
                months_count: 1,
                total: parseFloat(rental.rent_amount)
            }]
        }))
    } else {
        setData("rental_id", rentalId)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="rental">Location / Locataire</Label>
          <Combobox
            options={rentals.map((rental) => ({
              value: rental.id.toString(),
              label: `${rental.property.title} - ${rental.tenant.first_name} ${rental.tenant.last_name}`,
            }))}
            value={data.rental_id?.toString() || ""}
            onValueChange={handleRentalChange}
            placeholder="Sélectionner une location"
            disabled={!!initialData?.id} // Désactiver en mode édition si on veut pas changer la location
          />
          {errors.rental_id && <p className="text-xs text-destructive">{errors.rental_id}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Type de facture</Label>
          <Select onValueChange={(v) => setData("type", v)} value={data.type}>
              <SelectTrigger>
                  <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="Loyer">Loyer</SelectItem>
                  <SelectItem value="Caution">Caution</SelectItem>
                  <SelectItem value="Autres">Autres</SelectItem>
              </SelectContent>
          </Select>
          {errors.type && <p className="text-xs text-destructive">{errors.type}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
              <Label htmlFor="date">Date de facture</Label>
              <DatePicker
                date={data.date ? new Date(data.date) : undefined}
                onChange={(date) => setData("date", date ? format(date, "yyyy-MM-dd") : "")}
              />
              {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
          </div>
          <div className="space-y-2">
              <Label htmlFor="due_date">Date d'échéance</Label>
              <DatePicker
                date={data.due_date ? new Date(data.due_date) : undefined}
                onChange={(date) => setData("due_date", date ? format(date, "yyyy-MM-dd") : "")}
              />
              {errors.due_date && <p className="text-xs text-destructive">{errors.due_date}</p>}
          </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Détails (Items)</Label>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="mr-2 h-4 w-4" /> Ajouter une ligne
          </Button>
        </div>

        <div className="space-y-3">
          {data.items.map((item: any, index: number) => (
            <div key={index} className="grid grid-cols-1 sm:grid-cols-[1.5fr_1.5fr_100px_150px_auto] gap-4 items-end border p-4 rounded-md relative bg-card">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase text-muted-foreground">Désignation</Label>
                <Input value={item.designation} onChange={(e) => updateItem(index, "designation", e.target.value)} placeholder="Ex: Loyer" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase text-muted-foreground">Période</Label>
                <Input value={item.period || ""} onChange={(e) => updateItem(index, "period", e.target.value)} placeholder="Ex: Mai 2026" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase text-muted-foreground">Nb. Mois</Label>
                <Input type="number" value={item.months_count} onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    const rental = rentals.find(r => r.id === parseInt(data.rental_id));
                    const basePrice = rental ? parseFloat(rental.rent_amount) : 0;
                    updateItem(index, "months_count", val);
                    updateItem(index, "total", basePrice * val);
                }} />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase text-muted-foreground">Montant Total</Label>
                <Input type="number" value={item.total} onChange={(e) => updateItem(index, "total", parseFloat(e.target.value))} />
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)} disabled={data.items.length === 1} className="text-destructive mb-0.5">
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" value={data.notes || ""} onChange={(e) => setData("notes", e.target.value)} placeholder="Informations complémentaires..." rows={4} />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Link href="/invoices">
            <Button type="button" variant="outline">Annuler</Button>
        </Link>
        <Button type="submit" disabled={processing}>
            {initialData?.id ? "Mettre à jour la facture" : "Générer la facture"}
        </Button>
      </div>
    </form>
  )
}
