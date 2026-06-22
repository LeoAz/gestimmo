<?php

namespace App\Http\Controllers;

use App\Exports\AvailabilityExport;
use App\Exports\ForecastExport;
use App\Exports\LatePaymentsExport;
use App\Exports\RevenueExport;
use App\Models\Organization;
use App\Models\Payment;
use App\Models\Property;
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
        $properties = Property::select('id', 'title')->get();

        return Inertia::render('reports/index', [
            'properties' => $properties,
            'filters' => $request->only(['property_id', 'start_date', 'end_date', 'type']),
        ]);
    }

    public function latePayments(Request $request)
    {
        $query = Rental::where('rentals.status', 'active')
            ->join('properties', 'rentals.property_id', '=', 'properties.id')
            ->join('tenants', 'rentals.tenant_id', '=', 'tenants.id')
            ->where('rentals.next_payment_date', '<', now())
            ->select(
                'properties.title as property_title',
                DB::raw(config('database.default') === 'sqlite'
                    ? "tenants.first_name || ' ' || tenants.last_name as tenant_name"
                    : "CONCAT(tenants.first_name, ' ', tenants.last_name) as tenant_name"
                ),
                'rentals.next_payment_date as due_date',
                'rentals.rent_amount as amount_due',
                DB::raw(config('database.default') === 'sqlite'
                    ? "strftime('%J', 'now') - strftime('%J', rentals.next_payment_date) as days_late"
                    : 'DATEDIFF(NOW(), rentals.next_payment_date) as days_late'
                )
            );

        if ($request->property_id) {
            $query->where('rentals.property_id', $request->property_id);
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
            ->join('tenants', 'rentals.tenant_id', '=', 'tenants.id')
            ->where('payments.status', 'paid')
            ->select(
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
                DB::raw(config('database.default') === 'sqlite'
                    ? "strftime('%m/%Y', payments.period_start) as billing_period"
                    : "DATE_FORMAT(payments.period_start, '%m/%Y') as billing_period"
                )
            );

        if ($request->property_id) {
            $query->where('rentals.property_id', $request->property_id);
        }

        if ($request->start_date) {
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
        $query = Property::select('title', 'type', 'city', 'status', 'price');

        if ($request->start_date) {
            // Logique complexe pour la disponibilité historique si nécessaire
            // Pour l'instant on filtre sur le statut actuel mais on pourrait imaginer
            // vérifier si une location existait à cette date
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
            ->join('tenants', 'rentals.tenant_id', '=', 'tenants.id')
            ->select(
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

        if ($request->property_id) {
            $query->where('rentals.property_id', $request->property_id);
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
}
