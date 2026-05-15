---
name: hipaa-audit
description: Apply to any diff touching PHI, auth, audit logs, vendor integrations, or session handling. Produces a findings table with severity. Required before pr-reviewer can APPROVE on PHI-touching diffs.
---

## When to Run

Run security-auditor (which applies this skill) on any diff touching:

- Patient data tables (transcripts, appointments, patients, audio)
- `app/lib/redact.ts`, `app/lib/logger.ts`, `app/lib/transcripts.ts`
- API route handlers that accept or return patient data
- Auth middleware or session handling
- Any call to a third-party vendor SDK
- Logging configuration

---

## The HIPAA Checklist (12 items, 6 categories)

### Category 1: PHI in Transit

| # | Check | How to verify |
|---|-------|---------------|
| 1.1 | No PHI in log lines | Search diff for `log(`, `logger.`, `console.` -- confirm no patient field is passed directly |
| 1.2 | No PHI in error messages surfaced to callers | Check all `new Error(...)` and `throw` statements -- patient identifiers must not appear |
| 1.3 | No PHI in error stack traces | Confirm any caught exception is re-thrown through `redactValue` before logging |
| 1.4 | No PHI in URL path or query string | Check route handlers -- patient IDs belong in request body or auth context, not URLs |
| 1.5 | No PHI in metric labels or telemetry | If any monitoring calls exist, confirm patient fields are not passed as label values |

### Category 2: Tenant Isolation

| # | Check | How to verify |
|---|-------|---------------|
| 2.1 | Every patient-data query includes `tenant_id` filter at query layer | Search for any `.find`, `.where`, `SELECT` -- confirm `tenant_id` is present, not assumed from app context |
| 2.2 | Cross-tenant test exists | Confirm at least one test verifies that tenant A cannot read tenant B's data (see F-A2 in failure-scenario-design) |

### Category 3: Auth and Access Control

| # | Check | How to verify |
|---|-------|---------------|
| 3.1 | Authentication required on every patient-data route | Confirm auth middleware is applied; no route handler accesses patient data before session is verified |
| 3.2 | Role checked where required | If the feature is role-restricted, confirm the role check is at the handler layer, not just the UI |

### Category 4: Audit Trail

| # | Check | How to verify |
|---|-------|---------------|
| 4.1 | Write events on PHI are logged with: user ID, tenant ID, action type, timestamp | Confirm any create/update/delete of patient data emits a structured audit log event |
| 4.2 | Audit log line contains no PHI | The audit log records THAT an action happened, not WHAT the PHI content was |

### Category 5: BAA Vendor Check

| # | Check | How to verify |
|---|-------|---------------|
| 5.1 | Any vendor call that receives or processes PHI is on the BAA list | If a new SDK import appears in the diff, flag it -- confirm BAA status before merge |

### Category 6: Minimum Necessary Principle

| # | Check | How to verify |
|---|-------|---------------|
| 6.1 | Response payloads include only the fields the caller needs | Check API response shapes -- no over-fetching of PHI fields (e.g., returning full patient record when only name needed) |

---

## Output Format

Produce a findings table:

| Check | Status | Evidence | Severity | Recommendation |
|-------|--------|----------|----------|----------------|
| 1.1 PHI in logs | PASS | logger.ts uses redactValue on all inputs | -- | -- |
| 2.1 Tenant isolation | PASS | getById checks tenantId before returning | -- | -- |
| 5.1 BAA vendor | WARN | New VendorSDK import -- BAA status not confirmed | warning | Confirm vendor is on BAA list before merge |

**Status values:** PASS / FAIL / WARN / NA

**Severity definitions:**
- `critical` -- must fix before merge: PHI leak, missing auth, missing tenant filter
- `warning` -- must fix within sprint: unconfirmed BAA vendor, missing audit log, over-fetching PHI
- `info` -- recommendation: minor improvement, no immediate risk

**Verdict line (at end of findings):**

```
VERDICT: APPROVE | CONDITIONAL APPROVE (warnings listed) | REQUEST CHANGES (critical findings listed)
```

---

## Canonical PASS Examples

**TypeScript (Next.js / Node):**
- **PHI in logs:** `demo/app/lib/logger.ts` -- uses `redactValue` on all inputs before emitting
- **PHI redaction:** `demo/app/lib/redact.ts` -- patterns cover SSN, DOB, MRN, email, phone
- **Tenant isolation:** `demo/app/lib/transcripts.ts` -- `getById` checks `t.tenantId !== tenantId`
- **Input validation:** `demo/app/api/appointments/route.ts` -- Zod `UploadSchema.parse(body)` before any business logic

**PHP (Laravel):**
- **PHI in logs:** `demo-laravel/app/Support/AuditLogger.php` -- all context passes through `PhiRedactor::redactValue()` before `Log::info()`
- **PHI redaction:** `demo-laravel/app/Support/PhiRedactor.php` -- same pattern set (SSN, DOB, MRN, EMAIL, PHONE) in PHP regex
- **Tenant isolation:** `demo-laravel/app/Services/TranscriptService.php` -- `getById` uses `Transcript::where('tenant_id', $tenantId)->find($id)` at query layer
- **Input validation:** `demo-laravel/app/Http/Requests/UploadAudioRequest.php` -- Form Request `rules()` enforced by Laravel before controller body runs; controller calls `$request->validated()`

---

## Manual Checklist (no tooling)

Walk through this list against the diff before any merge on a PHI-touching feature:

- [ ] 1.1: No PHI in log lines
- [ ] 1.2: No PHI in error messages to callers
- [ ] 1.3: Caught exceptions pass through redactValue before logging
- [ ] 1.4: No PHI in URL or query string
- [ ] 2.1: Every patient query has tenant_id filter at query layer
- [ ] 2.2: Cross-tenant test exists
- [ ] 3.1: Auth middleware verified on every new route
- [ ] 4.1: Write events emit structured audit log (userId, tenantId, action, timestamp)
- [ ] 4.2: Audit log contains no PHI content
- [ ] 5.1: Any new vendor that touches PHI is on the BAA list
- [ ] 6.1: Response payloads do not over-fetch PHI fields
