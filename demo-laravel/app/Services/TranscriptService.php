<?php

namespace App\Services;

use App\Models\Transcript;
use App\Support\AuditLogger;

class TranscriptService
{
    private const MAX_ATTEMPTS = 3;

    public function __construct(private readonly VendorServiceInterface $vendor) {}

    public function upload(string $tenantId, string $patientId, string $idempotencyKey, string $audioPath): Transcript
    {
        $existing = Transcript::where('idempotency_key', $idempotencyKey)->first();
        if ($existing !== null) {
            AuditLogger::info('transcript_upload_duplicate', ['transcriptId' => $existing->id]);
            return $existing;
        }

        $transcript = Transcript::create([
            'tenant_id'       => $tenantId,
            'patient_id'      => $patientId,
            'idempotency_key' => $idempotencyKey,
            'status'          => 'pending',
        ]);

        AuditLogger::info('transcript_upload_started', ['transcriptId' => $transcript->id]);

        $text = $this->runTranscriptionWithRetry($audioPath);

        if ($text !== null) {
            $transcript->update(['status' => 'ready', 'text' => $text]);
            AuditLogger::info('transcript_upload_completed', ['transcriptId' => $transcript->id]);
        } else {
            $transcript->update(['status' => 'unavailable']);
            AuditLogger::warning('transcript_upload_failed', ['transcriptId' => $transcript->id]);
        }

        return $transcript->fresh();
    }

    public function getById(string $tenantId, string $id): ?Transcript
    {
        // Tenant filter at query layer, never post-retrieval
        return Transcript::where('tenant_id', $tenantId)->find($id);
    }

    private function runTranscriptionWithRetry(string $audioPath): ?string
    {
        for ($attempt = 0; $attempt < self::MAX_ATTEMPTS; $attempt++) {
            try {
                return $this->vendor->transcribe($audioPath);
            } catch (\Throwable) {
                if ($attempt < self::MAX_ATTEMPTS - 1) {
                    $this->sleep(2 ** $attempt * 100_000);
                }
            }
        }
        return null;
    }

    // Isolated so tests can override without real waits
    protected function sleep(int $microseconds): void
    {
        usleep($microseconds);
    }
}
