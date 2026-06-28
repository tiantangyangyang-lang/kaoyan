# REQ-008: Math2 2023 Comparison-Primary Staging

## Status

Drafted on branch `codex/math2-2023-comparison-primary-staging`.

## Problem and User Value

REQ-004 blocked Math2 2023 staging because one 2023 transcript is missing
multiple-choice options for Q2, Q4, Q6, Q7, Q9, and Q10. The maintainer decision is
now fixed: use the complete transcript as primary for Math2 2023 and retain the
defective transcript as comparison evidence.

This requirement turns that decision into a reproducible 2023 staging batch
without importing Math2 into the frontend, changing API/database behavior, or
editing the source repository.

## Source Baseline

- Source root: `D:\work\Kaoyan-Math2-Papers`
- Required source repo treatment: read-only.
- Expected source commit: `fd42c56eed412cce0cb97d6bd688f314c78e542e`
- Expected branch: `main`
- Expected dirty state: five untracked restored MinerU Markdown files under
  `papers/`.
- Primary source for this requirement, after live hash/content verification:
  - `papers/MinerU_markdown_math2_2023_2065687933685170176.md`
  - SHA-256: `eef3ea76c3491b8753230bfc1089493d2b67f1b1a815bc45de6666a70cdcb02f`
- Comparison source for this requirement:
  - `solutions/2023/math2_2023/math2_2023.md`
  - SHA-256: `c353e535aa9dcda945bc9d88c3c441f3f4d23060a3408209ac3e90efa202bed8`

Live REQ-008 verification found that the REQ-004 path labels are inverted
relative to the current file contents: the `papers/` file is complete, while the
`solutions/` file contains the known Q2/Q4/Q6/Q7/Q9/Q10 option defects. This task
uses the verified complete file as primary and records the label correction in
generated metadata.

## In Scope

- Record the source-role decision and the REQ-004 path-label correction: the
  verified complete transcript is primary for Math2 2023.
- Build deterministic 2023 staging from the approved primary transcript.
- Preserve answer and explanation fields as `null` with `missing` status.
- Preserve every record as `reviewStatus: needs_human_review` and
  `finalizationStatus: blocked`.
- Generate 2023 staging artifacts under `content/staging/math2/2023/`.
- Update the Math2 full-import prep queue for the 2023 batch status and source
  roles.
- Add focused tests for the 2023 transformer.
- Run the smallest meaningful validation, then `mingw32-make NPM=npm.cmd verify`
  if the current worktree dependencies allow it.

## Out of Scope

- Editing, committing, deleting, or normalizing files in
  `D:\work\Kaoyan-Math2-Papers`.
- Re-OCR work.
- Schema relaxation.
- Live database dry-run import.
- Frontend static Math2 bank.
- Dynamic explanations, Motion animations, API, database, auth, deployment, or
  Math1 changes.
- Automatic source-role decisions for other years.

## Acceptance Criteria

- [x] Requirement and report files exist for REQ-008.
- [x] Source repo commit, branch, dirty state, input paths, file sizes, and
      hashes are recorded in generated metadata.
- [x] The 2023 transformer reads only the approved primary and comparison
      source files.
- [x] Generated 2023 staging contains exactly 22 records:
      - 10 multiple-choice questions,
      - 6 fill-in-the-blank questions,
      - 6 solution questions.
- [x] Multiple-choice records use exactly `{"label","value"}` options A-D.
- [x] No answers, explanations, options, formulas, or source content are
      invented.
- [x] All 2023 records remain blocked for human review and publication.
- [x] Queue metadata records that the previous REQ-004 source-role blocker is
      resolved only for 2023 by maintainer option (b).
- [x] Focused 2023 tests pass.
- [x] Project verification result is recorded with the exact command and output
      summary.

## Verification Commands

```powershell
python scripts/transform_math2_2023.py D:/work/Kaoyan-Math2-Papers content/staging/math2/2023
node scripts/validate_math2_katex.mjs content/staging/math2/2023/questions.json content/staging/math2/2023/katex-validation.json
python -m unittest tests.test_transform_math2_2023 -v
mingw32-make NPM=npm.cmd verify
```

## Delegation Boundary

Claude Code may perform mechanical source listing, hash checks, parser parity
checks, or per-file audits. Primary Codex owns source-role interpretation,
queue-state decisions, acceptance criteria, validation gates, and PR handoff.

## References

- REQ-002: `docs/requirements/REQ-002-math2-markdown-import.md`
- REQ-003: `docs/requirements/REQ-003-math2-full-import-prep.md`
- REQ-004: `docs/requirements/REQ-004-math2-2023-staging.md`
- REQ-007: `docs/requirements/REQ-007-math2-source-recovery.md`
- 2023 audit: `content/reports/math2-2023/source-role-audit.md`
- Queue: `content/queues/math2-full-import-prep.json`
