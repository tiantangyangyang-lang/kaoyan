# Task Plan: REQ-016 Math3 1987-1996 Staging and DB Readiness

## Goal

Prepare 1987-1996 aggregate sections as Math3 staging batches, add safe import support, verify locally, and hand off exact DB import commands without running an unauthorized live commit.

## Phases

- [x] Phase 1: Isolate branch and define requirement/report files.
- [x] Phase 2: Record source inventory and aggregate boundary evidence.
- [x] Phase 3: Implement deterministic Math3 1987-1996 split/transform.
- [x] Phase 4: Generalize backend import and static web sync for Math3.
- [x] Phase 5: Generate staging outputs and reports.
- [x] Phase 6: Run focused validation and full verify.
- [ ] Phase 7: Commit, push, open focused PR, and hand off DB import runbook.

## Key Questions

1. Which 1987-1996 aggregate sections can become schema-valid Math3 staging without invented content?
2. Which records require blocked anomalies because the source refers to another paper or lacks complete options?
3. What is the exact maintainer command boundary for DB dry-run and commit?

## Decisions Made

- Treat 1987-1996 as Math3, not Math2, because the aggregate headings identify `试卷三`.
- Keep 1997-2019 Math2 aggregate staging out of this PR.
- Keep all records under human review and blocked until a later promotion requirement.
- Do not run live DB commit from Codex; provide maintainer commands instead.

## Errors Encountered

- `split_years` initially ended 1996 at EOF because only Math3 headings were considered. Fixed it to end each Math3 year at the next top-level heading, which prevents 1997-2019 Math2 content from entering Math3 staging.
- `npm` was blocked by PowerShell execution policy. Used `npm.cmd`, matching project guidance.
- New generic Math3 importer test initially mismatched `sourceYear` and `stableId`. Corrected the fixture to use 1987 consistently.

## Status

**Currently in Phase 7** - Full verification passed; preparing commit, push, and PR.
