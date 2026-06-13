import { Head, Link, useForm } from "@inertiajs/react"
import { Plus, Trash2 } from "lucide-react"
import * as React from "react"

import Heading from "@/components/heading"
import { Button } from "@/components/ui/button"
import { Combobox } from "@/components/ui/combobox"
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import AppLayout from "@/layouts/app-layout"

interface Props {
    properties: { id: number; title: string }[]
}

export default function Create({ properties }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        property_id: "",
        date: new Date().toISOString().split('T')[0],
        provider: "",
        notes: "",
        items: [
            { description: "", quantity: 1, unit_price: 0 }
        ]
    })

    const propertyOptions = React.useMemo(() =>
        properties.map(p => ({ value: p.id.toString(), label: p.title })),
    [properties])

    const addItem = () => {
        setData('items', [
            ...data.items,
            { description: "", quantity: 1, unit_price: 0 }
        ])
    }

    const removeItem = (index: number) => {
        const newItems = [...data.items]
        newItems.splice(index, 1)
        setData('items', newItems)
    }

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...data.items]
        newItems[index] = { ...newItems[index], [field]: value }
        setData('items', newItems)
    }

    const calculateTotal = () => {
        return data.items.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.unit_price)), 0)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        post('/expenses')
    }

    return (
        <>
            <Head title="Saisir une dépense" />

            <div className="flex flex-col gap-6 p-4 sm:p-8">
                <div className="flex justify-between items-center">
                    <Heading title="Nouvelle Dépense" description="Saisissez les détails de la dépense et ses articles." />
                    <Button variant="ghost" asChild>
                        <Link href="/expenses">Annuler</Link>
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="property_id">Bien Immobilier</Label>
                            <Combobox
                                options={propertyOptions}
                                value={data.property_id}
                                onValueChange={(v) => setData('property_id', v)}
                                placeholder="Sélectionnez un bien"
                            />
                            {errors.property_id && <p className="text-sm text-destructive">{errors.property_id}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="date">Date</Label>
                            <DatePicker
                                date={data.date ? new Date(data.date) : undefined}
                                onChange={(date) => setData('date', date ? date.toISOString().split('T')[0] : "")}
                            />
                            {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="provider">Prestataire</Label>
                            <Input
                                id="provider"
                                placeholder="Nom du prestataire"
                                value={data.provider}
                                onChange={(e) => setData('provider', e.target.value)}
                            />
                            {errors.provider && <p className="text-sm text-destructive">{errors.provider}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                placeholder="Informations complémentaires..."
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-lg">Détails des dépenses</h3>
                            <Button type="button" variant="outline" size="sm" onClick={addItem}>
                                <Plus className="h-4 w-4 mr-2" /> Ajouter un article
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {data.items.map((item, index) => (
                                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end border-b pb-4 last:border-0 last:pb-0">
                                    <div className="md:col-span-5 space-y-2">
                                        <Label>Description</Label>
                                        <Input
                                            placeholder="Ex: Réparation plomberie"
                                            value={item.description}
                                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <Label>Quantité</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={item.quantity}
                                            onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <Label>Prix Unitaire</Label>
                                        <Input
                                            type="number"
                                            value={item.unit_price}
                                            onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <Label>Total</Label>
                                        <div className="h-10 flex items-center px-3 bg-muted rounded-md font-medium">
                                            {(Number(item.quantity) * Number(item.unit_price)).toLocaleString()} FCFA
                                        </div>
                                    </div>
                                    <div className="md:col-span-1">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive"
                                            onClick={() => removeItem(index)}
                                            disabled={data.items.length === 1}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end pt-4 border-t">
                            <div className="text-right">
                                <p className="text-sm text-muted-foreground">Montant Total</p>
                                <p className="text-2xl font-bold">{calculateTotal().toLocaleString()} FCFA</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" size="lg" disabled={processing}>
                            {processing ? "Enregistrement..." : "Enregistrer la dépense"}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    )
}

Create.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[
        { title: "Dépenses", href: "/expenses" },
        { title: "Saisir", href: "/expenses/create" }
    ]}>
        {page}
    </AppLayout>
)
