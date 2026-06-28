# REQ-009: Math2 2024 Source-Role and Image-Evidence Audit

## Status

Drafted on branch `codex/math2-2024-source-role-image-audit`.

## Problem and User Value

REQ-003 queued Math2 2024 as `math2-2024-role-ambiguous-paper-like` because the
only known Markdown transcript is under `solutions/2024/` and three local image
references required review.

This requirement resolves the audit question before any staging work: identify
the current 2024 source evidence, classify the source role, determine whether
the image references are meaningful mathematical evidence, and record whether
the Markdown source is sufficient for a future staging task.

## Source Baseline

- Source root: `D:\work\Kaoyan-Math2-Papers`
- Required source repo treatment: read-only.
- Expected source branch: `main`
- Expected source commit: `fd42c56eed412cce0cb97d6bd688f314c78e542e`
- Expected dirty state: five untracked restored MinerU Markdown files under
  `papers/`; none are 2024 files.
- Repository base for this task: merge commit
  `1f110c05d20fd0f8a70f71b29363b291a8a82a9e` from PR #8 / REQ-008.

## In Scope

- Record REQ-009 requirement and durable report files.
- Inspect the current Math2 queue, REQ-003, REQ-008, and existing Math2 2024
  queue evidence.
- Confirm live source repo branch, commit, dirty state, 2024 candidate Markdown
  path, file size, SHA-256 hash, and image references.
- Decide whether the current 2024 evidence is:
  - stageable as a mechanical Markdown batch,
  - blocked by missing primary paper transcript,
  - blocked by image evidence,
  - or ready for a follow-up Markdown staging requirement.
- Update queue metadata to preserve the decision and follow-up boundary.

## Out of Scope

- Generating `content/staging/math2/2024/*`.
- Creating `scripts/transform_math2_2024.py` or 2024 tests.
- Running a live database dry-run.
- Publishing, approving, or finalizing Math2 2024 content.
- Importing Math2 into the frontend or copying Math2 data into static web
  assets.
- Adding dynamic explanations or Motion animations.
- Editing API, database, authentication, deployment, or Math1 files.
- Editing, normalizing, deleting, or committing files in
  `D:\work\Kaoyan-Math2-Papers`.

## Data, Authentication, Performance, and Compatibility Constraints

- The Math2 staging schema remains
  `content/schema/math2-question-staging-v2.schema.json`; this requirement does
  not relax it.
- Missing answers, explanations, options, or formulas must not be invented.
- Any future staging records must remain `reviewStatus: needs_human_review` and
  `finalizationStatus: blocked`.
- The maintainer clarified that `solutions/2024/math2_2024.md` is sufficient as
  the 2024 Markdown source; the PDF is not required for this audit or the next
  mechanical staging task.
- No `DATABASE_URL` is required or used in this audit.
- Existing API, auth, MySQL schema, frontend delivery, and deployment behavior
  must remain unchanged.

## Acceptance Criteria

- [x] Requirement and report directory exist for REQ-009.
- [x] Source repo branch, commit, dirty state, allowed 2024 Markdown path, file
      size, SHA-256 hash, and image references are recorded.
- [x] The audit checks whether any 2024 paper transcript exists outside queued
      paths.
- [x] The audit records the image-evidence decision for the three queued JPGs.
- [x] The audit records that the 2024 Markdown is sufficient for a follow-up
      staging task.
- [x] Queue metadata is updated with the REQ-009 decision.
- [x] No 2024 staging files are generated.
- [x] No frontend, API, database, auth, deployment, final, approved, or source
      repository files are edited.
- [x] Smallest meaningful verification is run and reported.

## Verification Commands

```powershell
python -m json.tool content/queues/math2-full-import-prep.json
git diff --check
git status --short --branch
```

Full `mingw32-make NPM=npm.cmd verify` is not required for this audit-only
documentation and queue-metadata task unless code or staging outputs are added.

## Delegation Boundary

Mechanical agents may list files, compute hashes, scan image references, or
render source pages. Primary Codex owns source-role interpretation, risk
classification, acceptance criteria, validation gates, queue-state decisions,
and PR handoff.

## References

- REQ-003: `docs/requirements/REQ-003-math2-full-import-prep.md`
- REQ-008: `docs/requirements/REQ-008-math2-2023-comparison-primary-staging.md`
- Queue: `content/queues/math2-full-import-prep.json`
- Queue report: `content/reports/req-003-math2-full-import-prep/import-queue.md`
- REQ-009 report: `content/reports/req-009-math2-2024-source-role-image-audit/`
