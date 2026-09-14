<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Service;
use App\Models\WorkingHour;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AppointmentController extends Controller
{
    public function index()
    {
        return Inertia::render('Appointments/Index', [
            'services' => Service::all(),
            'users' => \App\Models\User::all(), // Sistemdeki temsilciler
            'appointments' => Appointment::with(['service', 'user'])->orderBy('date', 'desc')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'service_id' => 'required|exists:services,id',
            'user_id' => 'required|exists:users,id',
            'client_name' => 'required|string|max:255',
            'client_email' => 'required|email|max:255',
            'client_phone' => 'required|string|max:20',
            'date' => 'required|date',
            'start_time' => 'required',
            'end_time' => 'required',
            'notes' => 'nullable|string',
        ]);

        // Sadece seçilen temsilcinin o saatte randevusu var mı diye bakıyoruz
        $hasConflict = Appointment::where('user_id', $request->user_id)
            ->where('date', $request->date)
            ->where('status', '!=', 'cancelled')
            ->where(function ($query) use ($request) {
                $query->where(function ($q) use ($request) {
                    $q->where('start_time', '<', $request->end_time)
                      ->where('end_time', '>', $request->start_time);
                });
            })
            ->exists();

        if ($hasConflict) {
            return back()->withErrors([
                'start_time' => 'Seçilen temsilcinin bu tarih ve saat diliminde zaten başka bir randevusu bulunmaktadır!'
            ]);
        }

        Appointment::create($validated);

        return redirect()->back();
    }

    public function cancel(Appointment $appointment)
    {
        $appointment->update(['status' => 'cancelled']);

        return redirect()->back();
    }
}