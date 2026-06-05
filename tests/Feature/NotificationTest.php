<?php

use App\Models\User;
use App\Notifications\LatePaymentNotification;
use Inertia\Testing\AssertableInertia as Assert;

test('notifications are paginated', function () {
    $user = User::factory()->create();

    // Create 15 notifications
    for ($i = 0; $i < 15; $i++) {
        $user->notify(new LatePaymentNotification([
            'id' => 1,
            'property_title' => "Property $i",
            'tenant_name' => 'John Doe',
            'amount' => 1000,
            'due_date' => now()->toDateString(),
        ]));
    }

    $this->actingAs($user)
        ->get(route('notifications.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('notifications/index')
            ->has('notifications.data', 10)
            ->has('notifications.links')
        );
});

test('unread notification count decreases when marked as read', function () {
    $user = User::factory()->create();

    $user->notify(new LatePaymentNotification([
        'id' => 1,
        'property_title' => 'Property 1',
        'tenant_name' => 'John Doe',
        'amount' => 1000,
        'due_date' => now()->toDateString(),
    ]));

    $notification = $user->unreadNotifications->first();

    $this->actingAs($user)
        ->get(route('notifications.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('auth.unreadNotificationsCount', 1)
        );

    $this->actingAs($user)
        ->patch(route('notifications.mark-as-read', $notification->id))
        ->assertRedirect();

    $this->actingAs($user)
        ->get(route('notifications.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('auth.unreadNotificationsCount', 0)
        );
});

test('mark all as read updates unread count', function () {
    $user = User::factory()->create();

    for ($i = 0; $i < 5; $i++) {
        $user->notify(new LatePaymentNotification([
            'id' => $i,
            'property_title' => "Property $i",
            'tenant_name' => 'John Doe',
            'amount' => 1000,
            'due_date' => now()->toDateString(),
        ]));
    }

    $this->actingAs($user)
        ->get(route('notifications.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('auth.unreadNotificationsCount', 5)
        );

    $this->actingAs($user)
        ->post(route('notifications.mark-all-as-read'))
        ->assertRedirect();

    $this->actingAs($user)
        ->get(route('notifications.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('auth.unreadNotificationsCount', 0)
        );
});
