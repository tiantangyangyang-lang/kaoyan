# REQ-007: Math2 Source Recovery

## Status

Implemented for source-recovery verification and PR review.

## Problem and User Value

REQ-006 documented that five untracked MinerU Markdown files required by the
Math2 source contract were missing from `D:\work\Kaoyan-Math2-Papers`. Those
files have now been restored from external backup. The project needs an isolated
verification pass to prove whether the restored files match the old contract and
whether the previous `make verify` failure is resolved.

## Scope

- Inspect PR #6 and record its relevance after source recovery.
- Verify that the five restored MinerU Markdown files exist under
  `D:\work\Kaoyan-Math2-Papers\papers\`.
- Compute SHA-256 hashes for all five restored files.
- Compare restored hashes against REQ-002, REQ-003, REQ-004, Math2 queues,
  Math2 staging references, and source inventory reports.
- Run `mingw32-make NPM=npm.cmd verify` from `D:\work\kaoyan`.
- Determine whether the restored files match the previous Math2 source
  contract and whether the REQ-002 2020 pilot can still be reproduced.
- Report whether PR #6 should be merged, updated, closed, or superseded.

## Out of Scope

- Editing `D:\work\Kaoyan-Math2-Papers`.
- Committing the restored MinerU files to the source repository.
- Deleting or moving restored source files.
- Modifying Makefile verification logic.
- Bypassing `make verify`.
- Importing Math2 into the frontend.
- Changing API, database, frontend, auth, deployment, or source-role code.
- Deciding 2023 source roles. The project decision supplied for this task is
  PR #4 option (b): use the comparison transcript as primary for Math2 2023.

## Data Constraints

- `D:\work\Kaoyan-Math2-Papers` is strictly read-only.
- The five restored MinerU files remain untracked in the source repository
  unless the maintainer explicitly approves committing them there.
- This repo may record file paths, byte counts, SHA-256 hashes, and conclusions,
  but must not copy the restored source content.

## Authentication Constraints

No authentication behavior changes are in scope.

## Performance Constraints

Verification must use the existing project command. No new recurring command is
added.

## Compatibility Constraints

- Existing Math1 content and workflows are unchanged.
- Existing Math2 source contract remains valid only if restored hashes match the
  previous records.
- PR #6 is evaluated as a historical missing-source report; this task does not
  rewrite that PR.

## Acceptance Criteria

- [x] Requirement and durable report files exist for REQ-007.
- [x] PR #6 is inspected and its recommendation is recorded.
- [x] All five restored MinerU Markdown files are checked for existence.
- [x] SHA-256 hashes are computed for all five files.
- [x] Hashes are compared against prior Math2 records and queues.
- [x] Source repo state is recorded before/after without editing source files.
- [x] `mingw32-make NPM=npm.cmd verify` is run from `D:\work\kaoyan`.
- [x] The report states whether the previous missing-input verification failure
      is resolved.
- [x] No Makefile, API, DB, frontend, auth, deployment, or source repo content
      changes are made.
- [x] Changes are committed with a Conventional Commit, pushed, and opened as
      PR #7 referencing this requirement.

## Verification Commands

```powershell
git -C D:\work\Kaoyan-Math2-Papers status --short --branch
git -C D:\work\Kaoyan-Math2-Papers rev-parse HEAD
Get-FileHash -Algorithm SHA256 D:\work\Kaoyan-Math2-Papers\papers\MinerU_markdown_math2_*.md
mingw32-make NPM=npm.cmd verify
```
