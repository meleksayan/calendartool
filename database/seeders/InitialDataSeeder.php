<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Service;
use App\Models\WorkingHour;

class InitialDataSeeder extends Seeder
{
    public function run(): void
    {
        // Gerçek Hizmet Listesi
        Service::create(['name' => 'Kurulum Hizmeti', 'duration' => 60]);
        Service::create(['name' => 'Bakım ve Onarım', 'duration' => 90]);
        Service::create(['name' => 'Teknik Destek ve Arıza Tespiti', 'duration' => 45]);

        // Pazartesi - Cumartesi mesai (1 - 6 arası açık)
        for ($day = 1; $day <= 6; $day++) {
            WorkingHour::create([
                'day_of_week' => $day,
                'start_time' => '10:00',
                'end_time' => '18:00',
                'is_off' => false,
            ]);
        }

        // Sadece Pazar (0) kapalı
        WorkingHour::create([
            'day_of_week' => 0, 
            'start_time' => '09:00', 
            'end_time' => '18:00', 
            'is_off' => true
        ]);
    }
}