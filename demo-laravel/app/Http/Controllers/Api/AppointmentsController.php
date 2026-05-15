<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UploadAudioRequest;
use App\Services\TranscriptService;
use App\Support\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AppointmentsController extends Controller
{
    public function __construct(private readonly TranscriptService $transcripts) {}

    public function upload(UploadAudioRequest $request): JsonResponse
    {
        $tenantId = $request->header('X-Tenant-Id', '');

        if ($tenantId === '') {
            return response()->json(['error' => 'Missing X-Tenant-Id header'], 400);
        }

        $data = $request->validated();

        AuditLogger::info('appointment_upload_started', ['tenantId' => $tenantId]);

        $transcript = $this->transcripts->upload(
            $tenantId,
            $data['patient_id'],
            $data['idempotency_key'],
            $data['audio_path'],
        );

        return response()->json([
            'id'     => $transcript->id,
            'status' => $transcript->status,
        ], 202);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $tenantId = $request->header('X-Tenant-Id', '');

        if ($tenantId === '') {
            return response()->json(['error' => 'Missing X-Tenant-Id header'], 400);
        }

        $transcript = $this->transcripts->getById($tenantId, $id);

        if ($transcript === null) {
            return response()->json(['error' => 'Not found'], 404);
        }

        return response()->json([
            'id'     => $transcript->id,
            'status' => $transcript->status,
            'text'   => $transcript->text,
        ]);
    }
}
