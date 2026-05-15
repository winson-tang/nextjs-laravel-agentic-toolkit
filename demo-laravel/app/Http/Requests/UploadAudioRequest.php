<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UploadAudioRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Demo: always true. Production: verify tenant session ownership.
        return true;
    }

    public function rules(): array
    {
        return [
            'audio_path'       => ['required', 'string'],
            'patient_id'       => ['required', 'string'],
            'idempotency_key'  => ['required', 'string'],
        ];
    }
}
