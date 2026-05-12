---
name: agent-orchestration
description: The master pipeline playbook. Read this when you need to decide which agent to call next, how to handle agent mistakes, or how to handle parallel vs. sequential execution.
---

## Feature Delivery Pipeline

```
bdd-spec-parser (skill)
        |
        v
    planner agent  <-- asks 2-4 clarifying questions first
        |
        v (produces PLAN.md with failure scenarios table)
        |
    tdd-tester agent  <-- one failing test per scenario
        |
        v (test is red for the right reason)
        |
    implementer agent  <-- smallest diff to turn test green
        |
        v (test is green, suite still passes)
        |
    [repeat tdd-tester + implementer per scenario]
        |
        v (all PLAN.md scenarios are green)
        |
    code-reviewer + security-auditor  <-- run IN PARALLEL
        |
        v (findings from both)
        |
    documentation-writer
        |
        v (ADR, CHANGELOG, CONTEXT.md updated)
        |
    pr-reviewer  <-- final gate
```

## Troubleshooting Pipeline

```
troubleshooter agent
        |
        v (root cause identified, code fix + agent-system fix proposed)
        |
    tdd-tester agent  <-- write regression test first
        |
        v (regression test is red)
        |
    implementer agent  <-- fix the code
        |
        v (regression test is green, no regressions)
        |
    code-reviewer + security-auditor  <-- run IN PARALLEL
        |
        v
    [update agent/skill]  <-- THE MANDATORY SECOND DELIVERABLE
        |
        v
    pr-reviewer
```

---

## Sequencing Rules

| Dependency pair | Reason |
|---|---|
| planner must run before tdd-tester | tdd-tester needs the failure scenarios table from PLAN.md |
| tdd-tester must run before implementer | implementer needs a failing test to define the contract |
| implementer must confirm green before next tdd-tester call | Don't stack red tests; each scenario must be green before starting the next |
| code-reviewer and security-auditor run before pr-reviewer | pr-reviewer requires their verdicts as input |
| documentation-writer runs before pr-reviewer | pr-reviewer checks that CONTEXT.md/CHANGELOG were updated |
| troubleshooter must complete before tdd-tester on bug fixes | Regression test must be written against the identified root cause, not a guess |

---

## Parallel Fan-Out Rules

**Run in parallel:**
- `code-reviewer` + `security-auditor` -- they examine the same diff from independent lenses and have no shared state

**Run sequentially (never in parallel):**
- `tdd-tester` then `implementer` -- each implementer run depends on the specific failing test
- `troubleshooter` then `tdd-tester` -- regression test must be anchored to a confirmed root cause

---

## The "Fix the Agent" Protocol

When an agent produces incorrect, unsafe, or inconsistent output, the deliverable is two diffs:

**Step 1:** Identify the class of mistake
- Categories: PHI leak, missing test, wrong error type handled, skipped security check, tenant filter omitted, bad commit format, etc.

**Step 2:** Identify which agent or skill allowed it
- Examples: implementer wrote a log line with PHI because its prompt doesn't call out logger.ts redaction; tdd-tester wrote an implementation-detail test because its prompt doesn't cite canonical examples

**Step 3:** Write the code fix (the immediate PR change)

**Step 4:** Write the agent-system fix
- Edit the relevant `.claude/agents/<name>.md` or `.claude/skills/<name>/SKILL.md`
- Add an explicit prohibition, a canonical example, or a checklist item that would have caught the mistake
- The fix must be specific enough that the same class of mistake cannot pass through the agent undetected

**Step 5:** Log to `docs/agent-lessons.md`
- Format: date, which agent, the mistake class, the code fix (one line), the agent-system fix (one line)

**The rule:** If the same bug class appears three times without an agent-system fix, the process is failing. Escalate.

---

## Anti-Patterns

| Anti-pattern | Consequence |
|---|---|
| Running implementer without a failing test | Untested code; defeats TDD discipline; code-reviewer will flag it |
| Skipping security-auditor on PHI-touching code | PHI leak risk reaches pr-reviewer undetected |
| Running pr-reviewer without code-reviewer and security-auditor verdicts | Integration verdict is incomplete |
| Fixing the same bug class 3 times without updating an agent | Process is not learning; throughput decays |
| Drive-by tech debt during implementer run | Scope creep; harder to bisect regressions; goes to FOLLOWUPS.md instead |
| Approving your own PR | CLAUDE.md hard rule; pr-reviewer enforces it |
| Skipping documentation-writer after a feature | CONTEXT.md goes stale; next agent starts with wrong assumptions |

---

## When NOT to Use the Full Pipeline

Short-circuit is allowed only when declared explicitly before starting:

1. **Typo or documentation fix only:** Skip tdd-tester and implementer; still run code-reviewer
2. **Configuration-only change:** Skip tdd-tester; still run security-auditor if config touches auth or vendor settings
3. **Hotfix under active incident:** May skip documentation-writer; retroactively run it within 24 hours; log the skip in `docs/agent-lessons.md`

**Default:** Always run the full pipeline. Declare any skip out loud before starting.

---

## Emergency Protocol

Under time pressure (incident, deadline, constrained session):

1. Declare the constraint: "We have 20 minutes, so I'll do one TDD cycle and run reviewers in parallel."
2. Run the minimum pipeline: planner (abbreviated) → tdd-tester (one scenario) → implementer → code-reviewer + security-auditor (parallel)
3. Log all skipped steps in FOLLOWUPS.md
4. Never skip: the failing test before implementing, the security-auditor on PHI code, the "fix the agent" step after a mistake

---

## Manual Checklist (no tooling)

Before calling each agent, confirm pre-conditions are met:

- [ ] planner: have intent or parsed spec ready; prepared 2-4 clarifying questions
- [ ] tdd-tester: PLAN.md exists; failure scenario ID specified
- [ ] implementer: failing test exists and confirmed failing for the right reason
- [ ] code-reviewer: implementer run is complete; diff is staged or committed
- [ ] security-auditor: same as code-reviewer
- [ ] pr-reviewer: code-reviewer verdict present; security-auditor verdict present; documentation-writer ran
- [ ] troubleshooter: failure signal (stack trace, test name, log line) is in hand
- [ ] documentation-writer: all PLAN.md scenarios are green; reviewer findings are resolved
