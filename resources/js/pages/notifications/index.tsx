import { Head, router, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Bell, Eye, EyeOff, Trash2 } from 'lucide-react';

import { Pagination } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { SharedData } from '@/types';

interface Notification {
    id: string;
    type: string;
    data: {
        message: string;
        property_title: string;
        tenant_name: string;
        amount: number;
        due_date: string;
    };
    read_at: string | null;
    created_at: string;
}

interface Props {
    notifications: {
        data: Notification[];
        links: {
            url: string | null;
            label: string;
            active: boolean;
        }[];
    };
}

export default function NotificationsIndex({ notifications }: Props) {
    const { auth } = usePage<SharedData>().props;

    const markAsRead = (id: string) => {
        router.patch(route('notifications.mark-as-read', id));
    };

    const markAsUnread = (id: string) => {
        router.patch(route('notifications.mark-as-unread', id));
    };

    const markAllAsRead = () => {
        router.post(route('notifications.mark-all-as-read'));
    };

    const deleteNotification = (id: string) => {
        if (confirm('Voulez-vous supprimer cette notification ?')) {
            router.delete(route('notifications.destroy', id));
        }
    };

    return (
        <div className="mx-auto w-full max-w-4xl px-4 py-8">
            <Head title="Notifications" />

            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <h1 className="flex items-center gap-2 text-2xl font-bold">
                        <Bell className="h-6 w-6" />
                        Notifications
                        {auth.unreadNotificationsCount > 0 && (
                            <Badge variant="destructive" className="ml-1 flex h-6 w-6 items-center justify-center rounded-full p-0 text-xs">
                                {auth.unreadNotificationsCount}
                            </Badge>
                        )}
                    </h1>
                    {notifications.data.some((n) => !n.read_at) && (
                        <Button onClick={markAllAsRead} variant="outline" size="sm">
                            Tout marquer comme lu
                        </Button>
                    )}
                </div>

                <div className="grid gap-4">
                    {notifications.data.length > 0 ? (
                        <>
                            {notifications.data.map((notification) => (
                                <Card key={notification.id} className={notification.read_at ? 'opacity-70' : 'border-primary/50'}>
                                    <CardContent className="flex items-center justify-between gap-4 p-4">
                                        <div className="flex-1">
                                            <div className="mb-1 flex items-center gap-2">
                                                {!notification.read_at && <Badge className="h-2 w-2 rounded-full p-0" />}
                                                <span className="font-semibold">{notification.data.message}</span>
                                                <span className="text-xs text-muted-foreground">{format(new Date(notification.created_at), 'Pp', { locale: fr })}</span>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                Montant: {notification.data.amount.toLocaleString('fr-FR')} FCFA | Date d'échéance:{' '}
                                                {format(new Date(notification.data.due_date), 'dd MMMM yyyy', { locale: fr })}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {notification.read_at ? (
                                                <Button variant="ghost" size="icon" onClick={() => markAsUnread(notification.id)} title="Marquer comme non lu">
                                                    <EyeOff className="h-4 w-4" />
                                                </Button>
                                            ) : (
                                                <Button variant="ghost" size="icon" onClick={() => markAsRead(notification.id)} title="Marquer comme lu">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => deleteNotification(notification.id)}
                                                title="Supprimer"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            <Pagination links={notifications.links} />
                        </>
                    ) : (
                        <Card>
                            <CardContent className="p-8 text-center text-muted-foreground">
                                <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                <p>Aucune notification pour le moment.</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}

NotificationsIndex.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[{ title: 'Notifications', href: '/notifications' }]}>{page}</AppLayout>
);
