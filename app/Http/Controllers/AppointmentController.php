<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Service;
use App\Models\User;
use App\Models\StaffUnavailability;
use App\Models\UserAvailability; // Doğru konum: En üstte
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class AppointmentController extends Controller
{
    /**
     * Takvim sayfasını ve verileri listeler.
     */
    public function index(Request $request)
    {
        $user = auth()->user();

        if ($user && $user->role === 'admin') {
            return redirect()->route('admin.dashboard');
        }

        $userId = $request->input('user_id');
        $search = $request->input('search');

        $appointments = Appointment::with(['user', 'service'])
            ->where('status', '!=', 'cancelled')
            ->when($userId, fn($q) => $q->where('user_id', $userId))
            ->when(!empty(trim($search)), function($q) use ($search) {
                $searchTerm = '%' . mb_strtolower(trim($search), 'UTF-8') . '%';
                $q->where(function($query) use ($searchTerm) {
                    $query->whereRaw('LOWER(client_name) LIKE ?', [$searchTerm])
                          ->orWhereRaw('LOWER(client_email) LIKE ?', [$searchTerm]);
                });
            })
            ->get();

        $unavailabilities = StaffUnavailability::when($userId, fn($q) => $q->where('user_id', $userId))
            ->get();

        $services = Service::all();
        $users = User::all();

        return Inertia::render('Appointments/Index', [
            'appointments' => $appointments,
            'unavailabilities' => $unavailabilities,
            'services' => $services,
            'users' => $users,
            'filters' => $request->only(['user_id', 'search'])
        ]);
    }

    /**
     * Yeni bir randevu kaydeder.
     */
    public function store(Request $request)
    {
        $request->validate([
            'service_id' => 'required|exists:services,id',
            'user_id' => 'required|exists:users,id',
            'client_name' => 'required|string|max:255',
            'client_email' => 'required|email|max:255',
            'client_phone' => 'required|string|max:50',
            'date' => 'required|date|after_or_equal:today',
            'start_time' => 'required',
            'end_time' => 'required|after:start_time',
            'notes' => 'nullable|string|max:1000',
        ]);

        $date = $request->date;
        $startTime = $request->start_time;
        $endTime = $request->end_time;

        $selectedDateTime = Carbon::parse("{$date} {$startTime}", config('app.timezone'));
        if ($selectedDateTime->isPast()) {
            return redirect()->back()->withErrors(['start_time' => 'Geçmiş bir tarihe veya saate randevu oluşturamazsınız!']);
        }

        // 1. ÇAKIŞMA KONTROLÜ
        $appointmentConflict = Appointment::where('user_id', $request->user_id)
            ->where('date', $request->date)
            ->where('status', '!=', 'cancelled')
            ->where(function ($query) use ($startTime, $endTime) {
                $query->where('start_time', '<', $endTime)
                      ->where('end_time', '>', $startTime);
            })->exists();

        if ($appointmentConflict) {
            return redirect()->back()->withErrors(['start_time' => 'Seçilen saat aralığında bu personelin başka bir randevusu var!']);
        }

        // 2. BLOKAJ KONTROLÜ
        $unavailabilityConflict = StaffUnavailability::where('user_id', $request->user_id)
            ->where('date', $request->date)
            ->where(function ($query) use ($startTime, $endTime) {
                $query->where('start_time', '<', $endTime)
                      ->where('end_time', '>', $startTime);
            })->exists();

        if ($unavailabilityConflict) {
            return redirect()->back()->withErrors(['start_time' => 'Seçilen saat aralığında personel müsait değil (blokaj bulunuyor)!']);
        }

        Appointment::create([
            'service_id' => $request->service_id,
            'user_id' => $request->user_id,
            'client_name' => $request->client_name,
            'client_email' => $request->client_email,
            'client_phone' => $request->client_phone,
            'date' => $request->date,
            'start_time' => $startTime,
            'end_time' => $endTime,
            'notes' => $request->notes,
        ]);

        return redirect()->back()->with('success', 'Randevu başarıyla oluşturuldu.');
    }

    /**
     * Randevuyu iptal eder.
     */
    public function cancel($id)
    {
        $appointment = Appointment::findOrFail($id);
        $appointment->update(['status' => 'cancelled']);

        return back()->with('success', 'Randevu iptal edildi.');
    }

    /**
     * Randevu / Süre Güncelleme
     */
    public function update(Request $request, Appointment $appointment)
    {
        $validated = $request->validate([
            'service_id' => 'nullable|exists:services,id',
            'user_id' => 'nullable|exists:users,id',
            'client_name' => 'required|string|max:255',
            'client_email' => 'nullable|email|max:255',
            'client_phone' => 'nullable|string|max:50',
            'date' => 'required|date',
            'start_time' => 'required',
            'duration_minutes' => 'nullable|integer|min:5',
            'end_time' => 'nullable',
            'notes' => 'nullable|string|max:1000',
        ]);

        $userId = $request->input('user_id', $appointment->user_id);
        $date = $request->input('date', $appointment->date);
        $startTime = $request->input('start_time', $appointment->start_time);
        
        if ($request->filled('duration_minutes')) {
            $start = new \DateTime("{$date} {$startTime}");
            $duration = (int)$request->input('duration_minutes');
            $end = clone $start;
            $end->modify("+{$duration} minutes");
            $endTime = $end->format('H:i'); 
        } else {
            $endTime = $request->input('end_time', $appointment->end_time);
        }

        $conflict = Appointment::where('user_id', $userId)
            ->where('date', $date)
            ->where('id', '!=', $appointment->id)
            ->where('status', '!=', 'cancelled')
            ->where(function ($query) use ($startTime, $endTime) {
                $query->where('start_time', '<', $endTime)
                      ->where('end_time', '>', $startTime);
            })->exists();

        if ($conflict) {
            return redirect()->back()->withErrors(['start_time' => 'Süre uzatımı/seçim sonrası saat aralığında çakışan başka bir randevu var!']);
        }

        $unavailabilityConflict = StaffUnavailability::where('user_id', $userId)
            ->where('date', $date)
            ->where(function ($query) use ($startTime, $endTime) {
                $query->where('start_time', '<', $endTime)
                      ->where('end_time', '>', $startTime);
            })->exists();

        if ($unavailabilityConflict) {
            return redirect()->back()->withErrors(['start_time' => 'Seçilen saat aralığında personel müsait değil (blokaj bulunuyor)!']);
        }

        $validated['end_time'] = $endTime;
        if ($request->filled('duration_minutes') && Schema::hasColumn('appointments', 'duration_minutes')) {
            $validated['duration_minutes'] = $request->input('duration_minutes');
        }

        $appointment->update($validated);

        return redirect()->back()->with('success', 'Randevu ve bitiş saati güncellendi.');
    }

    /**
     * ORTAK: Tüm Randevuları Listeleme
     */
    public function indexAll()
    {
      $user = auth()->user();
      $appointments = Appointment::with(['user', 'service'])->latest()->get();

      if ($user && in_array(strtolower($user->role), ['technician', 'teknisyen'])) {
        return Inertia::render('TeknikElemanPaneli/TeknikElemanPaneli', [
            'appointments' => $appointments
        ]);
      }

       return Inertia::render('Admin/Appointments', [
         'appointments' => $appointments
       ]);
    }
    /**
     * ORTAK: Randevu İptal Etme
     */
    public function cancelAppointment($id)
    {
      $user = auth()->user();
      $appointment = Appointment::findOrFail($id);

      // Teknik eleman sadece kendi randevusunu iptal edebilir
      if ($user && $user->role === 'technician' && $appointment->user_id !== $user->id) {
          abort(403, 'Sadece kendi randevularınızı iptal edebilirsiniz.');
      }

      $appointment->update(['status' => 'cancelled']);

      return redirect()->back()->with('success', 'Randevu başarıyla iptal edildi.');
    }

    /**
     * Personelin müsait olmadığı zaman dilimini kaydeder.
     */
    public function storeUnavailability(Request $request)
    {
        $user = auth()->user();

        if (!in_array($user->role, ['admin', 'technician'])) {
            abort(403, 'Bu işlem için yetkiniz yok.');
        }

        $request->validate([
            'date' => 'required|date',
            'start_time' => 'required',
            'end_time' => 'required|after:start_time',
            'reason' => 'nullable|string|max:255',
            'user_id' => 'nullable|exists:users,id',
        ]);

        $targetUserId = ($user->role === 'admin' && $request->filled('user_id')) 
            ? $request->user_id 
            : $user->id;

        StaffUnavailability::create([
            'user_id' => $targetUserId,
            'date' => $request->date,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
            'reason' => $request->reason,
        ]);

        return redirect()->back()->with('success', 'Müsait olunmayan zaman başarıyla eklendi.');
    }

    public function adminUsersIndex()
    {
        return Inertia::render('Admin/Users', [
            'users' => User::select('id', 'name', 'email', 'role')->get()
        ]);
    }

    /**
     * Admin'in Kullanıcılara Rol Atama Fonksiyonu
     */
    public function updateRole(Request $request, $id)
    {
        $admin = auth()->user();

        if ($admin->role !== 'admin') {
            abort(403, 'Bu işlem için yetkiniz yok.');
        }

        $request->validate([
            'role' => 'nullable|in:technician,representative,admin',
        ]);

        $targetUser = User::findOrFail($id);

        if ($targetUser->id === $admin->id && $request->role !== 'admin') {
            return redirect()->back()->withErrors(['role' => 'Kendi admin yetkinizi kaldıramazsınız!']);
        }

        $targetUser->update([
            'role' => $request->role,
        ]);

        return redirect()->back()->with('success', 'Kullanıcı rolü başarıyla güncellendi.');
    }

    public function adminDashboard()
    {
        $stats = [
            'users_count' => User::count(),
            'appointments_count' => Appointment::where('status', '!=', 'cancelled')->count(),
        ];

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats
        ]);
    }

    // Admin için Hizmetleri Listeleme
    public function adminServicesIndex()
    {
        $services = Service::all();
        return Inertia::render('Admin/Services', [
           'services' => $services
        ]);
    }

    // Yeni Hizmet Ekleme
    public function storeService(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'duration' => 'required|integer|min:5',
        ]);

        Service::create([
            'name' => $request->name,
            'duration' => $request->duration,
            'is_active' => true,
        ]);

        return redirect()->back()->with('success', 'Hizmet başarıyla eklendi.');
    }

    // Hizmeti Silme / Pasif Yapma
    public function destroyService($id)
    {
        $service = Service::findOrFail($id);
        $service->delete();

        return redirect()->back()->with('success', 'Hizmet silindi.');
    }

    // saveAvailability eklentisi (İhtiyacın olursa hazır)
    public function saveAvailability(Request $request)
    {
        return back()->with('success', 'Müsaitlik kaydedildi.');
    }

    public function updateStatus(Request $request, Appointment $appointment)
    {
        $request->validate([
          'status' => 'required|in:pending,completed,cancelled',
        ]);

        $appointment->update([
         'status' => $request->status,
        ]);

        return back();
    }

    public function indexAllForTechnical()
    {
        $appointments = Appointment::with(['user', 'service'])->latest()->get();

        return Inertia::render('TeknikElemanPaneli/TumRandevular', [
          'appointments' => $appointments
        ]);
    }
}