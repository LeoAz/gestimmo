<?php

namespace App\Console\Commands;

use App\Models\Rental;
use App\Models\User;
use App\Notifications\LatePaymentNotification;
use Carbon\Carbon;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('app:check-late-payments')]
#[Description('Vérifie les retards de paiement et envoie des notifications')]
class CheckLatePayments extends Command
{
    /**
     * Execute the console command.
     */
    public function handle()
    {
        $today = Carbon::today();

        $lateRentals = Rental::with(['property', 'tenant'])
            ->where('status', 'active')
            ->where('next_payment_date', '<', $today)
            ->get();

        if ($lateRentals->isEmpty()) {
            $this->info('Aucun nouveau retard détecté.');

            return;
        }

        $users = User::all();

        foreach ($lateRentals as $rental) {
            $data = [
                'id' => $rental->id,
                'property_title' => $rental->property->title,
                'tenant_name' => "{$rental->tenant->first_name} {$rental->tenant->last_name}",
                'amount' => $rental->rent_amount,
                'due_date' => $rental->next_payment_date,
            ];

            foreach ($users as $user) {
                // Vérifier si une notification existe déjà pour ce rental_id dans les notifications non lues
                $exists = $user->unreadNotifications()
                    ->where('data->rental_id', $rental->id)
                    ->exists();

                if (! $exists) {
                    $user->notify(new LatePaymentNotification($data));
                }
            }
        }

        $this->info(count($lateRentals).' retards traités.');
    }
}
