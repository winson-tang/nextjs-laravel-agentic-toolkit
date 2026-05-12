---
name: failure-scenario-design
description: Apply before writing any implementation. Generates a failure scenarios table covering 7 mandatory categories. Run this before engaging tdd-tester. Never start implementation without at least one scenario in each of F-H, F-V, F-X, and F-A.
---

## The 7 Mandatory Categories

| Code | Category | Definition |
|------|----------|------------|
| F-H | Happy path | The primary success case when all inputs are valid and all dependencies respond correctly |
| F-V | Input validation | Invalid types, missing required fields, boundary values, oversized payloads, wrong formats |
| F-X | External failure | Downstream vendor down, timeout, unexpected 5xx, empty or malformed response body |
| F-A | Auth / tenant | Unauthenticated request, wrong tenant ID, expired session, cross-tenant data leak attempt |
| F-I | Idempotency | Same request submitted twice, retry storm, partial failure mid-operation |
| F-P | PHI handling | PHI present in log line, PHI in error message, PHI in URL, PHI passed to non-BAA vendor |
| F-C | Concurrency | Race between write and read, double-submit, partial commit, stale cache |

---

## Trigger Questions Per Category

**F-H (Happy path)**
- What does success look like end-to-end?
- What does the caller receive when everything works?

**F-V (Input validation)**
- Which fields are required? What happens if one is missing?
- What are the min/max bounds? What happens at the boundary and one past it?
- What happens with an empty string, null, or wrong type?

**F-X (External failure)**
- What external services does this call? What if each one is down?
- What if the response times out after 5 seconds? After 30 seconds?
- What if the response body is empty? Malformed JSON? A 200 with an error payload?

**F-A (Auth / tenant)**
- What happens if no session token is present?
- What happens if the session belongs to tenant A but the resource belongs to tenant B?
- What happens if the session has expired mid-request?

**F-I (Idempotency)**
- What happens if the client submits the same request twice within 1 second?
- What happens if the operation partially completes before failure? Can it resume safely?
- What if a queue message is delivered twice?

**F-P (PHI handling)**
- If this operation fails and logs the error, could any patient identifier appear in the log?
- Does the URL or query string ever contain a patient identifier?
- Does any error response body include patient data?
- Does any vendor call receive raw PHI, and is that vendor on the BAA list?

**F-C (Concurrency)**
- What if two requests for the same resource arrive simultaneously?
- What if a read happens while a write is in progress?
- Does anything rely on in-memory state that could be inconsistent under load?

---

## Output Format

Produce a markdown table with these columns:

| ID | Category | Scenario | Acceptance Criterion |
|----|----------|----------|----------------------|
| F-H1 | Happy path | Clinician uploads 30s audio with valid idempotency key | Transcript record created, status=pending, 200 returned |
| F-V1 | Validation | Upload payload missing idempotencyKey | 400 returned, no record created |
| F-X1 | External failure | Vendor returns 5xx on all 3 retry attempts | Transcript status=unavailable, audio preserved, caller receives descriptive error |
| F-A1 | Auth | Request arrives with no session token | 401 returned, no data accessed |
| F-A2 | Auth | Request targets transcript belonging to different tenant | 404 returned (not 403 -- don't confirm existence) |
| F-I1 | Idempotency | Same idempotency key submitted twice | Second request returns existing transcript, no duplicate created |
| F-P1 | PHI handling | Vendor call throws exception with patient name in message | Exception caught and re-thrown with PHI redacted; original PHI not logged |
| F-C1 | Concurrency | Two uploads with same idempotency key arrive simultaneously | Exactly one transcript created; both callers receive the same record |

---

## Minimum Coverage Rules

Before handing off to the planner or tdd-tester:

- [ ] At least one F-H scenario (required always)
- [ ] At least one F-V scenario (required always)
- [ ] At least one F-X scenario (required always)
- [ ] At least one F-A scenario (required always)
- [ ] F-I scenarios for any operation that can be retried or submitted by multiple callers
- [ ] At least two F-P scenarios for any feature that touches patient data (patient names, MRNs, DOBs, audio, transcripts, addresses, phones, emails)
- [ ] F-C scenarios for any operation involving shared state or a multi-step write

**PHI rule:** If the feature touches patient data at any point (even just reading it), F-P is mandatory, not optional.

---

## Worked Example: Appointment Recording Upload

From `demo/specs/appointment-recording.feature`:

| ID | Category | Scenario | Acceptance Criterion |
|----|----------|----------|----------------------|
| F-H1 | Happy path | Valid upload with new idempotency key | 200, transcript record created, status=pending |
| F-H2 | Happy path | Transcript becomes ready within 60s | status=ready, text populated, clinician can edit |
| F-V1 | Validation | Missing idempotencyKey | 400, Zod validation error, no record created |
| F-V2 | Validation | audioBytes is 0 or negative | 400, Zod validation error |
| F-V3 | Validation | tenantId is empty string | 400, Zod validation error |
| F-X1 | External failure | Vendor 5xx on attempt 1 of 3 | Retry proceeds |
| F-X2 | External failure | Vendor 5xx on all 3 attempts | status=unavailable, audio preserved |
| F-A1 | Auth | No session token | 401, no data returned |
| F-A2 | Auth | Session tenant != transcript tenant | getById returns null (no cross-tenant leak) |
| F-I1 | Idempotency | Same idempotency key submitted twice | Second call returns existing transcript, no duplicate |
| F-P1 | PHI handling | Vendor throws exception mentioning patient name | Exception re-thrown with PHI redacted, original not logged |
| F-P2 | PHI handling | Upload fails mid-way | Error logged without patient identifiers in the log line |

---

## Manual Checklist (no tooling)

- [ ] Table created with all 7 category codes represented (or explicitly marked N/A with reason)
- [ ] Each scenario has a specific, testable acceptance criterion (not "works correctly")
- [ ] PHI-touching features have at least 2 F-P scenarios
- [ ] IDs assigned sequentially within each category (F-H1, F-H2, F-V1, ...)
- [ ] No real patient data used in any scenario description
