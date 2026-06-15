<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DepositController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\PropertyCategoryController;
use App\Http\Controllers\PropertyController;
use App\Http\Controllers\RentalController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\Settings\OrganizationController;
use App\Http\Controllers\TenantController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->route('dashboard');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    Route::resource('property-categories', PropertyCategoryController::class);
    Route::resource('properties', PropertyController::class);
    Route::post('properties/{property}/apartments', [PropertyController::class, 'addApartment'])->name('properties.apartments.store');
    Route::resource('rentals', RentalController::class);
    Route::resource('organizations', OrganizationController::class);
    Route::get('tenants', [TenantController::class, 'index'])->name('tenants.index');
    Route::get('tenants/{tenant}', [TenantController::class, 'show'])->name('tenants.show');
    Route::get('payments', [PaymentController::class, 'index'])->name('payments.index');
    Route::post('payments', [PaymentController::class, 'store'])->name('payments.store');
    Route::post('payments/advance', [PaymentController::class, 'addAdvance'])->name('payments.advance');
    Route::patch('payments/{payment}/mark-as-paid', [PaymentController::class, 'markAsPaid'])->name('payments.mark-as-paid');
    Route::get('payments/{payment}/invoice', [PaymentController::class, 'invoice'])->name('payments.invoice');
    Route::get('rentals/{rental}/statement', [PaymentController::class, 'statement'])->name('rentals.statement');

    Route::get('deposits', [DepositController::class, 'index'])->name('deposits.index');

    Route::resource('expenses', ExpenseController::class);

    Route::prefix('reports')->name('reports.')->group(function () {
        Route::get('/', [ReportController::class, 'index'])->name('index');
        Route::get('/late-payments', [ReportController::class, 'latePayments'])->name('late-payments');
        Route::get('/revenue', [ReportController::class, 'revenue'])->name('revenue');
        Route::get('/availability', [ReportController::class, 'availability'])->name('availability');
        Route::get('/forecast', [ReportController::class, 'forecast'])->name('forecast');
    });

    Route::prefix('notifications')->name('notifications.')->group(function () {
        Route::get('/', [NotificationController::class, 'index'])->name('index');
        Route::patch('/{id}/read', [NotificationController::class, 'markAsRead'])->name('mark-as-read');
        Route::patch('/{id}/unread', [NotificationController::class, 'markAsUnread'])->name('mark-as-unread');
        Route::post('/read-all', [NotificationController::class, 'markAllAsRead'])->name('mark-all-as-read');
        Route::delete('/{id}', [NotificationController::class, 'destroy'])->name('destroy');
    });
});

require __DIR__.'/settings.php';
