<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Property;
use App\Models\Rental;
use Carbon\Carbon;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __invoke()
    {
        $today = Carbon::today();
        $startOfMonth = Carbon::now()->startOfMonth();
        $endOfMonth = Carbon::now()->endOfMonth();

        // 1. Available properties (villas and apartments)
        $availableProperties = Property::with('category')
            ->where('status', 'available')
            ->whereHas('category', function ($query) {
                $query->whereIn('slug', ['villa', 'appartement']);
            })
            ->get();

        // 2. Revenue evolution (last 6 months)
        $revenueEvolution = Payment::selectRaw(
            config('database.default') === 'sqlite'
                ? 'strftime("%Y-%m", payment_date) as month, SUM(amount) as total'
                : 'DATE_FORMAT(payment_date, "%Y-%m") as month, SUM(amount) as total'
        )
            ->where('payment_date', '>=', Carbon::now()->subMonths(6)->startOfMonth())
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->map(function ($item) {
                return [
                    'month' => Carbon::parse($item->month.'-01')->translatedFormat('M Y'),
                    'revenue' => (float) $item->total,
                ];
            });

        // 3. Upcoming payments (next 30 days) and Monthly Recovery Estimation
        $upcomingPayments = Rental::with(['property', 'tenant'])
            ->where('status', 'active')
            ->where('next_payment_date', '>=', $today)
            ->where('next_payment_date', '<=', $today->copy()->addDays(30))
            ->orderBy('next_payment_date')
            ->get();

        $estimatedRecovery = Rental::where('status', 'active')
            ->whereBetween('next_payment_date', [$startOfMonth, $endOfMonth])
            ->sum('rent_amount');

        $actualRecovery = Payment::whereBetween('payment_date', [$startOfMonth, $endOfMonth])
            ->where('type', 'rent')
            ->sum('amount');

        // 4. Late payments
        $latePayments = Rental::with(['property', 'tenant'])
            ->where('status', 'active')
            ->where('next_payment_date', '<', $today)
            ->orderBy('next_payment_date')
            ->get();

        return Inertia::render('dashboard', [
            'availableProperties' => $availableProperties,
            'revenueEvolution' => $revenueEvolution,
            'upcomingPayments' => $upcomingPayments,
            'recoveryStats' => [
                'estimated' => (float) $estimatedRecovery,
                'actual' => (float) $actualRecovery,
            ],
            'latePayments' => $latePayments,
        ]);
    }
}
