<?php

namespace App\Http\Controllers;

use App\Models\Rental;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DepositController extends Controller
{
    public function index(Request $request)
    {
        $rentals = Rental::with(['property', 'tenant', 'payments' => function ($query) {
            $query->where('status', 'pending');
        }])
            ->where('deposit_amount', '>', 0)
            ->get()
            ->map(function ($rental) {
                $unpaidAmount = $rental->payments->sum('amount');
                $remainingDeposit = max(0, $rental->deposit_amount - $unpaidAmount);

                return [
                    'id' => $rental->id,
                    'tenant' => $rental->tenant,
                    'property' => $rental->property,
                    'deposit_amount' => $rental->deposit_amount,
                    'unpaid_amount' => $unpaidAmount,
                    'remaining_deposit' => $remainingDeposit,
                    'status' => $rental->status,
                    'start_date' => $rental->start_date,
                ];
            });

        return Inertia::render('deposits/index', [
            'deposits' => $rentals,
        ]);
    }
}
