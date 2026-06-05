// Components
import { Form, Head, usePage } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormAlert } from '@/components/form-alert';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login } from '@/routes';
import { email } from '@/routes/password';

export default function ForgotPassword({ status }: { status?: string }) {
    const pageErrors = usePage().props.errors;

    return (
        <>
            <Head title="Mot de passe oublié" />

            <div className="space-y-6">
                <Form {...email.form()}>
                    {({ processing, errors }) => (
                        <>
                            <FormAlert message={errors.error || pageErrors?.error || status} />

                            <div className="grid gap-2">
                                <Label htmlFor="email">Adresse email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    autoComplete="off"
                                    autoFocus
                                    placeholder="email@exemple.com"
                                />

                                <InputError message={errors.email} />
                            </div>

                            <div className="my-6 flex items-center justify-start">
                                <Button
                                    className="w-full"
                                    disabled={processing}
                                    data-test="email-password-reset-link-button"
                                >
                                    {processing && (
                                        <LoaderCircle className="h-4 w-4 animate-spin" />
                                    )}
                                    Envoyer le lien de réinitialisation
                                </Button>
                            </div>
                        </>
                    )}
                </Form>

                <div className="space-x-1 text-center text-sm text-muted-foreground">
                    <span>Ou, retourner à la page de</span>
                    <TextLink href={login()}>connexion</TextLink>
                </div>
            </div>
        </>
    );
}

ForgotPassword.layout = {
    title: 'Mot de passe oublié',
    description: 'Entrez votre adresse email pour recevoir un lien de réinitialisation',
};
