# Demo Project

A minimal Next.js + Node API + Playwright/Jest scaffold used to demonstrate the agent pipeline on a realistic but small feature surface.

## What it shows

- A Sycle-flavored "appointment audio recording + transcript" slice.
- Idempotent upload endpoint with tenant-scoped read.
- PHI redaction in the demo logger.
- Vendor-retry behavior with bounded attempts.
- Jest unit + integration tests against the **public** interface (per the `tdd` skill).
- One Playwright e2e flow with an accessibility check.

## What it intentionally does NOT do

- Persist to a real database (it uses in-memory storage).
- Call a real transcription vendor (stubbed; flips success/failure to demo retries).
- Implement real auth (uses an `x-tenant-id` header).

These omissions make the demo easy to extend without fighting infrastructure.

## Running it

```bash
cd demo
npm install
npm run dev        # http://localhost:3000
npm test           # jest unit + integration
npm run e2e        # playwright (boots the dev server automatically)
npm run typecheck
npm run lint
```

## Extension points

Likely targets when extending the demo with the agent pipeline:

1. **Add a Gherkin scenario** (`specs/appointment-recording.feature`), parse it with the `bdd-spec-parser` skill, and let the planner extend `PLAN.md`.
2. **Make the failing test** (red), then the implementer makes it green.
3. **Add a HIPAA finding** by introducing a `console.log(patient)` somewhere and have the `security-auditor` agent catch it.
4. **Add a vendor BAA check** at startup: the service refuses to call the transcription vendor unless `process.env.VENDOR_BAA_VERIFIED === "true"`.
5. **Migrate state to a real DB** if you want depth (talk through migrations and tenant scoping in queries).

## Reference

- `app/lib/redact.ts`, PHI redactor (used by the logger).
- `app/lib/logger.ts`, Structured logger that runs the redactor.
- `app/lib/transcripts.ts`, TranscriptsService with idempotency + retries + tenant isolation.
- `app/api/appointments/route.ts`, Next.js API route for upload + read.
- `app/page.tsx`, Minimal UI for the demo flow.
- `specs/appointment-recording.feature`, Gherkin spec that the bdd-spec-parser consumes.
