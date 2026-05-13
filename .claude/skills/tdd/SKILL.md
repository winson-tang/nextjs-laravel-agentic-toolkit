---
name: tdd
description: Apply to every implementation task. Drives red-green-refactor discipline. Do not write implementation code without a failing test first.
---

## The Three Phases

### Phase 1: Red (write a failing test)

1. Identify ONE failure scenario from the PLAN.md failure scenarios table
2. Write a single test that expresses the scenario in terms of the public interface
3. Name the test for the behavior: `it("returns null when tenant IDs do not match")`
   - Start with a verb describing what the system does
   - Never start with "should" or "tests"
   - Never name it after the function under test
4. Assert the exact expected outcome -- not just "it doesn't throw"
5. Run the test and confirm it FAILS for the right reason:
   - Correct: assertion fails because the behavior doesn't exist yet
   - Wrong: compile error, missing import, wrong test runner config -- fix these first
6. Only proceed to Green when the failure message names the exact behavior you're implementing

### Phase 2: Green (minimum code to pass)

1. Read the failing test to understand the contract it defines
2. Write the smallest implementation that makes that one test pass
3. Rules for "smallest":
   - No logic the test does not demand
   - No early optimization
   - No "while I'm here" additions
   - No anticipating the next scenario
4. Run the full test suite: the target test is now green, no previously passing tests are now red
5. If you broke another test: stop, treat that as a new failing test, understand why before continuing

### Phase 3: Refactor (clean without behavioral change)

1. Only refactor after the test is green
2. Make one structural change at a time
3. Run the full test suite after each change
4. If a test breaks during refactor: that is a bug in the refactor, not the test -- revert and try again
5. Never add new behavior during refactor
6. Never add a new test during refactor (save it for the next Red phase)

---

## Test Naming Convention

```typescript
it("returns 404 when transcript ID belongs to a different tenant")
it("redacts SSN pattern in nested JSON objects")
it("retries vendor call up to maxAttempts before marking unavailable")
it("returns existing transcript when idempotency key already exists")
```

One behavior per test name. If the name needs "and", split it into two tests.

## What Counts as One Test

One scenario from the failure scenarios table. One cluster of assertions that verify the same behavior from the same starting state.

## Canonical Examples in This Codebase

- **Unit style:** `demo/tests/unit/redact.test.ts` -- each `it` covers one pattern, no mocking of the module under test
- **Integration style:** `demo/tests/integration/transcripts.test.ts` -- real TranscriptsService, mocked vendor boundary only

## Anti-Patterns to Avoid

| Anti-pattern | Why it's wrong |
|---|---|
| Write 3 tests then implement all at once | Loses the signal from each individual red phase |
| Mock the module under test | Tests the mock, not the behavior |
| Test private methods or internal state | Locks the implementation shape, not the contract |
| Refactor during Green phase | Entangles behavior change with cleanup, harder to bisect failures |
| Name tests after function names | When you rename the function, test names mislead |
| Write implementation "in anticipation" of next test | Untested code; defeats the discipline |

## Manual Checklist (no tooling)

- [ ] Identified exactly one failure scenario to implement next
- [ ] Test name describes behavior, not implementation
- [ ] Test fails for the right reason (assertion, not compile error)
- [ ] Wrote minimum implementation to pass that one test
- [ ] Full suite is green after implementation
- [ ] Refactored cleanly with suite green at every step
- [ ] No new behavior added during refactor
