# Notes: REQ-005 Agent Workflow Reference from ECC

## Review Method

- Read-only access via `gh api repos/affaan-m/ECC/contents/<path>` with the raw
  accept header. No clone, no install, no dependency added.
- ECC default branch: `main`; description: "The agent harness performance
  optimization system."
- Files reviewed: `AGENTS.md`, `WORKING-CONTEXT.md`, `.kiro/steering/development-workflow.md`,
  `.kiro/steering/git-workflow.md`, `.kiro/steering/security.md`.

## ECC Ideas Considered

### Task isolation
ECC `.kiro/steering/development-workflow.md` names a Plan-First → TDD → Code-Review
→ Commit pipeline. Our `AGENTS.md` Task Boundary and `engineering-workflow.md`
"One Task, One Context" already enforce one-requirement-per-context-per-branch-per-PR.
Decision: already covered; no change.

### AGENTS.md rules
ECC `AGENTS.md` lists Core Principles (Agent-First, Test-Driven 80%+, Security-First,
Immutability, Plan-Before-Execute) and a large agent/skill catalog. Our `AGENTS.md`
is domain-specific (Task Boundary, Required Artifacts, Git Workflow, Command
Interface, Database, Verification Report). Decision: already covered in project
terms; no change.

### Source-role policy
ECC has no explicit "source-role" concept (that is our kaoyan domain concept). ECC
does have an ingestion policy — "copy ideas from audited source later rather than
merging branded/source-import PRs directly" — and "source of truth" / "source-first
voice capture" language. This analogues our read-only-source + no-wholesale-import
discipline. Decision: already covered by the REQ-003 batch contract; no change.

### No fabricated data
ECC: "guidance-first rather than fake runtime automation" (agent-introspection-debugging);
"remove generic LLM rhetoric"; "validate all user inputs." Our domain rule is
stronger: do not invent answers, explanations, options, or formulas; missing data
is `null` with status `missing`. Decision: already covered; no change.

### PR-based workflow
ECC `.kiro/steering/git-workflow.md`: PR summary should analyze full commit history
(`git diff base...HEAD`) and include a test plan with TODOs. `WORKING-CONTEXT.md`
states "No merge by title or commit summary alone." Our Git Workflow previously
said only "Do not merge without review." Decision: adopt — sharpen the merge rule
and add the full-diff PR-description practice.

### Security guardrails (GAP)
ECC `.kiro/steering/security.md` provides:
- Mandatory pre-commit checklist: no hardcoded secrets; all inputs validated;
  SQL injection prevention (parameterized); XSS prevention; CSRF protection;
  auth/authz verified; rate limiting; error messages don't leak sensitive data.
- Secret management: NEVER hardcode; use env/secret manager; validate at startup;
  rotate exposed.
- Security response protocol: STOP → security-reviewer → fix CRITICAL → rotate →
  review codebase.

Our `AGENTS.md` previously had only parameterized SQL + JSON payload validation.
Decision: adopt — add a `Security Guardrails` section to `AGENTS.md`,
kaoyan-tailored (MySQL, session cookies, published content APIs, `DATABASE_URL`).
ECC content is adapted, not copied verbatim.

### Token/context discipline
ECC `WORKING-CONTEXT.md`: "Keep this file detailed for only the current sprint,
blockers, and next actions. Summarize completed work into archive or repo docs
once it is no longer actively shaping execution." Our per-REQ `task_plan.md` /
`notes.md` pattern already keeps each task's context bounded and archived in its
report dir. Decision: already covered; no change.

## Domain Rules Confirmed (kaoyan-specific, now in AGENTS.md)

- Math2 1987–2019: multi-year aggregate source with questions AND answers/explanations;
  must split by year; 1987–1996 needs `试卷三` subject-title review.
- Math2 2020–2024: year-by-year question-only sources; 2020 is the frozen pilot.
- No invented answers, explanations, options, or formulas.
- No schema relaxation without explicit maintainer approval.
- No live DB dry-run without `DATABASE_URL` and explicit approval.
- `D:\work\Kaoyan-Math2-Papers` strictly read-only; record commit + dirty state.

## Verification

`mingw32-make NPM=npm.cmd verify` run on the branch (docs-only change). Result: exit 0 (2020 schemaValid, 96 KaTeX/0 errors, 10 API tests, web smoke, web/API builds, compileall).

## Delivery

- Branch: `codex/agent-workflow-ecc-ref` (based on `origin/main` `d20a724`).
- Commit: `9233c52` — `docs(workflow): adopt ECC security guardrails + Math2 data discipline` (4 files, +212/-1).
- PR: https://github.com/tiantangyangyang-lang/kaoyan/pull/5 (base `main`, head `codex/agent-workflow-ecc-ref`).
- Source repo `D:\work\Kaoyan-Math2-Papers` untouched; unchanged at `fd42c56`.
- ECC: reviewed read-only via `gh api`; not installed, not vendored.
