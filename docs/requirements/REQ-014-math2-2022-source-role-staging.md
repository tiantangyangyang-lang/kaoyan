# REQ-014: Math2 2022 Source-Role Staging

## Status

Implemented as a blocker-report requirement on branch
`codex/req-014-math2-2022-source-role-staging`.

## Problem and User Value

REQ-011 confirmed that Math2 2022 has two Math2 source candidates, but neither
candidate is mechanically stageable without a focused source-role and repair
decision. The project needs a small, isolated PR that decides whether 2022 can
be safely converted into blocked staging without inventing missing content.

This requirement keeps 2022 separate from 2021, 1987-2019 aggregate splitting,
database imports, and frontend publication.

## Current Main / PR State

- Branch base: `origin/main` at `ea8dfb6`.
- PR #12 is present in the branch history:
  `Merge pull request #12 from tiantangyangyang-lang/codex/req-011-math2-2021-2022-staging-readiness`.
- PR #14 is present in the branch history:
  `Merge pull request #14 from tiantangyangyang-lang/codex/req-013-math2-db-import-readiness`.

## Source Baseline

- Source root: `D:\work\Kaoyan-Math2-Papers`
- Required source repo treatment: read-only.
- Source branch before work: `main`
- Source commit before work: `fd42c56eed412cce0cb97d6bd688f314c78e542e`
- Dirty state before work:
  - `?? papers/MinerU_markdown_math2_1987-2019_2065686324641095680.md`
  - `?? papers/MinerU_markdown_math2_2020_2065687152877731840.md`
  - `?? papers/MinerU_markdown_math2_2021_2065687851346780160.md`
  - `?? papers/MinerU_markdown_math2_2022_2065687890395758592.md`
  - `?? papers/MinerU_markdown_math2_2023_2065687933685170176.md`
- Source branch after work: `main`
- Source commit after work: `fd42c56eed412cce0cb97d6bd688f314c78e542e`
- Dirty state after work: unchanged from before work.

## In Scope

- Read only these Math2 2022 candidates:
  - `papers/MinerU_markdown_math2_2022_2065687890395758592.md`
  - `solutions/2022/math2_2022/math2_2022.md`
- Record deterministic source inventory, hashes, line counts, boundary scans,
  option scans, answer/explanation marker scans, and image-reference scans.
- Decide whether a no-invention, blocked 2022 staging batch can be generated.
- If safe, generate:
  - `content/staging/math2/2022/questions.json`
  - `content/staging/math2/2022/anomalies.json`
  - `content/staging/math2/2022/validation.json`
  - `content/staging/math2/2022/summary.md`
  - `content/staging/math2/2022/katex-validation.json`
  - `content/reports/math2-2022/human-review-checklist.md`
- Add recurring Makefile targets for Math2 2022 staging, KaTeX validation, and
  focused validation.
- Add focused tests for the 2022 transform or blocker report.

## Out of Scope

- Math2 2021 staging or repair.
- 1987-2019 aggregate splitting or historical subject-title review.
- Live database dry-run or import.
- Frontend publication.
- Schema relaxation.
- Inventing answers, explanations, options, formulas, or OCR repairs.
- Editing anything under `D:\work\Kaoyan-Math2-Papers`.

## Known REQ-011 Blockers

- Paper candidate is Math2 but is missing Q2 and Q7 boundaries.
- Paper candidate has incomplete choice options for Q2, Q4, Q5, Q7, and Q10.
- Solutions candidate is Math2 but is missing the Q10 boundary.
- Solutions candidate has incomplete choice options for Q5, Q7, and Q10.
- Solutions candidate includes explicit answer/explanation markers; using that
  evidence requires an explicit source-role decision.

## Data, Authentication, Performance, and Compatibility Constraints

- Staging schema remains `math2-question-staging-v2`.
- `option.text` is forbidden; options must use exactly `{"label","value"}`.
- Missing answers and explanations must be `null` with status `missing` unless
  source evidence is explicitly approved in this requirement.
- Every generated staging record must remain
  `reviewStatus: needs_human_review` and `finalizationStatus: blocked`.
- No authentication, API, database, or frontend behavior changes are expected.
- No live DB command may run without configured `DATABASE_URL` and explicit
  maintainer approval.

## Acceptance Criteria

- [x] Requirement and report files exist for REQ-014.
- [x] Source repo branch, commit, dirty state, file sizes, line counts, and
      SHA-256 hashes are recorded before and after the task.
- [x] Mechanical scans cover boundaries, options, answer/explanation markers,
      and image references for both approved 2022 candidates.
- [x] The source-role decision is explicit and cites the REQ-011 blockers.
- [x] If staging is generated, it contains exactly 22 questions with counts
      10 multiple-choice, 6 fill-in, and 6 solution questions.
- [x] If staging is generated, every answer/explanation absent from approved
      evidence remains `null` with status `missing`.
- [x] If staging is generated, every question remains
      `needs_human_review` and `blocked`.
- [x] If staging is generated, option objects use only `label` and `value`.
- [x] If staging is not safe, the blocker report states the minimum unblock
      request and no fake staging is committed.
- [x] Focused validation target passes.
- [x] Full `mingw32-make NPM=npm.cmd verify` result is recorded before PR
      handoff.

Notes on conditional criteria: no staging was generated because Q5, Q7, and Q10
cannot be represented as schema-valid multiple-choice records without inventing
missing option values.

## Decision

- Status: `blocked_no_invention_staging_not_safe`.
- Staging generated: false.
- Database import run: false.
- Reason: no source-role combination supplies complete A-D option values for
  Q5, Q7, and Q10.
- Report: `content/reports/req-014-math2-2022-source-role-staging/blocker-report.md`.

## Database Boundary

`DATABASE_URL` was not configured in this worktree at validation time. Even with
a configured database, REQ-014 must not import Math2 2022 because no
schema-valid `content/staging/math2/2022/questions.json` exists.

## Verification Result

- `mingw32-make NPM=npm.cmd math2-2022-validate`
  - Passed.
  - Generated the REQ-014 source scan and blocker report.
  - Ran 4 focused Python tests.
- `mingw32-make NPM=npm.cmd verify`
  - Passed after `mingw32-make NPM=npm.cmd install` restored missing npm
    dependencies in this worktree.
  - Math2 inventory: 775 files, 11 Markdown sources.
  - Math2 2020: 23 questions; KaTeX 96 expressions, 0 errors; 14 Python tests
    passed.
  - Math2 2021/2022 readiness audit: 2021 `blocked_wrong_subject`, 2022
    `blocked_source_role_decision_required`; 6 Python tests passed.
  - Math2 2022 source-role staging: `blocked_no_invention_staging_not_safe`;
    hard blockers Q5, Q7, Q10; 4 Python tests passed.
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
mingw32-make NPM=npm.cmd math2-2022-validate
set MATH2_SOURCE_DIR=D:/work/Kaoyan-Math2-Papers&& python -m unittest tests.test_transform_math2_2022 -v
mingw32-make NPM=npm.cmd verify
```

## Delegation Boundary

Mechanical agents may perform read-only source listing, hashing, line counting,
keyword scans, boundary scans, and option scans. Primary Codex owns the
source-role decision, staging boundary, database-import boundary, acceptance
criteria, and PR handoff.
