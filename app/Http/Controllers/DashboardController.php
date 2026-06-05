<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Property;
use App\Models\Rental;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __invoke(Request $request)
    {
        $startDate = $request->input('start_date') ? Carbon::parse($request->input('start_date')) : Carbon::now()->startOfYear();
        $endDate = $request->input('end_date') ? Carbon::parse($request->input('end_date')) : Carbon::now()->endOfYear();

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

        // New: Property availability stats
        $totalProperties = Property::whereHas('category', function ($query) {
            $query->whereIn('slug', ['villa', 'appartement']);
        })->count();

        $rentedProperties = Property::where('status', 'rented')
            ->whereHas('category', function ($query) {
                $query->whereIn('slug', ['villa', 'appartement']);
            })->count();

        $availabilityStats = [
            ['status' => 'availability', 'count' => $availableProperties->count(), 'fill' => 'var(--color-availability)'],
            ['status' => 'rented', 'count' => $rentedProperties, 'fill' => 'var(--color-rented)'],
            ['status' => 'other', 'count' => max(0, $totalProperties - $availableProperties->count() - $rentedProperties), 'fill' => 'var(--color-other)'],
        ];

        // 2. Revenue evolution (based on filtered dates)
        $revenueEvolution = Payment::selectRaw(
            config('database.default') === 'sqlite'
                ? 'strftime("%Y-%m", payment_date) as month, SUM(amount) as total'
                : 'DATE_FORMAT(payment_date, "%Y-%m") as month, SUM(amount) as total'
        )
            ->whereBetween('payment_date', [$startDate, $endDate])
            ->where('status', 'paid')
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->map(function ($item) {
                return [
                    'month' => Carbon::parse($item->month.'-01')->translatedFormat('M Y'),
                    'revenue' => (float) $item->total,
                ];
            });

        // New: Debts to recover (Créances à recouvrer) over time
        $debtEvolution = Payment::selectRaw(
            config('database.default') === 'sqlite'
                ? 'strftime("%Y-%m", period_start) as month, SUM(amount) as total'
                : 'DATE_FORMAT(period_start, "%Y-%m") as month, SUM(amount) as total'
        )
            ->where('status', 'pending')
            ->whereBetween('period_start', [$startDate, $endDate])
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->map(function ($item) {
                return [
                    'month' => Carbon::parse($item->month.'-01')->translatedFormat('M Y'),
                    'amount' => (float) $item->total,
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
            ->where('status', 'paid')
            ->sum('amount');

        // 4. Late payments & Pending Invoices (Créances)
        $latePayments = Rental::with(['property', 'tenant'])
            ->where('status', 'active')
            ->where('next_payment_date', '<', $today)
            ->whereDoesntHave('payments', function ($query) use ($today) {
                $query->where('status', 'pending')
                    ->where('period_start', '<=', $today);
            })
            ->orderBy('next_payment_date')
            ->get();

        $pendingInvoices = Payment::with(['rental.property', 'rental.tenant'])
            ->where('status', 'pending')
            ->orderBy('period_start')
            ->get();

        return Inertia::render('dashboard', [
            'availableProperties' => $availableProperties,
            'revenueEvolution' => $revenueEvolution,
            'debtEvolution' => $debtEvolution,
            'availabilityStats' => $availabilityStats,
            'upcomingPayments' => $upcomingPayments,
            'recoveryStats' => [
                'estimated' => (float) $estimatedRecovery,
                'actual' => (float) $actualRecovery,
            ],
            'latePayments' => $latePayments,
            'pendingInvoices' => $pendingInvoices,
            'filters' => [
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
            ],
        ]);
    }
}
