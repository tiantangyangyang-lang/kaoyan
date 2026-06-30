# REQ-011: Math2 2021-2022 Staging Readiness

## Status

Implemented on branch `codex/req-011-math2-2021-2022-staging-readiness`.

## Problem and User Value

Math2 2020, 2023, and 2024 now have blocked staging artifacts. The remaining
modern single-year Math2 sources, 2021 and 2022, still need a reproducible
source-role and boundary audit before any staging task can safely run.

This requirement turns the known 2021/2022 blockers into deterministic audit
artifacts and Makefile validation, so the maintainer can decide the next small
PR without mixing 1987-2019 aggregate splitting, database import, or frontend
publication into this task.

## Current Main / PR State

- PR #11 is merged into `main`.
- PR #11 title: `docs(math2): record 2024 feedback launch boundary`.
- PR #11 URL: `https://github.com/tiantangyangyang-lang/kaoyan/pull/11`.
- Merge commit: `e3a7450aceb808f9a74ce3891ab3d860331512fd`.
- Merged at: `2026-06-30T12:38:39Z`.
- This branch was created from updated `origin/main`.

## Source Baseline

- Source root: `D:\work\Kaoyan-Math2-Papers`
- Required source repo treatment: read-only.
- Source branch: `main`
- Source commit: `fd42c56eed412cce0cb97d6bd688f314c78e542e`
- Dirty state: five untracked restored MinerU Markdown files under `papers/`:
  - `papers/MinerU_markdown_math2_1987-2019_2065686324641095680.md`
  - `papers/MinerU_markdown_math2_2020_2065687152877731840.md`
  - `papers/MinerU_markdown_math2_2021_2065687851346780160.md`
  - `papers/MinerU_markdown_math2_2022_2065687890395758592.md`
  - `papers/MinerU_markdown_math2_2023_2065687933685170176.md`

## In Scope

- Audit only Math2 2021 and Math2 2022 source readiness.
- Read only these 2021 candidates:
  - `papers/MinerU_markdown_math2_2021_2065687851346780160.md`
  - `solutions/2021/math2_2021/math2_2021.md`
- Read only these 2022 candidates:
  - `papers/MinerU_markdown_math2_2022_2065687890395758592.md`
  - `solutions/2022/math2_2022/math2_2022.md`
- Generate deterministic audit artifacts under
  `content/reports/req-011-math2-2021-2022-staging-readiness/`.
- Add a recurring Make target for the 2021/2022 readiness audit.
- Record a concrete small-PR roadmap for the remaining Math2 years.
- Keep source-role decisions explicit:
  - 2021 is blocked if both candidates identify as Math3.
  - 2022 is blocked from staging if the paper transcript cannot recover Q1-Q22
    boundaries and complete options without using a comparison/repair decision.

## Out of Scope

- Creating `content/staging/math2/2021/` or `content/staging/math2/2022/`
  artifacts unless the audit proves a schema-valid conversion can be generated
  without source-role ambiguity or invented content.
- Editing, deleting, normalizing, or committing anything in
  `D:\work\Kaoyan-Math2-Papers`.
- Live database dry-run or import.
- Frontend static Math2 bank or user-facing publication.
- Schema relaxation.
- Inventing answers, explanations, options, formulas, subject identity, or OCR
  repairs.
- Splitting or staging the 1987-2019 aggregate source.

## Data, Authentication, Performance, and Compatibility Constraints

- The staging schema remains `math2-question-staging-v2`; this requirement does
  not relax it.
- `option.text` remains forbidden. Any future multiple-choice options must use
  exactly `{"label","value"}`.
- Missing answers and explanations must remain `null` with status `missing` in
  any future staging task unless approved source evidence is added.
- Every future staging record remains `reviewStatus: needs_human_review` and
  `finalizationStatus: blocked` until a separate promotion requirement.
- Public feedback email remains `tiantangyangyang@gmail.com`; this audit does
  not change frontend or deployment configuration.
- No authentication, API, or database behavior changes are expected.

## Acceptance Criteria

- [x] Requirement and report files exist for REQ-011.
- [x] Source repo branch, commit, dirty state, file sizes, line counts, and
      SHA-256 hashes are recorded before and after audit generation.
- [x] The audit reads only the allowed 2021/2022 source candidates.
- [x] The audit records subject identity evidence for each candidate.
- [x] The audit records question-boundary recoverability for each candidate.
- [x] The audit records answer/explanation marker counts without treating them
      as Math2 evidence when the subject identity is wrong.
- [x] The audit records image references and missing local image references.
- [x] The output clearly states whether 2021 and 2022 are staging-ready,
      blocked, or require a source-role decision.
- [x] Makefile exposes a recurring focused audit/validation target.
- [x] Focused tests for the audit pass.
- [x] Full `mingw32-make NPM=npm.cmd verify` result is recorded before PR
      handoff.

## Verification Result

- `mingw32-make NPM=npm.cmd math2-2021-2022-audit`
  - Passed.
  - Generated the REQ-011 audit reports and ran 6 focused tests.
- `mingw32-make NPM=npm.cmd verify`
  - Passed after `mingw32-make NPM=npm.cmd install` restored missing npm
    dependencies in this worktree.
  - Math2 inventory: 775 files, 11 Markdown sources.
  - Math2 2020: 23 questions; KaTeX 96 expressions, 0 errors; 14 Python tests
    passed.
  - Math2 2021/2022 audit: 2021 `blocked_wrong_subject`, 2022
    `blocked_source_role_decision_required`; 6 Python tests passed.
  - Math2 2023: 22 questions; KaTeX 118 expressions, 0 errors; 11 Python tests
    passed.
  - Math2 2024: 22 questions; KaTeX 117 expressions, 0 errors; 12 Python tests
    passed.
  - Web/API typecheck, API tests, web smoke test, web/API builds, and Python
    compileall passed.
  - Environment note: npm warned that the project expects Node `20.x`; current
    runtime was Node `v24.15.0`.

## Verification Commands

```powershell
mingw32-make NPM=npm.cmd math2-2021-2022-audit
set MATH2_SOURCE_DIR=D:/work/Kaoyan-Math2-Papers&& python -m unittest tests.test_audit_math2_2021_2022 -v
mingw32-make NPM=npm.cmd verify
```

## Delegation Boundary

Mechanical agents may perform read-only source listing, hashing, line counting,
keyword scans, and boundary scans. Primary Codex owns source-role decisions,
year-split strategy, staging boundaries, acceptance criteria, and PR handoff.

## Remaining Math2 Roadmap

- REQ-011: 2021/2022 readiness audit and blocker map.
- Follow-up 2021 PR: only if the maintainer supplies or approves a true Math2
  2021 source; otherwise keep 2021 blocked.
- Follow-up 2022 PR: choose a bounded source-role/repair strategy, then generate
  blocked staging if Q1-Q22 and options are recoverable without invention.
- Later 1987-2019 PRs: split aggregate source by year first; review 1987-1996
  historical subject-title mapping before staging.

## References

- REQ-002: `docs/requirements/REQ-002-math2-markdown-import.md`
- REQ-003: `docs/requirements/REQ-003-math2-full-import-prep.md`
- REQ-008: `docs/requirements/REQ-008-math2-2023-comparison-primary-staging.md`
- REQ-010: `docs/requirements/REQ-010-math2-2024-markdown-staging.md`
- Queue: `content/queues/math2-full-import-prep.json`
