# Task Plan: REQ-011 Math2 2021-2022 Staging Readiness

## Goal

Produce a deterministic read-only readiness audit for Math2 2021 and 2022, then
hand off a small PR that does not create unsafe staging artifacts.

## Phases

- [x] Phase 1: Read required instructions and confirm PR #11/main baseline.
- [x] Phase 2: Create isolated branch from current `origin/main`.
- [x] Phase 3: Create REQ-011 requirement and durable report files.
- [x] Phase 4: Inspect queue/source evidence for 2021 and 2022.
- [x] Phase 5: Implement focused audit script, tests, and Make target.
- [x] Phase 6: Generate audit artifacts and update queue readiness status.
- [x] Phase 7: Run focused validation and full verification.
- [ ] Phase 8: Record final source repo state, commit, push, and open PR.

## Key Questions

1. Do the 2021 source candidates identify as Math2 or Math3?
2. Can 2022 recover all Q1-Q22 boundaries and complete A-D options without
   invented repairs?
3. What is the smallest safe follow-up PR after this audit?

## Decisions Made

- Use REQ-011 for 2021/2022 readiness audit, not 1987-2019 aggregate splitting.
- Do not run any live DB dry-run/import in this requirement.
- Do not create 2021/2022 staging unless the audit proves the inputs are safe
  under current schema and source-role rules.
- Delegate mechanical source listing/hashing/boundary scans to an explorer
  agent; primary Codex owns source-role and staging-boundary decisions.
- 2021 is blocked because both audited candidates identify as Math3.
- 2022 is blocked because neither audited candidate is mechanically stageable
  as-is; a separate source-role/repair requirement is needed.

## Errors Encountered

- First full `mingw32-make NPM=npm.cmd verify` failed because `node` could not
  find package `katex`; resolved by running `mingw32-make NPM=npm.cmd install`
  in this worktree.

## Status

**Currently in Phase 8** - Verification passed; commit, push, and PR remain.
