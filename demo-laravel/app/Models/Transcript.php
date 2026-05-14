<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Transcript extends Model
{
    use HasUuids;

    protected $fillable = [
        'tenant_id',
        'patient_id',
        'idempotency_key',
        'status',
        'text',
    ];
}
