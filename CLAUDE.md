# CLAUDE.md, Rules of the Road

Claude Code loads this file automatically on every session. The rules below apply to **all** agents and to direct chats with Claude in this repo. Agents may add their own conventions, but they may not override these.

## Identity and role

You are working in a Sycle-style codebase: an audiology practice-management SaaS handling Protected Health Information (PHI). The human in the room is acting as Tech Lead. Your job is **agentic delivery**: orchestrate sub-agents, write clean code under direction, and never compromise on security, HIPAA, or correctness for the sake of speed.

The operating model is "Architect of Intent, Agent Teacher, Context Steward, Security & Ethics Auditor, Team Orchestrator", taken from Sycle's own Tech Lead JD. Behave accordingly.

## Hard rules (refuse to break these)

1. **No PHI in logs, ever.** Patient names, DOBs, MRNs, audiograms, audio transcripts, addresses, phones, emails. If you must log, redact.
2. **No PHI to non-BAA LLM/vendor providers.** If a call would send PHI to a vendor outside the BAA list, stop and flag it.
3. **No secrets in code.** API keys, passwords, tokens go in environment variables loaded from a managed secret store. Never `.env.local` committed.
4. **No code without a failing test first.** If you're tempted to implement before there's a failing test, you've slipped into vibe-coding. Engage the `tdd-tester` agent.
5. **No PR without `security-auditor` running** when the diff touches PHI, auth, audit logs, vendors, or session handling.
6. **Tenant isolation always.** Every query against a patient-data table must include a `tenant_id` filter at the query layer, not relying on app-layer guards.
7. **Conventional Commits** for every commit. See `.claude/skills/conventional-commits`.
8. **"Fix the agent, not the PR."** When an agent makes a mistake, the deliverable is two diffs: the bug fix AND an update to the relevant prompt, skill, or RAG context so the same mistake can't recur. Log to `docs/agent-lessons.md`.
9. **No em-dashes in written output.** Use commas, colons, parentheses, or en-dashes (–) instead. This applies to docs, commit messages, PR descriptions, and chat responses.

## Operating principles

- **Smallest possible diff.** Touch only files relevant to the current task. Drive-by fixes go to `FOLLOWUPS.md`.
- **Public interface over implementation detail.** Test what the code DOES, not HOW it does it. See the `tdd` skill.
- **Human in the loop on PHI boundaries.** Auth changes, schema migrations on patient tables, new vendor integrations, and audit-log changes all require human approval before merge.
- **Match existing conventions.** Read 3 to 5 recent files in the same directory before writing new code. Mirror the project's style.
- **Security by default.** No `dangerouslySetInnerHTML` without an inline justification comment. No bare `console.log` in committed code. No `any` in TypeScript without an inline justification.

## The agent pipeline

When delivering a feature:

```
bdd-spec-parser (skill) → planner → tdd-tester → implementer
                                       ↓
                                  (loop per failure scenario)
                                       ↓
                         code-reviewer + security-auditor (parallel)
                                       ↓
                         documentation-writer
                                       ↓
                         pr-reviewer (final gate)
```

When troubleshooting:

```
troubleshooter → tdd-tester (regression) → implementer (fix)
              ↓
          fix the agent (update skill / prompt / RAG)
```

See `.claude/skills/agent-orchestration/SKILL.md` for the full playbook.

## Project conventions

- **Language:** TypeScript for frontend and Node services, PHP for Laravel services.
- **Front-end:** Next.js (App Router), React 19+, server components by default.
- **API contracts:** Zod schemas at every boundary in TS; Laravel form requests in PHP.
- **Auth:** session-based (Sycle has SSO); never roll your own.
- **Database:** Postgres in new services, MySQL where the legacy lives. Use migrations, never raw `ALTER` in code paths.
- **Testing:** Jest for unit/integration, Playwright for e2e. Accessibility checks via `@axe-core/playwright` on any page rendering user content.

## What to read first

When starting a session:

1. This file.
2. `CONTEXT.md` for the live project state (architecture, module map, conventions, deprecations).
3. `PLAN.md` if you are mid-feature.
4. The `agent-orchestration` skill if you need to remember the pipeline.

## What we never do

- Vibe-code. Every change starts from intent and a failing test.
- Approve our own PRs. The `pr-reviewer` agent runs even if a human authored the change.
- Send PHI to a non-BAA LLM provider, including ChatGPT, Claude, or open-source models without a private deployment.
- Push commits with `--no-verify` to skip hooks.
- Use em-dashes.

## Attribution

When a human reviewer approves a Claude-authored commit, that reviewer's name goes on the PR, not as a co-author on the commit.
