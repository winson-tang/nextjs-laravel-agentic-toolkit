# Orchestration Patterns

How the agents and skills in this toolkit compose. Read this once; reference it whenever you forget which agent to call next.

## The canonical feature pipeline

```
┌────────────────────┐
│  bdd-spec-parser   │  skill: turns Gherkin / user story into PLAN_INPUT.md
└─────────┬──────────┘
          ▼
┌────────────────────┐
│      planner       │  produces PLAN.md with failure scenarios
└─────────┬──────────┘
          ▼
┌────────────────────┐
│    tdd-tester      │  writes ONE failing test (tracer bullet)
└─────────┬──────────┘
          ▼
┌────────────────────┐
│    implementer     │  smallest diff to turn the test green
└─────────┬──────────┘
          │
          │ (loop per failure scenario)
          ▼
┌────────────────────┐ ┌──────────────────┐
│   code-reviewer    │ │ security-auditor │  ← run in parallel
└─────────┬──────────┘ └────────┬─────────┘
          └──────────┬──────────┘
                     ▼
┌────────────────────────────────┐
│     documentation-writer       │  ADR / README / CHANGELOG / CONTEXT.md
└─────────────┬──────────────────┘
              ▼
┌────────────────────┐
│   pr-reviewer      │  final go/no-go integration verdict
└────────────────────┘
```

## The troubleshooting pipeline

```
┌────────────────────┐
│   troubleshooter   │  reproduces, hypothesizes, falsifies, root-causes
└─────────┬──────────┘
          ▼
┌────────────────────┐
│    tdd-tester      │  writes regression test against the bug
└─────────┬──────────┘
          ▼
┌────────────────────┐
│    implementer     │  smallest fix
└─────────┬──────────┘
          ▼
┌────────────────────┐ ┌──────────────────┐
│   code-reviewer    │ │ security-auditor │
└─────────┬──────────┘ └────────┬─────────┘
          └──────────┬──────────┘
                     ▼
┌────────────────────────────────┐
│    [FIX THE AGENT]             │
│  update prompt/skill/RAG so    │
│  this class of bug is caught   │
│  earlier next time             │
└─────────────┬──────────────────┘
              ▼
┌────────────────────┐
│   pr-reviewer      │
└────────────────────┘
```

## When to fan out vs. sequence

**Sequence (one after another):**

- `bdd-spec-parser` → `planner`: planner needs the spec parsed first.
- `planner` → `tdd-tester`: tester needs failure scenarios.
- `tdd-tester` → `implementer`: implementer needs a failing test.
- `implementer` → `code-reviewer` and `security-auditor`: reviewers need a diff.
- All reviewers → `pr-reviewer`: integration needs upstream verdicts.

**Fan out (parallel):**

- `code-reviewer` + `security-auditor` after implementer.
- `documentation-writer` runs in parallel with the next `tdd-tester` / `implementer` cycle for the next task.
- `context-steward` runs on its own schedule and never blocks.

## The "fix the agent" pattern (most important)

When any agent produces a bad output that you have to correct, you have **two deliverables**, not one:

1. Fix the immediate problem in the code or doc.
2. Update the upstream agent or skill so the next attempt does not repeat the mistake.

Log every "fix the agent" event in `docs/agent-lessons.md` with the date, the bad output, and the system fix. Over time, this file becomes a high-signal record of how the team's automation has matured.

Failure to do step 2 means you are correcting forever. Step 2 is what compounds.

## Multi-agent parallel work on different features

If two features are in flight, you can run the full pipeline for both in parallel as long as:

- The features touch disjoint files (or the human in the loop is reconciling).
- The reviewers (`code-reviewer`, `security-auditor`) finish a diff before the next implementer commits on top of it.
- `pr-reviewer` is the serializing step: it merges one PR at a time.

Avoid running two `implementer` agents on the same files. The deconfliction cost wipes out the parallelism.

## When NOT to use the pipeline

- Trivial fixes that have no behavioral change (typo in a comment, README rephrase). Even then: still write a test if there's an executable doc.
- Spike / exploratory work. Engage the agents only when you commit to the spike's output.
- True emergencies. The pipeline is the discipline; emergencies are when you skip steps. After the emergency, run the pipeline retroactively (regression test, security audit, doc update) within 24 hours.

## Anti-patterns

- Running `implementer` without a `PLAN.md` and a failing test. Don't.
- Skipping `security-auditor` "because it's just a small change" on PHI-touching code. Don't.
- Letting the implementer "drive-by-fix" unrelated tech debt. Track in `FOLLOWUPS.md`.
- Approving your own PR through `pr-reviewer`. The agent is fine; the human reviewer must be different from the human author.
- Fixing the same bug class three times in three weeks without updating an agent. That is wasted compound interest.
