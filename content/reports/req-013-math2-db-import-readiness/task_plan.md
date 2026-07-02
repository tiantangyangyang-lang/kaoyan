# REQ-013 Task Plan

## Objective

Make database import repeatable for validated Math2 2020, 2023, and 2024 staging
files, then document the required path for 2021, 2022, and 1987-2019.

## Plan

- [x] P0: Confirm PR #13/main state and create an isolated branch.
- [x] P0: Create REQ-013 requirement and report files.
- [x] P0: Inspect current API import script, schema, tests, and Makefile targets.
- [x] P0: Add Makefile targets for 2020/2023/2024 dry-run and explicit commit.
- [x] P0: Verify whether `DATABASE_URL` is configured without exposing its value.
- [x] P1: Run dry-run import targets when configuration is available.
- [x] P1: Update report with remaining-years sequence and blockers.
- [x] P1: Run API and full verification.
- [x] P1: Commit, push, and open a focused PR.

## Boundaries

- No direct import of 2021, 2022, or 1987-2019 in this PR.
- No live commit import unless `DATABASE_URL` is present and the command is
  explicitly invoked.
- No publication/promotion to `published`.
- No source-repository edits.

## Verification Log

- `DATABASE_URL`: missing in the current shell, so live DB dry-run/commit was
  not executed.
- `npm.cmd run typecheck --workspace @kaoyan/api`: passed.
- `npm.cmd run test --workspace @kaoyan/api`: passed.
  - Import tests now validate 2020, 2023, and 2024 staging payloads through the
    transactional dry-run importer.
- `mingw32-make NPM=npm.cmd -n math2-db-preview-import-dry-run`: passed.
  - Confirmed the composed target invokes import commands for 2020, 2023, and
    2024 after their corresponding staging validation prerequisites.
- `mingw32-make NPM=npm.cmd verify`: passed.

## PR Handoff

- PR: https://github.com/tiantangyangyang-lang/kaoyan/pull/14
