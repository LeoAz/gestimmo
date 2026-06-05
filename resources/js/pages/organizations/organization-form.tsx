import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { toast } from 'sonner';

import {
    index as organizationIndex,
    store as organizationStore,
    update as organizationUpdate,
} from '@/actions/App/Http/Controllers/Settings/OrganizationController';
import { FormAlert } from '@/components/form-alert';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Organization {
    id?: number;
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    city: string | null;
    country: string | null;
    tax_number: string | null;
    registration_number: string | null;
    bank_details: string | null;
    logo?: string | null;
    logo_url?: string | null;
}

interface Props {
    organization: Organization;
    isEdit?: boolean;
}

export default function OrganizationForm({ organization, isEdit = false }: Props) {
    const { status } = usePage<any>().props;

    const { data, setData, post, processing, errors } = useForm({
        name: organization?.name || '',
        address: organization?.address || '',
        phone: organization?.phone || '',
        email: organization?.email || '',
        website: organization?.website || '',
        city: organization?.city || '',
        country: organization?.country || '',
        tax_number: organization?.tax_number || '',
        registration_number: organization?.registration_number || '',
        bank_details: organization?.bank_details || '',
        logo: null as File | null,
        _method: isEdit ? 'PATCH' : 'POST',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const url = isEdit ? organizationUpdate({ organization: organization.id! }) : organizationStore();
        post(url, {
            onSuccess: () => {
                toast.success(isEdit ? 'Organisation mise à jour' : 'Organisation créée');
            },
        });
    };

    return (
        <div className="space-y-6 p-4">
            <Head title={isEdit ? "Modifier l'organisation" : "Nouvelle organisation"} />

            <div className="flex items-center justify-between">
                <Heading
                    title={isEdit ? "Modifier l'organisation" : "Ajouter une organisation"}
                    description={isEdit ? "Mettez à jour les informations de l'organisation." : "Remplissez les informations pour créer une nouvelle organisation."}
                />
                <Button variant="outline" asChild>
                    <Link href={organizationIndex()}>Retour à la liste</Link>
                </Button>
            </div>

            <FormAlert message={status === 'organization-updated' ? 'Les informations ont été enregistrées.' : ''} />

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Colonne de gauche : Logo et informations principales */}
                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle>Identité</CardTitle>
                            <CardDescription>Logo et nom de la structure.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex flex-col items-center gap-4">
                                <Label className="self-start">Logo de l'organisation</Label>
                                <div className="relative w-40 h-40 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50 group">
                                    {organization?.logo_url ? (
                                        <img src={organization.logo_url} alt="Logo" className="w-full h-full object-contain p-2" />
                                    ) : (
                                        <span className="text-gray-400 text-sm">Pas de logo</span>
                                    )}
                                </div>
                                <Input
                                    type="file"
                                    className="cursor-pointer"
                                    onChange={(e) => setData('logo', e.target.files?.[0] || null)}
                                    accept="image/*"
                                />
                                <p className="text-xs text-muted-foreground text-center">
                                    Recommandé : Format carré (PNG, JPG)
                                </p>
                                <InputError message={errors.logo} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name">Nom de la société</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                    placeholder="Ex: Ma Société Immobilière"
                                />
                                <InputError message={errors.name} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Colonne du milieu : Coordonnées */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Coordonnées & Localisation</CardTitle>
                            <CardDescription>Comment contacter l'organisation et où la trouver.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email de contact</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email || ''}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="contact@societe.com"
                                    />
                                    <InputError message={errors.email} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">Téléphone</Label>
                                    <Input
                                        id="phone"
                                        value={data.phone || ''}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        placeholder="+229 ..."
                                    />
                                    <InputError message={errors.phone} />
                                </div>

                                <div className="md:col-span-2 space-y-2">
                                    <Label htmlFor="website">Site web</Label>
                                    <Input
                                        id="website"
                                        value={data.website || ''}
                                        onChange={(e) => setData('website', e.target.value)}
                                        placeholder="https://www.societe.com"
                                    />
                                    <InputError message={errors.website} />
                                </div>

                                <div className="md:col-span-2 space-y-2">
                                    <Label htmlFor="address">Adresse physique</Label>
                                    <Input
                                        id="address"
                                        value={data.address || ''}
                                        onChange={(e) => setData('address', e.target.value)}
                                        placeholder="Ex: Lot 123, quartier ..."
                                    />
                                    <InputError message={errors.address} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="city">Ville</Label>
                                    <Input
                                        id="city"
                                        value={data.city || ''}
                                        onChange={(e) => setData('city', e.target.value)}
                                    />
                                    <InputError message={errors.city} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="country">Pays</Label>
                                    <Input
                                        id="country"
                                        value={data.country || ''}
                                        onChange={(e) => setData('country', e.target.value)}
                                    />
                                    <InputError message={errors.country} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Informations Légales et Bancaires sur toute la largeur */}
                    <Card className="lg:col-span-3">
                        <CardHeader>
                            <CardTitle>Informations Légales & Bancaires</CardTitle>
                            <CardDescription>Détails administratifs figurant sur les documents financiers.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="tax_number">Numéro IFU / Fiscal</Label>
                                    <Input
                                        id="tax_number"
                                        value={data.tax_number || ''}
                                        onChange={(e) => setData('tax_number', e.target.value)}
                                        placeholder="Identifiant Fiscal Unique"
                                    />
                                    <InputError message={errors.tax_number} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="registration_number">RCCM / Enregistrement</Label>
                                    <Input
                                        id="registration_number"
                                        value={data.registration_number || ''}
                                        onChange={(e) => setData('registration_number', e.target.value)}
                                        placeholder="Registre du Commerce"
                                    />
                                    <InputError message={errors.registration_number} />
                                </div>

                                <div className="md:col-span-2 space-y-2">
                                    <Label htmlFor="bank_details">Coordonnées Bancaires</Label>
                                    <Textarea
                                        id="bank_details"
                                        value={data.bank_details || ''}
                                        onChange={(e) => setData('bank_details', e.target.value)}
                                        rows={4}
                                        placeholder="Banque, IBAN, SWIFT, RIB..."
                                    />
                                    <InputError message={errors.bank_details} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex justify-end gap-4 bg-muted/50 p-4 rounded-lg border border-dashed">
                    <Button type="submit" size="lg" disabled={processing}>
                        {processing ? 'Enregistrement...' : isEdit ? 'Enregistrer les modifications' : 'Créer l\'organisation'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
