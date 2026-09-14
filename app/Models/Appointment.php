<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Appointment extends Model
{
    use HasFactory;

    protected $fillable = [
        'service_id',
        'user_id', // Temsilci ID alanı
        'client_name',
        'client_email',
        'client_phone',
        'date',
        'start_time',
        'end_time',
        'status',
        'notes',
    ];

    // Hizmet İlişkisi
    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    // Temsilci (Kullanıcı) İlişkisi - EKSİK OLAN KISIM
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}