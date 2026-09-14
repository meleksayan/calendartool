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
       Schema::create('working_hours', function (Blueprint $table) {
        $table->id();
        $table->unsignedTinyInteger('day_of_week'); // 0: Pazar, 1: Pazartesi...
        $table->time('start_time');
        $table->time('end_time');
        $table->boolean('is_off')->default(false);
        $table->timestamps();
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('working_hours');
    }
};
