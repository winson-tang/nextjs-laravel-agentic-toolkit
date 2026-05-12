/**
 * Phase: 2 (transcripts service)
 * Failure scenarios covered: F-2 (vendor failure), F-4 (idempotent upload),
 *   F-7 (cross-tenant read denied).
 *
 * Integration-style: exercises the TranscriptsService through its public
 * interface, with a real (in-memory) backend. Vendor is the only thing mocked
 * because it represents a true external boundary.
 */

import { TranscriptsService, type UploadInput } from "@/app/lib/transcripts";

function makeService(opts: { vendorFails?: number } = {}) {
  let attempt = 0;
  const vendor = {
    async transcribe() {
      attempt++;
      if (opts.vendorFails && attempt <= opts.vendorFails) {
        throw new Error("vendor 500");
      }
      return { text: "transcript ok" };
    },
  };
  return new TranscriptsService(vendor, 3);
}

const baseInput: UploadInput = {
  tenantId: "tenant-a",
  patientId: "TEST_PATIENT_001",
  idempotencyKey: "key-1",
  audioBytes: 100,
};

describe("TranscriptsService", () => {
  it("returns the same transcript when uploaded twice with the same idempotency key", async () => {
    const service = makeService();
    const first = await service.upload(baseInput);
    const second = await service.upload(baseInput);
    expect(second.id).toBe(first.id);
  });

  it("marks transcript ready after a successful vendor call", async () => {
    const service = makeService();
    const t = await service.upload(baseInput);
    // Allow background transcription to settle.
    await waitFor(() => service.getById("tenant-a", t.id).then((x) => x?.status === "ready"));
    const final = await service.getById("tenant-a", t.id);
    expect(final?.status).toBe("ready");
    expect(final?.text).toBe("transcript ok");
  });

  it("retries on vendor failure and eventually marks ready", async () => {
    const service = makeService({ vendorFails: 2 });
    const t = await service.upload(baseInput);
    await waitFor(() => service.getById("tenant-a", t.id).then((x) => x?.status === "ready"));
    const final = await service.getById("tenant-a", t.id);
    expect(final?.status).toBe("ready");
  });

  it("marks transcript unavailable when vendor fails beyond maxAttempts", async () => {
    const service = makeService({ vendorFails: 99 });
    const t = await service.upload(baseInput);
    await waitFor(() => service.getById("tenant-a", t.id).then((x) => x?.status === "unavailable"));
    const final = await service.getById("tenant-a", t.id);
    expect(final?.status).toBe("unavailable");
  });

  it("does not return a transcript to a different tenant", async () => {
    const service = makeService();
    const t = await service.upload(baseInput);
    const crossRead = await service.getById("tenant-b", t.id);
    expect(crossRead).toBeNull();
  });
});

async function waitFor(predicate: () => Promise<boolean>, timeoutMs = 3000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await predicate()) return;
    await new Promise((r) => setTimeout(r, 25));
  }
  throw new Error("waitFor timed out");
}
