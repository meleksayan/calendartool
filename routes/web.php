<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\AppointmentController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Models\Appointment;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('Dashboard');
    })->name('dashboard');

    // Randevu İşlemleri
    Route::get('/appointments', [AppointmentController::class, 'index'])->name('appointments.index');
    Route::post('/appointments', [AppointmentController::class, 'store'])->name('appointments.store');
    Route::patch('/appointments/{appointment}', [AppointmentController::class, 'update'])->name('appointments.update');
    Route::delete('/appointments/{appointment}', [AppointmentController::class, 'destroy'])->name('appointments.destroy');
    Route::post('/appointments/{id}/cancel', [AppointmentController::class, 'cancel'])->name('appointments.cancel');
    
    // Müşteri Geçmişi API (Frontend modal/geçmiş taraması için)
    Route::get('/api/client-history', [AppointmentController::class, 'history'])->name('client.history');

    // Satış/Ortak Personel için Tüm Randevuları Görme ve İptal Etme
    Route::get('/appointments/all', [AppointmentController::class, 'indexAll'])->name('appointments.all');
    Route::post('/appointments/{id}/cancel-common', [AppointmentController::class, 'cancelAppointment'])->name('appointments.cancel-common');

    // Müsait Değil (Blokaj) İşlemi
    Route::post('/unavailabilities', [AppointmentController::class, 'storeUnavailability'])->name('unavailabilities.store');

    // Profil İşlemleri
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // ADMİN SAYFALARI
    Route::prefix('admin')->name('admin.')->group(function () {
        Route::get('/dashboard', [AppointmentController::class, 'adminDashboard'])->name('dashboard');
        
        Route::get('/users', [AppointmentController::class, 'adminUsersIndex'])->name('users.index');
        Route::patch('/users/{id}/role', [AppointmentController::class, 'updateRole'])->name('users.update-role');

        Route::get('/appointments', [AppointmentController::class, 'indexAll'])->name('index');
        Route::post('/appointments/{id}/cancel', [AppointmentController::class, 'cancelAppointment'])->name('cancel');

        Route::get('/services', [AppointmentController::class, 'adminServicesIndex'])->name('services.index');
        Route::post('/services', [AppointmentController::class, 'storeService'])->name('services.store');
        Route::delete('/services/{id}', [AppointmentController::class, 'destroyService'])->name('services.destroy');
    });

    Route::get('/technical-panel', function () {
        return Inertia::render('TeknikElemanPaneli/TeknikElemanPaneli', [
            'appointments' => Appointment::with('service')->get() ?? [],
            'technician' => auth()->user() ?? ['id' => 1, 'name' => 'Teknik Personel'],
        ]);
    });
    Route::middleware(['auth'])->prefix('technical')->name('technical.')->group(function () {
    Route::get('/tum-randevular', [AppointmentController::class, 'indexAllForTechnical'])->name('appointments.all');
    
    // BURAYI EKLE:
    Route::patch('/appointments/{appointment}/status', [AppointmentController::class, 'updateStatus'])->name('appointments.status');
    });
});

require __DIR__.'/auth.php';