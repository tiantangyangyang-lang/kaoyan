# REQ-005: Agent Workflow Reference from ECC

## Status

Drafted on branch `codex/agent-workflow-ecc-ref`. ECC was reviewed read-only as a
workflow reference; it is NOT installed into this repository and is NOT a
dependency. This requirement records the useful ideas extracted and the doc
updates adopted.

## Problem and User Value

Audit an external agent-harness repo (`affaan-m/ECC`) for reusable workflow
ideas, then fill gaps in our own `AGENTS.md` / engineering-workflow docs. The
kaoyan project keeps its own domain-specific rules; ECC is reference-only.

## Reference Source

- Repo: `affaan-m/ECC` on GitHub (default branch `main`).
- Accessed: read-only via `gh api` (raw file contents). No clone, no install.
- Files reviewed: `AGENTS.md`, `WORKING-CONTEXT.md`, `.kiro/steering/development-workflow.md`,
  `.kiro/steering/git-workflow.md`, `.kiro/steering/security.md`, plus the file tree.
- Relationship to this repo: reference only. Do not vendor, import, or depend on ECC.

## Extracted Ideas (by dimension)

| Dimension | ECC idea | Adoption |
|---|---|---|
| Task isolation | Plan→TDD→Review→Commit pipeline | Already covered by `AGENTS.md` Task Boundary + `engineering-workflow.md` "One Task, One Context". |
| AGENTS.md rules | Core Principles (Agent-First, TDD, Security-First, Immutability, Plan-Before-Execute) | Our domain-specific `AGENTS.md` already covers these in project terms. |
| Source-role | "source of truth"; ingest audited ideas, not wholesale external merges | Already covered by the REQ-003 batch contract + read-only source policy. |
| No fabricated data | "no fake runtime automation"; validate all inputs | Already covered; our domain rule (no invented answers/options/formulas) is stronger. |
| PR-based workflow | PR summary built from full `git diff base...HEAD`; "no merge by title or commit summary alone" | **Adopted**: sharpen merge rule in `AGENTS.md`; add full-diff PR note in `engineering-workflow.md`. |
| Security guardrails | pre-commit checklist + secret management + security response protocol | **Adopted (gap fill)**: new `Security Guardrails` section in `AGENTS.md`. |
| Token/context discipline | working-context file sprint-scoped; archive completed work | Already covered by per-REQ `task_plan.md` / `notes.md`. |

Full findings in `content/reports/req-005-agent-workflow-ecc-reference/notes.md`.

## Doc Changes

- `AGENTS.md`:
  - New `Math2 Source & Data Discipline` section (year-split source model, no
    invented data, no schema relaxation without maintainer, no live DB dry-run
    without `DATABASE_URL` + approval, option shape, staging status, read-only source).
  - New `Security Guardrails` section (pre-commit checklist, secret management,
    security response protocol) — adapted from ECC, kaoyan-tailored.
  - Sharpen the merge rule: "No merge by PR title or commit summary alone; review
    the full `git diff base...HEAD`."
- `docs/engineering-workflow.md`:
  - Add a full-diff PR-description note: build the PR body from the full diff, not
    just the latest commit; include a test plan with TODOs.

## Out of Scope

- Installing, vendoring, or depending on ECC.
- Copying ECC content verbatim. Ideas are adapted to kaoyan domain rules.
- Changing the task/PR lifecycle (already covered).
- Touching `D:\work\Kaoyan-Math2-Papers` or any Math2 staging content.

## Acceptance Criteria

- [x] ECC reviewed read-only; not installed or imported.
- [x] Useful ideas extracted across the 7 dimensions with explicit adopt/skip decisions.
- [x] `AGENTS.md` gains a `Security Guardrails` section (the identified gap).
- [x] `AGENTS.md` gains a `Math2 Source & Data Discipline` section capturing the
      project domain rules.
- [x] Merge rule and PR-description practice sharpened.
- [x] No ECC content vendored; no source-repo or Math2 staging change.
- [x] `make verify` passes (docs-only change).

## Verification

Documentation-only change. `mingw32-make NPM=npm.cmd verify` run to confirm no
regression.

## References

- ECC repo: https://github.com/affaan-m/ECC (reference only)
- Our `AGENTS.md`, `docs/engineering-workflow.md`
- Related: REQ-003 (batch contract), REQ-004 (2023 audit)
