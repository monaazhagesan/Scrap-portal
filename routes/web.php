<?php

use App\Http\Controllers\AccountsController;
use App\Http\Controllers\Admin;
use App\Http\Controllers\BillingController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\MaterialController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\PartyController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\WeighmentController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('onboarding', [OnboardingController::class, 'create'])->name('onboarding.create');
    Route::post('onboarding', [OnboardingController::class, 'store'])->name('onboarding.store');

    // Tenant area: every route here runs inside the user's current organization.
    Route::middleware('tenant')->group(function () {
        Route::get('billing', [BillingController::class, 'show'])->name('billing.show');

        Route::middleware('subscribed')->group(function () {
            Route::get('dashboard', DashboardController::class)->name('dashboard');
            Route::resource('materials', MaterialController::class)->except('show');

            Route::get('inventory', [InventoryController::class, 'index'])->name('inventory.index');
            Route::get('inventory/{material}', [InventoryController::class, 'show'])->name('inventory.show');
            Route::post('inventory/{material}/adjust', [InventoryController::class, 'adjust'])->name('inventory.adjust');

            Route::resource('weighbridge', WeighmentController::class)
                ->only(['index', 'create', 'store', 'show'])
                ->parameters(['weighbridge' => 'weighment'])
                ->names('weighments');
            Route::post('weighbridge/{weighment}/complete', [WeighmentController::class, 'complete'])->name('weighments.complete');
            Route::post('weighbridge/{weighment}/cancel', [WeighmentController::class, 'cancel'])->name('weighments.cancel');

            // Accounts: parties, receipts / payments, outstanding, cash & bank book.
            Route::middleware('org.role:owner,admin,manager')->group(function () {
                Route::resource('parties', PartyController::class)->except('destroy');
                Route::resource('payments', PaymentController::class)->only(['index', 'create', 'store', 'show']);
                Route::post('payments/{payment}/cancel', [PaymentController::class, 'cancel'])->name('payments.cancel');
                Route::get('accounts/outstanding', [AccountsController::class, 'outstanding'])->name('accounts.outstanding');
                Route::get('accounts/cashbook', [AccountsController::class, 'cashbook'])->name('accounts.cashbook');
            });
        });
    });

    // Platform administration (SaaS owner).
    Route::middleware('super-admin')->prefix('admin')->name('admin.')->group(function () {
        Route::get('organizations', [Admin\OrganizationController::class, 'index'])->name('organizations.index');
        Route::patch('organizations/{organization}', [Admin\OrganizationController::class, 'update'])->name('organizations.update');
    });
});

require __DIR__.'/settings.php';
