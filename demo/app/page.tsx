/**
 * Minimal home page that demonstrates the appointment recording flow.
 * Intentionally simple so it can be extended without fighting an over-designed UI.
 */
"use client";

import { useState } from "react";

interface Transcript {
  id: string;
  status: "pending" | "ready" | "unavailable";
  text: string | null;
}

export default function Home() {
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [status, setStatus] = useState<string>("idle");

  async function startUpload() {
    setStatus("uploading");
    const idempotencyKey = crypto.randomUUID();
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "content-type": "application/json", "x-tenant-id": "demo-tenant" },
      body: JSON.stringify({
        patientId: "TEST_PATIENT_001",
        idempotencyKey,
        audioBytes: 1024 * 100,
      }),
    });
    if (!res.ok) {
      setStatus("upload_failed");
      return;
    }
    const t: Transcript = await res.json();
    setTranscript(t);
    setStatus("polling");
    void pollTranscript(t.id);
  }

  async function pollTranscript(id: string) {
    for (let i = 0; i < 20; i++) {
      await sleep(500);
      const res = await fetch(`/api/appointments?id=${encodeURIComponent(id)}`, {
        headers: { "x-tenant-id": "demo-tenant" },
      });
      if (!res.ok) continue;
      const t: Transcript = await res.json();
      setTranscript(t);
      if (t.status === "ready" || t.status === "unavailable") {
        setStatus(t.status);
        return;
      }
    }
    setStatus("timeout");
  }

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: 32, maxWidth: 720 }}>
      <h1>Appointment Audio Recording (Demo)</h1>
      <p>Click below to simulate an upload and transcription.</p>
      <button
        type="button"
        onClick={startUpload}
        disabled={status === "uploading" || status === "polling"}
        aria-label="Start recording"
      >
        Start recording
      </button>
      <p aria-live="polite" data-testid="status">Status: {status}</p>
      {transcript && (
        <pre data-testid="transcript">
{JSON.stringify(transcript, null, 2)}
        </pre>
      )}
    </main>
  );
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}
