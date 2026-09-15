<?php

namespace App\Http\Controllers;

use App\Exports\AvailabilityExport;
use App\Exports\ExploitationExport;
use App\Exports\LatePaymentsExport;
use App\Exports\RentFollowUpExport;
use App\Exports\RevenueExport;
use App\Models\Expense;
use App\Models\Invoice;
use App\Models\Organization;
use App\Models\Payment;
use App\Models\Property;
use App\Models\PropertyCategory;
use App\Models\Rental;
use Barryvdh\DomPDF\Facade\Pdf;
use DateTimeInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $properties = Property::select('id', 'title', 'parent_id')->get();
        $categories = PropertyCategory::select('id', 'name')->get();

        return Inertia::render('reports/index', [
            'properties' => $properties,
            'categories' => $categories,
            'filters' => $request->only(['property_id', 'category_id', 'start_date', 'end_date', 'type']),
        ]);
    }

    public function latePayments(Request $request)
    {
        $query = Invoice::join('rentals', 'invoices.rental_id', '=', 'rentals.id')
            ->join('properties', 'rentals.property_id', '=', 'properties.id')
            ->leftJoin('properties as buildings', 'properties.parent_id', '=', 'buildings.id')
            ->join('tenants', 'rentals.tenant_id', '=', 'tenants.id')
            ->whereIn('invoices.status', ['pending', 'partial'])
            ->where('invoices.due_date', '<', now())
            ->select(
                'buildings.title as building_title',
                'properties.title as property_title',
                DB::raw(config('database.default') === 'sqlite'
                    ? "tenants.first_name || ' ' || tenants.last_name as tenant_name"
                    : "CONCAT(tenants.first_name, ' ', tenants.last_name) as tenant_name"
                ),
                'invoices.due_date',
                'invoices.invoice_number',
                'invoices.total_amount as amount_due',
                DB::raw(config('database.default') === 'sqlite'
                    ? "strftime('%J', 'now') - strftime('%J', invoices.due_date) as days_late"
                    : 'DATEDIFF(NOW(), invoices.due_date) as days_late'
                )
            );

        if ($request->filled('property_id') && $request->property_id !== 'all') {
            $query->where(function ($q) use ($request) {
                $q->where('rentals.property_id', $request->property_id)
                    ->orWhere('properties.parent_id', $request->property_id);
            });
        }

        if ($request->filled('category_id') && $request->category_id !== 'all') {
            $query->where('properties.property_category_id', $request->category_id);
        }

        $data = $query->get();

        if ($request->export === 'excel') {
            return Excel::download(new LatePaymentsExport($data), 'retards-paiement.xlsx');
        }

        if ($request->export === 'pdf') {
            $organization = Organization::first();
            $pdf = Pdf::loadView('reports.pdf.late-payments', [
                'data' => $data,
                'filters' => $request->all(),
                'title' => 'Rapport des Retards de Paiement',
                'organization' => $organization,
            ]);

            return $pdf->download('retards-paiement.pdf');
        }

        return response()->json($data);
    }

    public function revenue(Request $request)
    {
        $query = Payment::join('rentals', 'payments.rental_id', '=', 'rentals.id')
            ->join('properties', 'rentals.property_id', '=', 'properties.id')
            ->leftJoin('properties as buildings', 'properties.parent_id', '=', 'buildings.id')
            ->join('tenants', 'rentals.tenant_id', '=', 'tenants.id')
            ->leftJoin('invoice_items', function ($join) {
                $join->on('payments.invoice_id', '=', 'invoice_items.invoice_id')
                    ->whereRaw('invoice_items.id = (SELECT MIN(id) FROM invoice_items WHERE invoice_id = payments.invoice_id)');
            })
            ->where('payments.status', 'paid')
            ->whereNotNull('payments.invoice_id') // Uniquement sur encaissement des factures
            ->select(
                'buildings.title as building_title',
                'properties.title as property_title',
                DB::raw(config('database.default') === 'sqlite'
                    ? "tenants.first_name || ' ' || tenants.last_name as tenant_name"
                    : "CONCAT(tenants.first_name, ' ', tenants.last_name) as tenant_name"
                ),
                'payments.payment_date',
                'payments.invoice_number',
                'payments.amount',
                'payments.period_start',
                'payments.period_end',
                'invoice_items.period as billing_period'
            );

        if ($request->filled('property_id') && $request->property_id !== 'all') {
            $query->where(function ($q) use ($request) {
                $q->where('rentals.property_id', $request->property_id)
                    ->orWhere('properties.parent_id', $request->property_id);
            });
        }

        if ($request->filled('category_id') && $request->category_id !== 'all') {
            $query->where('properties.property_category_id', $request->category_id);
        }

        if ($request->filled('start_date')) {
            $query->where('payments.payment_date', '>=', $request->start_date);
        }

        if ($request->end_date) {
            $query->where('payments.payment_date', '<=', $request->end_date);
        }

        $data = $query->get();

        if ($request->export === 'excel') {
            return Excel::download(new RevenueExport($data), 'chiffre-affaires.xlsx');
        }

        if ($request->export === 'pdf') {
            $organization = Organization::first();
            $pdf = Pdf::loadView('reports.pdf.revenue', [
                'data' => $data,
                'filters' => $request->all(),
                'title' => 'Rapport du Chiffre d\'Affaires',
                'organization' => $organization,
            ]);

            return $pdf->download('chiffre-affaires.pdf');
        }

        return response()->json($data);
    }

    public function availability(Request $request)
    {
        $query = Property::leftJoin('properties as buildings', 'properties.parent_id', '=', 'buildings.id')
            ->select(
                'buildings.title as building_title',
                'properties.title',
                'properties.type',
                'properties.city',
                'properties.status',
                'properties.price'
            );

        if ($request->filled('property_id')) {
            $query->where(function ($q) use ($request) {
                $q->where('properties.id', $request->property_id)
                    ->orWhere('properties.parent_id', $request->property_id);
            });
        }

        if ($request->filled('category_id')) {
            $query->where('properties.property_category_id', $request->category_id);
        }

        $data = $query->get();

        if ($request->export === 'excel') {
            return Excel::download(new AvailabilityExport($data), 'disponibilite-biens.xlsx');
        }

        if ($request->export === 'pdf') {
            $organization = Organization::first();
            $pdf = Pdf::loadView('reports.pdf.availability', [
                'data' => $data,
                'filters' => $request->all(),
                'title' => 'Rapport de Disponibilité des Biens',
                'organization' => $organization,
            ]);

            return $pdf->download('disponibilite-biens.pdf');
        }

        return response()->json($data);
    }

    public function exploitation(Request $request)
    {
        try {
            $propertyId = $request->property_id;
            $startDate = $request->start_date;
            $endDate = $request->end_date;

            // Validation - dates facultatives si property_id est fourni
            if (! $propertyId || $propertyId === 'all') {
                $request->validate([
                    'start_date' => 'required|date',
                    'end_date' => 'required|date|after_or_equal:start_date',
                ]);
            }

            // 1. Chiffre d'Affaires (Factures de location)
            $invoicesQuery = Invoice::join('rentals', 'invoices.rental_id', '=', 'rentals.id')
                ->join('properties', 'rentals.property_id', '=', 'properties.id')
                ->leftJoin('properties as buildings', 'properties.parent_id', '=', 'buildings.id')
                ->select(
                    'invoices.id',
                    'invoices.invoice_number',
                    'invoices.date',
                    'invoices.status',
                    'invoices.total_amount',
                    'properties.title as property_title',
                    'buildings.title as building_title',
                    DB::raw('(SELECT GROUP_CONCAT(DISTINCT period SEPARATOR ", ") FROM invoice_items WHERE invoice_id = invoices.id) as period')
                );

            if ($propertyId && $propertyId !== 'all') {
                $invoicesQuery->where(function ($q) use ($propertyId) {
                    $q->where('rentals.property_id', $propertyId)
                        ->orWhere('properties.parent_id', $propertyId);
                });
            }

            if ($request->filled('category_id') && $request->category_id !== 'all') {
                $invoicesQuery->where('properties.property_category_id', $request->category_id);
            }

            if ($startDate) {
                $invoicesQuery->whereDate('invoices.date', '>=', $startDate);
            }

            if ($endDate) {
                $invoicesQuery->whereDate('invoices.date', '<=', $endDate);
            }

            $invoices = $invoicesQuery->get();

            // 2. Dépenses
            $expensesQuery = Expense::join('properties', 'expenses.property_id', '=', 'properties.id')
                ->leftJoin('properties as buildings', 'properties.parent_id', '=', 'buildings.id')
                ->select(
                    'expenses.reference',
                    'expenses.date',
                    'expenses.total_amount',
                    'expenses.provider',
                    \DB::raw('(SELECT GROUP_CONCAT(description SEPARATOR ", ") FROM expense_items WHERE expense_id = expenses.id) as description'),
                    'properties.title as property_title',
                    'buildings.title as building_title'
                );

            if ($propertyId && $propertyId !== 'all') {
                $expensesQuery->where(function ($q) use ($propertyId) {
                    $q->where('expenses.property_id', $propertyId)
                        ->orWhere('properties.parent_id', $propertyId);
                });
            }

            if ($request->filled('category_id') && $request->category_id !== 'all') {
                $expensesQuery->where('properties.property_category_id', $request->category_id);
            }

            if ($startDate) {
                $expensesQuery->whereDate('expenses.date', '>=', $startDate);
            }

            if ($endDate) {
                $expensesQuery->whereDate('expenses.date', '<=', $endDate);
            }

            $expenses = $expensesQuery->get();

            $totalInvoices = $invoices->sum('total_amount');
            $totalExpenses = $expenses->sum('total_amount');
            $balance = $totalInvoices - $totalExpenses;

            $data = [
                'invoices' => $invoices,
                'expenses' => $expenses,
                'summary' => [
                    'total_invoices' => $totalInvoices,
                    'total_expenses' => $totalExpenses,
                    'balance' => $balance,
                ],
            ];

            if ($request->export === 'excel') {
                return Excel::download(new ExploitationExport($data), 'rapport-exploitation.xlsx');
            }

            if ($request->export === 'pdf') {
                $organization = Organization::first();
                $property = null;
                if ($propertyId && $propertyId !== 'all') {
                    $property = Property::find($propertyId);
                }
                $pdf = Pdf::loadView('reports.pdf.exploitation', [
                    'data' => $data,
                    'filters' => $request->all(),
                    'title' => 'Rapport d\'Exploitation Détaillé',
                    'organization' => $organization,
                    'property' => $property,
                ]);

                return $pdf->download('rapport-exploitation.pdf');
            }

            return response()->json($data);
        } catch (\Exception $e) {
            \Log::error('Erreur Rapport Exploitation: '.$e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'request' => $request->all(),
            ]);

            return response()->json(['error' => 'Une erreur est survenue lors de la génération du rapport.'], 500);
        }
    }

    public function rentFollowUp(Request $request)
    {
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        if (! $startDate || ! $endDate) {
            $startDate = now()->subMonths(6)->startOfMonth()->toDateString();
            $endDate = now()->addMonths(6)->endOfMonth()->toDateString();
        }

        $start = Carbon::parse($startDate)->startOfMonth();
        $end = Carbon::parse($endDate)->endOfMonth();

        $months = [];
        $current = $start->copy();
        while ($current <= $end) {
            $months[] = $current->format('Y-m');
            $current->addMonth();
        }

        $query = Rental::with([
            'tenant',
            'property.parent',
            'invoices' => fn ($query) => $query->where('type', 'Loyer')->with('items'),
        ])
            ->where(function ($q) use ($start) {
                $q->whereNull('end_date')
                    ->orWhere('end_date', '>=', $start);
            })
            ->where('start_date', '<=', $end);

        if ($request->filled('property_id') && $request->property_id !== 'all') {
            $query->where(function ($q) use ($request) {
                $q->where('property_id', $request->property_id)
                    ->orWhereHas('property', function ($pq) use ($request) {
                        $pq->where('parent_id', $request->property_id);
                    });
            });
        }

        if ($request->filled('category_id') && $request->category_id !== 'all') {
            $query->whereHas('property', function ($pq) use ($request) {
                $pq->where('property_category_id', $request->category_id);
            });
        }

        $data = $query->get()
            ->groupBy('tenant_id')
            ->map(function ($tenantRentals) use ($months) {
                $tenant = $tenantRentals->first()->tenant;
                $properties = $tenantRentals
                    ->map(function ($rental) {
                        $propertyTitle = $rental->property?->title ?? 'N/A';
                        $buildingTitle = $rental->property?->parent?->title;

                        return $buildingTitle ? $buildingTitle.' / '.$propertyTitle : $propertyTitle;
                    })
                    ->unique()
                    ->values()
                    ->implode(' • ');

                $activeRentals = $tenantRentals->where('status', 'active');

                $invoiceItemsByMonth = $tenantRentals
                    ->flatMap(fn ($rental) => $rental->invoices)
                    ->flatMap(fn ($invoice) => $invoice->items->map(fn ($item) => [
                        'item' => $item,
                        'invoice_date' => $invoice->date,
                        'invoice_status' => $invoice->status,
                    ]))
                    ->flatMap(fn ($invoiceItem) => $this->invoiceItemMonthlyAmounts(
                        $invoiceItem['item'],
                        $invoiceItem['invoice_date'],
                        $invoiceItem['invoice_status'],
                    ))
                    ->groupBy('month');

                $rentalMonths = collect($months)->mapWithKeys(function ($month) use ($invoiceItemsByMonth, $activeRentals) {
                    $monthItems = $invoiceItemsByMonth->get($month, collect());

                    if ($monthItems->isNotEmpty()) {
                        $amount = (float) $monthItems->sum('amount');
                        $status = $monthItems->every(fn ($item) => $item['status'] === 'paid') ? 'paid' : 'unpaid';
                    } else {
                        $monthStart = Carbon::parse($month.'-01')->startOfMonth();
                        $monthEnd = $monthStart->copy()->endOfMonth();

                        $amount = (float) $activeRentals
                            ->filter(fn ($rental) => $rental->start_date <= $monthEnd
                                && (! $rental->end_date || $rental->end_date >= $monthStart))
                            ->sum('rent_amount');

                        $status = $amount > 0 ? 'unpaid' : 'not_billed';
                    }

                    return [$month => [
                        'amount' => $amount,
                        'label' => number_format($amount, 0, '.', ' ').' F',
                        'status' => $status,
                    ]];
                })->all();

                return [
                    'tenant_name' => trim(($tenant?->first_name ?? '').' '.($tenant?->last_name ?? '')) ?: 'N/A',
                    'property_title' => $properties,
                    'property_sort_key' => $properties,
                    'contract_start' => $tenantRentals->min('start_date')?->format('Y-m-d'),
                    'months' => $rentalMonths,
                ];
            })
            ->sortBy([
                ['property_sort_key', 'asc'],
                ['contract_start', 'asc'],
            ])
            ->values()
            ->map(fn ($row) => collect($row)->except(['property_sort_key', 'contract_start'])->all());

        if ($request->export === 'excel') {
            return Excel::download(new RentFollowUpExport($data, $months), 'suivi-loyers-'.now()->format('Y-m-d').'.xlsx');
        }

        if ($request->export === 'pdf') {
            $organization = Organization::first();
            $pdf = Pdf::loadView('reports.pdf.rent-follow-up', [
                'data' => $data,
                'months' => $months,
                'filters' => $request->all(),
                'title' => 'Situation Suivi des Loyers',
                'organization' => $organization,
            ])->setPaper('a4', 'landscape');

            return $pdf->download('suivi-loyers-'.now()->format('Y-m-d').'.pdf');
        }

        return response()->json($data);
    }

    private function billingPeriodMonth(?string $period, ?DateTimeInterface $fallbackDate = null): ?string
    {
        $monthNumbers = [
            'JAN' => 1,
            'FEV' => 2,
            'FERV' => 2,
            'FEB' => 2,
            'MAR' => 3,
            'AVR' => 4,
            'MAI' => 5,
            'JUIL' => 7,
            'JUI' => 6,
            'AOU' => 8,
            'SEP' => 9,
            'OCT' => 10,
            'NOV' => 11,
            'DEC' => 12,
        ];

        $normalizedPeriod = strtr(mb_strtoupper($period ?? ''), [
            'É' => 'E',
            'È' => 'E',
            'Ê' => 'E',
            'Û' => 'U',
            'Ô' => 'O',
        ]);

        preg_match('/JAN|FEV|FERV|FEB|MAR|AVR|MAI|JUIL|JUI|AOU|SEP|OCT|NOV|DEC/', $normalizedPeriod, $monthMatches);

        if ($monthMatches) {
            preg_match('/20\d{2}/', $normalizedPeriod, $yearMatches);
            $year = $yearMatches[0] ?? $fallbackDate?->format('Y');

            return $year ? Carbon::create($year, $monthNumbers[$monthMatches[0]], 1)->format('Y-m') : null;
        }

        return $fallbackDate ? Carbon::instance($fallbackDate)->startOfMonth()->format('Y-m') : null;
    }

    private function invoiceItemMonthlyAmounts(object $item, ?DateTimeInterface $invoiceDate, string $invoiceStatus): Collection
    {
        $billingMonth = $this->billingPeriodMonth($item->period, $invoiceDate);

        if (! $billingMonth) {
            return collect();
        }

        $monthsCount = max(1, (int) $item->months_count);
        $totalInCentimes = (int) round((float) $item->total * 100);
        $monthlyAmountInCentimes = intdiv($totalInCentimes, $monthsCount);
        $remainderInCentimes = $totalInCentimes % $monthsCount;
        $start = Carbon::parse($billingMonth.'-01');

        return collect(range(0, $monthsCount - 1))->map(function (int $offset) use ($start, $monthlyAmountInCentimes, $remainderInCentimes, $invoiceStatus) {
            return [
                'month' => $start->copy()->addMonths($offset)->format('Y-m'),
                'amount' => ($monthlyAmountInCentimes + ($offset < $remainderInCentimes ? 1 : 0)) / 100,
                'status' => $invoiceStatus,
            ];
        });
    }
}
