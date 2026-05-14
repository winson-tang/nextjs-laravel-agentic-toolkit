<?php

use App\Http\Controllers\Api\AppointmentsController;
use Illuminate\Support\Facades\Route;

Route::post('/appointments/upload', [AppointmentsController::class, 'upload']);
Route::get('/appointments/{id}', [AppointmentsController::class, 'show']);
