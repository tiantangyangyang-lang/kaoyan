# REQ-015: Math2 1987-2019 Aggregate Split Staging

## Status

Implemented as a deterministic split/audit requirement on branch
`codex/req-015-math2-1987-2019-aggregate-split-staging`.

PR: https://github.com/tiantangyangyang-lang/kaoyan/pull/16

## Problem and User Value

Math2 1987-2019 is still locked inside aggregate Markdown sources. The site can
only safely move more Math2 data toward the backend after the aggregate sources
are split and audited by year. This requirement creates the smallest safe
pipeline for that work: deterministic source inventory, per-year boundary scans,
question and option recoverability checks, answer/explanation marker checks, and
an explicit list of years that may proceed to later staging or database import.

## In Scope

- Read only the Math2 1987-2019 aggregate paper and solutions Markdown sources.
- Record source repository branch, commit, dirty state, file sizes, line counts,
  and SHA-256 hashes before and after the task.
- Generate deterministic audit artifacts under
  `content/reports/req-015-math2-1987-2019-aggregate-split-staging/`.
- Scan year boundaries, question boundaries, multiple-choice options,
  answer/explanation markers, image references, and 1987-1996 historical title
  risks.
- Add a recurring Makefile validation target for the REQ-015 aggregate audit.
- Add focused tests for the aggregate split/audit scanner.
- Decide which years are eligible for a future per-year staging PR and which
  years are blocked.

## Out of Scope

- Editing `D:/work/Kaoyan-Math2-Papers`.
- Importing the combined 1987-2019 aggregate as one batch.
- Relaxing `math2-question-staging-v2`.
- Publishing Math2 content to the frontend.
- Live database import or commit.
- Inventing missing answers, explanations, options, formulas, or OCR repairs.
- Mixing 2021, 2022, or unrelated frontend/API work into this PR.

## Data, Authentication, Performance, and Compatibility Constraints

- Source files under `D:/work/Kaoyan-Math2-Papers` are read-only.
- Existing option shape remains exactly `{"label","value"}`; `option.text` is
  forbidden.
- Every future staging record must remain `reviewStatus: needs_human_review` and
  `finalizationStatus: blocked` unless a separate promotion requirement changes
  that rule.
- Missing answers or explanations must remain `null` with status `missing`
  unless source evidence is explicitly traceable.
- No live DB import may run unless `DATABASE_URL` is configured and the
  maintainer explicitly approves the command.
- Any DeepSeek-assisted scan may only perform mechanical extraction support; the
  key must not be printed, stored, committed, or sent into reports/logs.

## Acceptance Criteria

- [x] Requirement and report files exist for REQ-015.
- [x] Current `main` and PR #15 state are recorded.
- [x] REQ-003, REQ-011, REQ-013, and REQ-014 constraints are reflected in the
      REQ-015 notes.
- [x] Source repo branch, commit, dirty state, file sizes, line counts, and
      SHA-256 hashes are recorded before and after the task.
- [x] The audit confirms the aggregate paper and solutions paths from source
      inventory or live source listing.
- [x] The audit records per-year boundary candidates for 1987-2019.
- [x] The audit records per-year question-boundary recoverability.
- [x] The audit records per-year choice-option completeness for expected choice
      questions.
- [x] The audit records answer/explanation marker counts without using them as
      final answer evidence.
- [x] The audit records 1987-1996 historical title risk.
- [x] The output states which years are eligible for future staging and which
      are blocked, with reasons.
- [x] If staging is not safe in this PR, no staging files are generated.
- [x] Makefile exposes a recurring focused validation target.
- [x] Focused tests pass.
- [x] Full `mingw32-make NPM=npm.cmd verify` is run before PR handoff or a
      concrete blocker is reported.
- [x] Branch uses Conventional Commits, is pushed, and a dedicated PR references
      this requirement.

## Decision

- Status: `split_audit_only_no_staging_generated`.
- Staging generated: false.
- Database import run: false.
- 1987-1996: blocked pending historical title review because both aggregate
  sources title these years as `试卷三`.
- 1997-2019: future per-year staging candidates because both aggregate sources
  expose stable Math2 year headings, but every year remains staging-blocked in
  REQ-015 pending per-year extraction/review.
- Reason no staging was generated: the aggregate text interleaves question text
  with answers/explanations, includes cross-paper references, and some years
  include image or incomplete option evidence. The current PR does not relax the
  schema or perform per-year repair.

## Database Boundary

REQ-015 does not run live DB dry-run/import. Until a later requirement generates
schema-valid staging for 1987-2019, the existing DB preview import boundary
remains Math2 2020, 2023, and 2024 only.

## Verification Result

- `mingw32-make NPM=npm.cmd math2-1987-2019-audit`
  - Passed.
  - Generated `aggregate-audit.json`, `aggregate-audit.md`,
    `source-inventory.json`, `year-boundary-scan.md`, and
    `blocker-report.md`.
  - Ran 7 focused tests.
- `mingw32-make NPM=npm.cmd verify`
  - Passed after `mingw32-make NPM=npm.cmd install` restored missing npm
    dependencies in this worktree.
  - Includes Math2 inventory, 2020 validation, 2021/2022 audit, REQ-015
    1987-2019 aggregate audit, 2023 validation, 2024 validation, web/API
    typecheck, API tests, web smoke test, web/API builds, and Python compileall.
  - API tests passed: 10.
  - Web smoke test passed and synced existing frontend content: 852 Math1
    questions and 67 Math2 questions.
  - Environment note: npm warned that the project expects Node `20.x`; current
    runtime was Node `v24.15.0`.

## Verification Commands

```powershell
mingw32-make NPM=npm.cmd math2-1987-2019-audit
set MATH2_SOURCE_DIR=D:/work/Kaoyan-Math2-Papers&& python -m unittest tests.test_audit_math2_1987_2019 -v
mingw32-make NPM=npm.cmd verify
```
