<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class LatePaymentNotification extends Notification
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(public array $rentalData)
    {
        //
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'rental_id' => $this->rentalData['id'],
            'property_title' => $this->rentalData['property_title'],
            'tenant_name' => $this->rentalData['tenant_name'],
            'amount' => $this->rentalData['amount'],
            'due_date' => $this->rentalData['due_date'],
            'message' => "Retard de paiement pour {$this->rentalData['property_title']} par {$this->rentalData['tenant_name']}.",
        ];
    }
}
