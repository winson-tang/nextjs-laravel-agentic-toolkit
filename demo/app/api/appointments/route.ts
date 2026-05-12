/**
 * POST /api/appointments/upload  , start an audio upload, returns transcript stub
 * GET  /api/appointments/:id     , fetch transcript status (tenant-scoped)
 *
 * NOTE: For demo purposes, the "tenant" is derived from a header; in a real
 * Sycle service it would come from the authenticated session.
 */

import { NextRequest, NextResponse } from "next/server";
import { TranscriptsService, UploadSchema } from "@/app/lib/transcripts";
import { logger } from "@/app/lib/logger";

// Singleton service for the demo (in real life: DI container).
const fakeVendor = {
  async transcribe(input: { audioBytes: number }) {
    // Pretend a real transcription. Fail occasionally for demo purposes.
    if (Math.random() < 0.1) throw new Error("vendor 500");
    return { text: `Synthetic transcript (${input.audioBytes} bytes).` };
  },
};
const service = new TranscriptsService(fakeVendor);

function tenantFromRequest(req: NextRequest): string | null {
  return req.headers.get("x-tenant-id");
}

export async function POST(req: NextRequest) {
  const tenantId = tenantFromRequest(req);
  if (!tenantId) {
    return NextResponse.json({ error: "missing_tenant" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = UploadSchema.safeParse({ ...body, tenantId });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const t = await service.upload(parsed.data);
    logger.info("transcript_upload_started", { transcriptId: t.id });
    return NextResponse.json(t, { status: 202 });
  } catch (err) {
    logger.error("transcript_upload_failed", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const tenantId = tenantFromRequest(req);
  if (!tenantId) {
    return NextResponse.json({ error: "missing_tenant" }, { status: 401 });
  }
  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "missing_id" }, { status: 400 });
  }
  const t = await service.getById(tenantId, id);
  if (!t) {
    // Note: returning 404 in both "not found" and "wrong tenant" cases
    // avoids leaking existence across tenants.
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json(t);
}
