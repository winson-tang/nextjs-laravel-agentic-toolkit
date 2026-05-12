# How to Use This Toolkit

Setup options for different environments, plus a full adoption guide for using this on an ongoing project.

## Setup options

### Option A: Claude Code in this repo

```bash
git clone <repo-url> sycle-agentic-toolkit
cd sycle-agentic-toolkit
claude          # opens Claude Code; agents and skills auto-load
```

Sub-agents are auto-discovered from `.claude/agents/` and skills from `.claude/skills/`. CLAUDE.md loads automatically.

Verify inside the session:

```
/agents list    # confirm all 9 agents are present
/skills list    # confirm all 6 skills are present
```

Invoke an agent by naming it in natural language:

> "Use the planner to turn this spec into PLAN.md."
> "Engage tdd-tester on failure scenario F-3."
> "Run code-reviewer and security-auditor in parallel on the current diff."
> "Use the troubleshooter on this failing test."

### Option B: Drop into an existing repo

Copy the `.claude/` directory and `CLAUDE.md` into the target repo root:

```bash
cp -r ~/sycle-agentic-toolkit/.claude <target-repo>/
cp ~/sycle-agentic-toolkit/CLAUDE.md <target-repo>/
cd <target-repo> && claude
```

Agents and skills load exactly as in Option A.

### Option C: Different AI tool (Cursor, Windsurf, Aider)

The agent files are plain markdown. Paste any agent's body (everything after the `---` frontmatter) into the system-prompt or custom instructions slot of any tool.

Skill files work the same way: open the relevant `SKILL.md` and apply the checklist manually or as a system instruction.

Aider shortcut:
```bash
aider --system-prompt "$(tail -n +6 .claude/agents/planner.md)"
```

### Option D: No AI tooling

The skills and agent prompts are written to be human-operable as checklists:

1. Open `.claude/agents/planner.md` and follow its PLAN.md format by hand.
2. Open `.claude/skills/tdd/SKILL.md` and follow the red-green-refactor loop manually.
3. Open `.claude/skills/hipaa-audit/SKILL.md` as your security checklist.
4. Read your own diff against `.claude/agents/code-reviewer.md`.

The discipline in the files is the value. The tooling is an accelerant.

---

## Adopting this toolkit in a project

1. **Copy the `.claude/` directory** into the project root.
2. **Adapt `CLAUDE.md`** to the project's conventions. The hard rules (HIPAA, no PHI in logs, tenant isolation, conventional commits) stay. Project-specific patterns get added.
3. **Create `CONTEXT.md`** at the project root with the module map and active conventions. The `context-steward` agent maintains this going forward.
4. **Create `PLAN.md`** for the first feature and run the pipeline end to end.
5. **Run `context-steward` weekly** to keep CONTEXT.md accurate.
6. **Maintain `docs/agent-lessons.md`** with every "fix the agent" entry.

---

## Customizing an agent

1. Edit the corresponding `.claude/agents/<name>.md` file.
2. Update the `description` frontmatter if the trigger conditions change.
3. Keep each agent focused: an agent that does five things is worse than five agents that each do one thing well.

## Adding a new agent

1. Create `.claude/agents/<name>.md` with frontmatter:

   ```yaml
   ---
   name: my-new-agent
   description: When to use this agent -- be specific so the orchestrator picks it correctly.
   tools: [Read, Write, Bash]  # restrict to what the agent actually needs
   model: sonnet               # opus for harder reasoning, haiku for cheap categorization
   ---
   ```

2. Body: operating principles, workflow, output format, anti-patterns.
3. Update `.claude/skills/agent-orchestration/SKILL.md` to include the new agent in the pipeline diagram.
4. Smoke-test by invoking it on a known input and reading the output.

## Adding a new skill

1. Create `.claude/skills/<name>/SKILL.md` with frontmatter:

   ```yaml
   ---
   name: my-new-skill
   description: When to apply this skill -- be specific.
   ---
   ```

2. Body: rules, examples, checklists. Write steps a human can follow without any tooling.
3. If the skill needs supporting files (templates, reference data), put them in `.claude/skills/<name>/`.

---

## Running the demo project

```bash
cd demo
npm install
npm test          # Jest unit + integration
npm run e2e       # Playwright (starts Next.js dev server)
npm run dev       # Next.js dev server at localhost:3000
```

See `demo/README.md` for what the demo demonstrates and which agents to engage to extend it.
