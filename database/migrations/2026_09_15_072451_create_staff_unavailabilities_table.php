<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('staff_unavailabilities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Hangi personel? (Ahmet'in ID'si)
            $table->date('date'); // Hangi gün müsait değil? (Örn: 2026-10-10)
            $table->time('start_time'); // Saat kaçta başlıyor? (Örn: 13:00)
            $table->time('end_time'); // Saat kaçta bitiyor? (Örn: 15:00)
            $table->string('reason')->nullable(); // İsteğe bağlı sebep (Örn: Toplantı, İzin)
            $table->timestamps();
        });
    }
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('staff_unavailabilities');
    }
};
