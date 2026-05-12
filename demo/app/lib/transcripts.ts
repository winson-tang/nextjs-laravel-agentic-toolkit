/**
 * In-memory transcripts service for the demo. Real implementation would
 * use Postgres + a queue + a BAA-signed transcription vendor.
 *
 * Behaviors covered:
 *  - Idempotent upload (same idempotency-key returns existing transcript).
 *  - Vendor failure retries (up to maxAttempts; surfaces "unavailable" after).
 *  - Tenant-scoped reads (no cross-tenant leakage).
 *
 * All behaviors here are fair game to break or extend with the agent pipeline.
 */

import { z } from "zod";

export const UploadSchema = z.object({
  tenantId: z.string().min(1),
  patientId: z.string().min(1),
  idempotencyKey: z.string().min(1),
  audioBytes: z.number().int().positive(),
});

export type UploadInput = z.infer<typeof UploadSchema>;

export interface Transcript {
  id: string;
  tenantId: string;
  patientId: string;
  status: "pending" | "ready" | "unavailable";
  text: string | null;
  createdAt: string;
}

interface VendorClient {
  transcribe(input: UploadInput): Promise<{ text: string }>;
}

export class TranscriptsService {
  private byKey = new Map<string, Transcript>();   // idempotencyKey -> transcript
  private byId = new Map<string, Transcript>();    // id -> transcript

  constructor(
    private readonly vendor: VendorClient,
    private readonly maxAttempts = 3,
  ) {}

  async upload(input: UploadInput): Promise<Transcript> {
    const parsed = UploadSchema.parse(input);
    const existing = this.byKey.get(parsed.idempotencyKey);
    if (existing) return existing;

    const transcript: Transcript = {
      id: cryptoRandomId(),
      tenantId: parsed.tenantId,
      patientId: parsed.patientId,
      status: "pending",
      text: null,
      createdAt: new Date().toISOString(),
    };
    this.byKey.set(parsed.idempotencyKey, transcript);
    this.byId.set(transcript.id, transcript);

    // Kick off transcription (in real life this would be a queued job).
    void this.runTranscriptionWithRetry(transcript, parsed);

    return transcript;
  }

  async getById(tenantId: string, id: string): Promise<Transcript | null> {
    const found = this.byId.get(id);
    if (!found) return null;
    if (found.tenantId !== tenantId) return null; // tenant isolation
    return found;
  }

  private async runTranscriptionWithRetry(t: Transcript, input: UploadInput): Promise<void> {
    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      try {
        const result = await this.vendor.transcribe(input);
        t.text = result.text;
        t.status = "ready";
        return;
      } catch {
        if (attempt === this.maxAttempts) {
          t.status = "unavailable";
          return;
        }
        await sleep(2 ** attempt * 100); // exponential backoff
      }
    }
  }
}

function cryptoRandomId(): string {
  return "t_" + Math.random().toString(36).slice(2, 11);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
