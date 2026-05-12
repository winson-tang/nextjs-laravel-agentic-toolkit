---
name: bdd-spec-parser
description: Apply when given a Gherkin feature file, a user story, or a free-form spec. Produces a structured PLAN_INPUT.md with Background context and a numbered failure scenarios table ready for the planner agent.
---

## Input Forms Accepted

1. **Gherkin `.feature` file** -- canonical; parse directly
2. **User story prose** -- "As a [actor], I want [capability], so that [benefit]"
3. **Free-form requirements** -- verbal description, Slack message, Jira description

---

## Parsing Algorithm

### Step 1: Extract the actor

Who is the subject of every scenario? One primary actor per feature.

Examples: `clinician`, `admin`, `billing_user`, `system (automated job)`

### Step 2: Extract the system boundary

What subsystem does this feature touch?

Examples: `TranscriptsService`, `appointments API route`, `PHI redaction middleware`, `patient lookup autocomplete`

### Step 3: Extract the Background

What is always true before any scenario starts?

Include: authentication state, tenant context, preconditions on data.

Example from `appointment-recording.feature`:
```
Background:
  Given a clinician is logged in with an active session
  And the session belongs to tenant T001
  And an appointment exists for patient P001 in that tenant
```

### Step 4: Parse each explicit Scenario

For each Scenario or Scenario Outline:
- Extract: Given (precondition), When (action), Then (expected outcome)
- Assign an ID: S-01, S-02, ...
- Label the type: happy / validation / external-failure / auth / idempotency / phi / concurrency

### Step 5: Infer missing failure scenarios

For every step in the happy path, ask "what could go wrong here?":

| Happy path step | Inferred failure scenario |
|---|---|
| User uploads audio | Upload payload too large / malformed / missing field |
| System calls vendor | Vendor returns 5xx / times out / returns empty transcript |
| System stores result | Duplicate key / same idempotency key submitted twice |
| System returns result | Result belongs to different tenant / unauthenticated request |
| Logs written | PHI present in log line / PHI present in error stack trace |

---

## Output Format: PLAN_INPUT.md

```markdown
# PLAN_INPUT: [Feature Name]

## Actor
[actor]

## System Boundary
[subsystem]

## Background
[Background block in Given/And format]

## Scenarios

| ID | Type | Given | When | Then |
|----|------|-------|------|------|
| S-01 | happy | ... | ... | ... |
| S-02 | validation | ... | ... | ... |
| S-03 | external-failure | ... | ... | ... |
| S-04 | auth | ... | ... | ... |
| S-05 | idempotency | ... | ... | ... |
| S-06 | phi | ... | ... | ... |
```

---

## PHI Canonicalization Rule

Never use real patient names, DOBs, MRNs, or phone numbers in any output.

Use these canonical stand-ins:
- Patient: `TEST_PATIENT_001`, `TEST_PATIENT_002`
- Tenant: `TEST_TENANT_001`
- MRN: `MRN-TEST-000001`
- DOB: `1900-01-01`
- Phone: `555-000-0001`

---

## Minimum Coverage Rule

Before handing off to the planner agent, confirm at least one scenario exists in each category:

- [ ] happy -- the primary success path
- [ ] validation -- at least one invalid input
- [ ] external-failure -- at least one vendor or downstream failure
- [ ] auth -- at least one unauthenticated or wrong-tenant case
- [ ] phi -- at least one "PHI must not appear in..." scenario (for any feature touching patient data)

If a category has zero scenarios, add an inferred one before handing off.

---

## Worked Example

Input: `demo/specs/appointment-recording.feature`

Output table:

| ID | Type | Given | When | Then |
|----|------|-------|------|------|
| S-01 | happy | Clinician authenticated, appointment active | Records 30s, stops, uploads | Transcript appears within 60s, editable |
| S-02 | external-failure | Same | Network drops mid-upload | Queued locally, sync on reconnect, no duplicate |
| S-03 | external-failure | Same | Vendor returns 5xx 3 times | "Transcription unavailable", audio preserved |
| S-04 | idempotency | Same | Same idempotency key submitted twice | 200 + existing transcript ID, no second record |
| S-05 | phi | Any | Any scenario completes | No PHI in logs, no PHI in error traces |
| S-06 (inferred) | validation | Same | Payload missing idempotencyKey | 400 validation error |
| S-07 (inferred) | auth | No session / wrong tenant | Attempt upload | 401 / 403, no data leak |

---

## Manual Checklist (no tooling)

- [ ] Actor identified
- [ ] System boundary named
- [ ] Background block written
- [ ] All explicit Gherkin scenarios parsed to table rows
- [ ] Inferred failure scenarios added for each happy-path step
- [ ] At least one scenario per mandatory category
- [ ] All patient identifiers replaced with TEST_PATIENT_NNN placeholders
