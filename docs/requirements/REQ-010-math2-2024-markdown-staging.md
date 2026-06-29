# REQ-010: Math2 2024 Markdown Staging

## Status

Drafted on branch `codex/math2-2024-markdown-staging`.

## Problem and User Value

The maintainer wants a usable Math2 2024 path quickly and does not want first
launch blocked by one-by-one manual question review. REQ-009 resolved the
source-role blocker: `solutions/2024/math2_2024.md` is sufficient as the Math2
2024 Markdown source, and
`solutions/2024/d9d94a1c-3357-4eb8-abf6-5101928d2ab2_origin.pdf` is not a
prerequisite.

This requirement turns that decision into a reproducible 2024 staging batch and
a bounded launch-readiness path. It must not silently publish unverifiable
answers or explanations.

## Current Main / PR State

- PR #9 is merged into `main`.
- Merge commit: `6c293eafa73de7aab8746f5bf2d061367cb4b525`.
- PR #9 title: `docs(math2): audit 2024 source role`.
- Merged at: `2026-06-28T07:37:34Z`.

## Source Baseline

- Source root: `D:\work\Kaoyan-Math2-Papers`
- Required source repo treatment: read-only.
- Expected source branch: `main`
- Expected source commit: `fd42c56eed412cce0cb97d6bd688f314c78e542e`
- Expected dirty state: five untracked restored MinerU Markdown files under
  `papers/`; none are 2024 files.
- Approved source:
  - `solutions/2024/math2_2024.md`
  - bytes: `6703`
  - SHA-256: `38d3a737c302a4ae79094fbaacb489d33fcb7b15de1330aa6b20888aaea8358b`
- Image references:
  - `solutions/2024/images/7884391bcaec6d4b3b606a079c578a4913ccb65a0f43986faeb8ca2af3e7e68e.jpg`
  - `solutions/2024/images/d98314f433fa3074d0317cf7d9672b1e6b185e8a8e5a3e2a22ab1853b1498ae1.jpg`
  - `solutions/2024/images/ccde6b36e7a52892b052d64b0476872615cb2aba24502e52d014c6603b5e2c11.jpg`

## In Scope

- Build deterministic 2024 staging from
  `solutions/2024/math2_2024.md`.
- Generate:
  - `content/staging/math2/2024/questions.json`
  - `content/staging/math2/2024/anomalies.json`
  - `content/staging/math2/2024/validation.json`
  - `content/staging/math2/2024/katex-validation.json`
  - `content/staging/math2/2024/summary.md`
  - `content/reports/math2-2024/human-review-checklist.md`
- Add focused 2024 parser tests.
- Add Make targets for focused 2024 regeneration and validation.
- Keep every record conservative unless a separate launch/promotion requirement
  approves publication.
- Provide a visible feedback-email path using the maintainer-provided public
  address `tiantangyangyang@gmail.com`; do not repurpose a verification sender.

## Out of Scope

- Re-auditing the PDF or requiring it as evidence.
- Editing, deleting, normalizing, or committing anything in
  `D:\work\Kaoyan-Math2-Papers`.
- Live database dry-run or import. The maintainer wants to defer database import
  until broader multi-year Math2 coverage is ready.
- Importing Math2 into frontend static assets.
- Dynamic explanations or Motion animations.
- API, database, authentication, deployment, or Math1 changes unless a minimal
  launch path makes them unavoidable and they are documented here first.
- Inventing answers, explanations, options, formulas, or mathematical repairs.

## Data, Authentication, Performance, and Compatibility Constraints

- The staging schema remains `math2-question-staging-v2`; this requirement does
  not relax the schema contract.
- `option.text` is forbidden. Multiple-choice options must use exactly
  `{"label","value"}`.
- Missing answers and explanations must be represented as `null` with status
  `missing`.
- Records remain `reviewStatus: needs_human_review` and
  `finalizationStatus: blocked` in this staging task.
- Feedback email is `tiantangyangyang@gmail.com` by maintainer decision and can
  still be overridden by `VITE_FEEDBACK_EMAIL`.
- Missing answers/explanations may be allowed in a later user-facing launch only
  if the UI keeps the under-review state and feedback path visible.

## Acceptance Criteria

- [x] Requirement and report files exist for REQ-010.
- [x] Source repo branch, commit, dirty state, file size, SHA-256 hash, and image
      references are recorded before source inspection.
- [x] Source repo branch, commit, and dirty state are recorded after generation.
- [x] The 2024 transformer reads only the approved Markdown source and referenced
      local image artifacts.
- [x] Generated 2024 staging contains exactly 22 records:
      - 10 multiple-choice questions,
      - 6 fill-in-the-blank questions,
      - 6 solution questions.
- [x] Multiple-choice records use exactly `{"label","value"}` options A-D.
- [x] No answers, explanations, options, formulas, or source content are
      invented.
- [x] All 2024 records remain blocked for human review and publication.
- [x] The generated summary and checklist make the feedback email configuration
      requirement visible.
- [x] Focused 2024 validation passes.
- [x] Full `mingw32-make NPM=npm.cmd verify` result is recorded.

## Verification Result

- `python scripts/transform_math2_2024.py D:/work/Kaoyan-Math2-Papers content/staging/math2/2024 --review-checklist content/reports/math2-2024/human-review-checklist.md`
  - Passed: generated 22 questions with `schemaValid=True`.
- `mingw32-make NPM=npm.cmd math2-2024-validate`
  - Passed: 117 KaTeX expressions, 0 errors; 12 Python tests passed.
- `mingw32-make NPM=npm.cmd verify`
  - Passed: Math2 2020, 2023, and 2024 validation; web/API typecheck; API
    tests; web smoke; web/API builds; Python compileall.

## Launch Decision Update

- Public feedback email: `tiantangyangyang@gmail.com`.
- The maintainer allows questions with missing answers/explanations to go online
  for first launch if users have a visible exact-issue feedback path.
- Database import remains out of scope for REQ-010 and should wait until broader
  Math2 year coverage is ready.
- The verification sender `verify@mail.gongren.xyz` was not reused.

## Verification Commands

```powershell
python scripts/transform_math2_2024.py D:/work/Kaoyan-Math2-Papers content/staging/math2/2024 --review-checklist content/reports/math2-2024/human-review-checklist.md
node scripts/validate_math2_katex.mjs content/staging/math2/2024/questions.json content/staging/math2/2024/katex-validation.json
python -m unittest tests.test_transform_math2_2024 -v
mingw32-make NPM=npm.cmd math2-2024-validate
mingw32-make NPM=npm.cmd verify
```

## References

- REQ-002: `docs/requirements/REQ-002-math2-markdown-import.md`
- REQ-003: `docs/requirements/REQ-003-math2-full-import-prep.md`
- REQ-008: `docs/requirements/REQ-008-math2-2023-comparison-primary-staging.md`
- REQ-009: `docs/requirements/REQ-009-math2-2024-source-role-image-audit.md`
- REQ-009 report:
  `content/reports/req-009-math2-2024-source-role-image-audit/source-role-image-audit.md`
