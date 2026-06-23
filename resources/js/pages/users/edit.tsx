import { Head, Link, useForm } from "@inertiajs/react"
import { ArrowLeft, Loader2 } from "lucide-react"
import * as React from "react"

import { index, update } from "@/actions/App/Http/Controllers/UserController"

import Heading from "@/components/heading"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { BreadcrumbItem } from "@/types"

interface User {
  id: number
  name: string
  email: string
}

interface Props {
  user: User
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Utilisateurs",
    href: "/users",
  },
  {
    title: "Modifier",
    href: "#",
  },
]

export default function Edit({ user }: Props) {
  const { data, setData, patch, processing, errors, reset } = useForm({
    name: user.name,
    email: user.email,
    password: "",
    password_confirmation: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    patch(update(user.id).url, {
        onFinish: () => reset('password', 'password_confirmation'),
    })
  }

  return (
    <>
      <Head title="Modifier l'utilisateur" />

      <div className="flex h-full flex-1 flex-col gap-4 p-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={index().url}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Heading title="Modifier l'utilisateur" description={`Modification du compte de ${user.name}`} />
        </div>

        <div className="max-w-2xl">
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom complet</Label>
                  <Input
                    id="name"
                    value={data.name}
                    onChange={(e) => setData("name", e.target.value)}
                    placeholder="Ex: Jean Dupont"
                    required
                  />
                  {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Adresse Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={data.email}
                    onChange={(e) => setData("email", e.target.value)}
                    placeholder="Ex: jean.dupont@exemple.com"
                    required
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>

                <div className="p-4 border border-blue-100 bg-blue-50 rounded-md">
                    <p className="text-sm text-blue-800">
                        Laissez les champs du mot de passe vides si vous ne souhaitez pas le modifier.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Nouveau mot de passe</Label>
                    <Input
                      id="password"
                      type="password"
                      value={data.password}
                      onChange={(e) => setData("password", e.target.value)}
                    />
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password_confirmation">Confirmer le nouveau mot de passe</Label>
                    <Input
                      id="password_confirmation"
                      type="password"
                      value={data.password_confirmation}
                      onChange={(e) => setData("password_confirmation", e.target.value)}
                    />
                    {errors.password_confirmation && <p className="text-sm text-destructive">{errors.password_confirmation}</p>}
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="outline" asChild disabled={processing}>
                    <Link href={index().url}>Annuler</Link>
                  </Button>
                  <Button type="submit" disabled={processing}>
                    {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Mettre à jour l'utilisateur
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
