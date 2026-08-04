<?php

namespace App\Http\Controllers;

use App\Exports\AvailabilityExport;
use App\Exports\ForecastExport;
use App\Exports\LatePaymentsExport;
use App\Exports\RevenueExport;
use App\Models\Invoice;
use App\Models\Expense;
use App\Models\Organization;
use App\Models\Payment;
use App\Models\Property;
use App\Models\PropertyCategory;
use App\Models\Rental;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
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

    public function forecast(Request $request)
    {
        // Simples prévisions basées sur les locations actives
        $query = Rental::where('rentals.status', 'active')
            ->join('properties', 'rentals.property_id', '=', 'properties.id')
            ->leftJoin('properties as buildings', 'properties.parent_id', '=', 'buildings.id')
            ->join('tenants', 'rentals.tenant_id', '=', 'tenants.id')
            ->select(
                'buildings.title as building_title',
                'properties.title as property_title',
                DB::raw(config('database.default') === 'sqlite'
                    ? "tenants.first_name || ' ' || tenants.last_name as tenant_name"
                    : "CONCAT(tenants.first_name, ' ', tenants.last_name) as tenant_name"
                ),
                DB::raw(config('database.default') === 'sqlite'
                    ? "strftime('%m/%Y', 'now') as period"
                    : "DATE_FORMAT(NOW(), '%m/%Y') as period"
                ),
                'rentals.rent_amount as amount_expected'
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

        $rentals = $query->get();

        // Calculer les montants déjà recouvrés pour le mois en cours
        $data = $rentals->map(function ($rental) {
            $collected = Payment::whereHas('rental', function ($q) use ($rental) {
                $q->whereHas('property', function ($pq) use ($rental) {
                    $pq->where('title', $rental->property_title);
                });
            })
                ->where('status', 'paid')
                ->whereMonth('payment_date', now()->month)
                ->whereYear('payment_date', now()->year)
                ->sum('amount');

            $rental->amount_collected = $collected;

            return $rental;
        });

        if ($request->export === 'excel') {
            return Excel::download(new ForecastExport($data), 'previsions-recouvrement.xlsx');
        }

        if ($request->export === 'pdf') {
            $organization = Organization::first();
            $pdf = Pdf::loadView('reports.pdf.forecast', [
                'data' => $data,
                'filters' => $request->all(),
                'title' => 'Rapport des Prévisions de Recouvrement',
                'organization' => $organization,
            ]);

            return $pdf->download('previsions-recouvrement.pdf');
        }

        return response()->json($data);
    }

    public function exploitation(Request $request)
    {
        $propertyId = $request->property_id;
        $startDate = $request->start_date;
        $endDate = $request->end_date;

        // Validation - dates facultatives si property_id est fourni
        if (!$propertyId || $propertyId === 'all') {
            $request->validate([
                'start_date' => 'required|date',
                'end_date' => 'required|date|after_or_equal:start_date',
            ]);
        }

        // 1. Chiffre d'Affaires (Factures de location)
        $invoicesQuery = Invoice::join('rentals', 'invoices.rental_id', '=', 'rentals.id')
            ->join('properties', 'rentals.property_id', '=', 'properties.id')
            ->leftJoin('properties as buildings', 'properties.parent_id', '=', 'buildings.id')
            ->leftJoin('invoice_items', 'invoices.id', '=', 'invoice_items.invoice_id')
            ->select(
                'invoices.id',
                'invoices.invoice_number',
                'invoices.date',
                'invoices.status',
                'invoices.total_amount',
                'properties.title as property_title',
                'buildings.title as building_title',
                \DB::raw('GROUP_CONCAT(DISTINCT invoice_items.period SEPARATOR ", ") as period')
            )
            ->groupBy(
                'invoices.id',
                'invoices.invoice_number',
                'invoices.date',
                'invoices.status',
                'invoices.total_amount',
                'properties.title',
                'buildings.title'
            );

        if ($propertyId && $propertyId !== 'all') {
            $invoicesQuery->where(function ($q) use ($propertyId) {
                $q->where('rentals.property_id', $propertyId)
                    ->orWhere('properties.parent_id', $propertyId);
            });
        }

        if ($request->category_id && $request->category_id !== 'all') {
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
                'properties.title as property_title',
                'buildings.title as building_title'
            );

        if ($propertyId && $propertyId !== 'all') {
            $expensesQuery->where(function ($q) use ($propertyId) {
                $q->where('expenses.property_id', $propertyId)
                    ->orWhere('properties.parent_id', $propertyId);
            });
        }

        if ($request->category_id && $request->category_id !== 'all') {
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
            ]
        ];

        if ($request->export === 'excel') {
            return Excel::download(new \App\Exports\ExploitationExport($data), 'rapport-exploitation.xlsx');
        }

        if ($request->export === 'pdf') {
            $organization = Organization::first();
            $pdf = Pdf::loadView('reports.pdf.exploitation', [
                'data' => $data,
                'filters' => $request->all(),
                'title' => 'Rapport d\'Exploitation Détaillé',
                'organization' => $organization,
                'property' => $propertyId && $propertyId !== 'all' ? Property::find($propertyId) : null,
            ]);

            return $pdf->download('rapport-exploitation.pdf');
        }

        return response()->json($data);
    }
}
