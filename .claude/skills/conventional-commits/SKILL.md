---
name: conventional-commits
description: Apply to every git commit message in this project. Enforces type(scope): description format, bans em-dashes, keeps first line under 72 characters.
---

## Format Rule

```
type(scope): description

[optional body after blank line]
```

- First line: max 72 characters
- Type and scope: lowercase
- Description: imperative mood, no capital first letter, no trailing period
- No em-dashes anywhere (use commas, colons, or en-dashes instead)

## Type Vocabulary

| Type | Use when |
|---|---|
| `feat` | New behavior visible to users or callers |
| `fix` | Bug fix -- corrects incorrect behavior |
| `test` | Adding or correcting tests only |
| `chore` | Tooling, deps, config, scaffolding -- no behavior change |
| `docs` | Documentation only |
| `refactor` | Restructure without behavior change |
| `perf` | Performance improvement |
| `ci` | CI/CD pipeline changes |
| `revert` | Reverts a prior commit |

## Scope Guidance

Match the scope to the module or directory being changed:

- `transcripts` -- TranscriptsService and related
- `redact` -- PHI redaction utilities
- `api` -- API route handlers
- `logger` -- structured logging
- `planner` -- planner agent prompt
- `tdd-tester` -- tdd-tester agent prompt
- Omit scope when the change spans multiple unrelated modules

## Examples

```
feat(transcripts): add idempotent upload with idempotency-key dedup

fix(redact): handle Error objects without losing message in redactValue

test(redact): assert SSN pattern is redacted inside nested JSON objects

chore: add playwright config for e2e test suite

docs(api): document tenant isolation requirement on GET endpoint

refactor(transcripts): extract retry logic into runTranscriptionWithRetry
```

## Multi-line Body

Use the body when the why is not obvious from the first line:

```
fix(transcripts): surface vendor timeout as unavailable status

Vendor SDK throws VendorTimeoutError which was not caught by the
existing catch(e: unknown) block. Added explicit typed catch so
the retry loop can distinguish timeouts from other failures.
```

## Hard Prohibitions

1. No em-dashes in any part of the message
2. No past tense ("added" not "add")
3. No "WIP" commits on main
4. No `--no-verify` to skip hooks

## Co-Author Line (Claude-authored commits)

Always append on a blank line after the body:

```
Co-Authored-By: Claude <noreply@anthropic.com>
```

## Manual Checklist (no tooling)

- [ ] First line is 72 chars or fewer
- [ ] Type is from the vocabulary table above
- [ ] Scope matches the directory or module
- [ ] Description is imperative mood, lowercase start, no period
- [ ] No em-dashes anywhere in the message
- [ ] Body added if why is not obvious
- [ ] Co-author line added if Claude wrote the code
