<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StaffUnavailability extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'date',
        'start_time',
        'end_time',
        'reason',
    ];

    // Personel ile ilişki (Hangi kullanıcıya ait?)
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}