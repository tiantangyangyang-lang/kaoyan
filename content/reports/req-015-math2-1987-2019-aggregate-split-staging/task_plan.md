# Task Plan: REQ-015 Math2 1987-2019 Aggregate Split Staging

## Goal

Create a focused PR that deterministically audits the Math2 1987-2019 aggregate
sources and identifies safe next staging/import boundaries without inventing data
or mixing unrelated work.

## Phases

- [x] Phase 1: Read required repo and skill instructions.
- [x] Phase 2: Sync from latest `origin/main` and create the isolated branch.
- [x] Phase 3: Confirm PR #15 and prior Math2 boundaries.
- [x] Phase 4: Create REQ-015 requirement and durable report files.
- [x] Phase 5: Confirm aggregate source paths, source repo state, hashes, and
      line counts.
- [x] Phase 6: Implement deterministic aggregate split/audit scanner.
- [x] Phase 7: Generate audit artifacts and decide future staging boundaries.
- [x] Phase 8: Add focused tests and Makefile target.
- [x] Phase 9: Run focused validation and full verification.
- [ ] Phase 10: Record source after-state, commit, push, and open PR.

## Key Questions

1. Do the paper and solutions aggregate files provide stable year boundaries for
   every year from 1987 through 2019?
2. Which years have complete question boundaries and complete choice options
   without OCR repair or invention?
3. Do 1987-1996 titles require historical Math2-vs-legacy-title approval before
   staging?
4. Can any year safely move to a later schema-valid staging PR under the current
   no-invention rules?

## Decisions Made

- Use Chinese user-facing updates for this delegated task.
- Base branch is `origin/main`; PR #15 is open and used only as read evidence.
- Do not import 1987-2019 into the DB in this PR.
- Do not generate staging if the current schema or source boundaries make that
  unsafe.
- DeepSeek, if used, is limited to local-only mechanical support; secrets stay
  out of logs, files, commits, and PR text.
- Deterministic local scans are sufficient for REQ-015; do not read/use the
  DeepSeek key in this PR.
- No staging is generated in REQ-015 because all aggregate years have
  answers/explanations interleaved with question text and require per-year
  extraction/review.
- 1987-1996 remain blocked pending historical `试卷三` title review.
- 1997-2019 are future per-year staging candidates, not DB-importable outputs in
  this PR.

## Errors Encountered

- `gh pr view 15` initially failed inside the sandbox because GitHub CLI config
  was not readable; reran the read-only query with approved escalation.
- First `mingw32-make NPM=npm.cmd verify` failed because `katex` was missing;
  resolved by running `mingw32-make NPM=npm.cmd install` with approved
  escalation after sandbox npm-cache access failed.

## Status

**Currently in Phase 10** - Focused aggregate audit and full verification passed;
source after-state is recorded; preparing commit, push, and PR.
