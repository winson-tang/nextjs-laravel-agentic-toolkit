# sycle-agentic-toolkit

A Claude Code sub-agent and skill toolkit for disciplined, HIPAA-aware agentic development on TypeScript/Node projects.

It encodes a multi-agent operating model: plan, test, implement, review, audit, document, integrate. Each feature follows the same pipeline regardless of who is driving. When an agent makes a mistake, the fix is two diffs: the code fix and the agent-system fix so the same class of mistake can't recur.

It ships with a minimal Next.js + Node demo project so the pipeline can be exercised against real code.

## What's in here

```
sycle-agentic-toolkit/
├── README.md                      ← you are here
├── CLAUDE.md                      ← rules-of-the-road, auto-loaded by Claude Code
├── .gitignore
├── package.json                   ← workspaces root
│
├── .claude/
│   ├── agents/                    ← sub-agents (markdown with frontmatter)
│   │   ├── planner.md             ← intent → phased plan with failure scenarios
│   │   ├── tdd-tester.md          ← red-green-refactor cycle driver
│   │   ├── implementer.md         ← smallest diff to turn the test green
│   │   ├── code-reviewer.md       ← craftsmanship review
│   │   ├── security-auditor.md    ← HIPAA / security audit
│   │   ├── documentation-writer.md← ADRs / README / CHANGELOG / CONTEXT
│   │   ├── pr-reviewer.md         ← final pre-merge integration verdict
│   │   ├── troubleshooter.md      ← reproduce → hypothesize → falsify → root cause
│   │   └── context-steward.md     ← keeps CONTEXT.md fresh, prunes stale info
│   │
│   └── skills/                    ← skills (markdown checklists, dual-use with tooling or by hand)
│       ├── tdd/SKILL.md           ← Matt Pocock's red-green-refactor skill
│       ├── bdd-spec-parser/SKILL.md
│       ├── failure-scenario-design/SKILL.md
│       ├── hipaa-audit/SKILL.md
│       ├── agent-orchestration/SKILL.md
│       └── conventional-commits/SKILL.md
│
├── docs/
│   ├── ORCHESTRATION_PATTERNS.md  ← how agents compose (sequence, parallel, "fix the agent")
│   └── HOW_TO_USE.md              ← setup options and adoption guide
│
└── demo/                          ← minimal Next.js + API + Playwright/Jest scaffold
    ├── README.md
    ├── package.json
    ├── tsconfig.json
    ├── jest.config.js
    ├── playwright.config.ts
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx
    │   ├── api/appointments/route.ts
    │   └── lib/
    │       ├── transcripts.ts     ← idempotent upload, vendor retry, tenant isolation
    │       ├── logger.ts          ← structured logger with PHI redaction
    │       └── redact.ts          ← PHI pattern redaction (SSN, DOB, MRN, email, phone)
    ├── specs/
    │   └── appointment-recording.feature
    └── tests/
        ├── unit/redact.test.ts
        ├── integration/transcripts.test.ts
        └── e2e/appointment-flow.spec.ts
```

## Quick start

```bash
git clone <repo-url> sycle-agentic-toolkit
cd sycle-agentic-toolkit

# Open in Claude Code -- auto-loads CLAUDE.md, .claude/agents, .claude/skills
claude

# Optional: run the demo project
cd demo && npm install && npm test
```

Inside a Claude Code session, verify everything loaded:

```
/agents list    # expect: planner, tdd-tester, implementer, code-reviewer,
                #         security-auditor, documentation-writer, pr-reviewer,
                #         troubleshooter, context-steward
/skills list    # expect: tdd, bdd-spec-parser, failure-scenario-design,
                #         hipaa-audit, agent-orchestration, conventional-commits
```

## The pipeline

> "Each feature is a pipeline: planner produces a phased plan with failure scenarios, tester writes one failing test at a time, implementer turns it green, code-reviewer and security-auditor run in parallel, documentation-writer captures decisions, and a final pr-reviewer integrates everything. When an agent makes a mistake, I update the agent system, not just the PR. That is how the team's throughput compounds rather than just runs fast."

See `docs/ORCHESTRATION_PATTERNS.md` for the full pipeline diagram and sequencing rules.

## Adopting this in a project

See `docs/HOW_TO_USE.md` for setup options (with Claude Code, without, or in a different IDE) and the full adoption guide.

A `private/` folder (gitignored) can hold personal reference material such as cheat sheets and session notes.

## Credits

The TDD skill is adapted from Matt Pocock's [`mattpocock/skills`](https://github.com/mattpocock/skills/tree/main/skills/engineering/tdd) repository, with attribution preserved in `.claude/skills/tdd/SKILL.md`.

## License

UNLICENSED.
