# Task Plan: REQ-007 Math2 Source Recovery

## Goal

Verify that the restored MinerU Markdown files match the previous Math2 source
contract and determine the correct PR #6 disposition without editing the source
repository.

## Phases

- [x] Phase 1: Print plan and exact intended tracked file changes.
- [x] Phase 2: Inspect PR #6, current repo state, source repo state, and local
      instructions.
- [x] Phase 3: Verify restored file existence and hashes.
- [x] Phase 4: Compare hashes against REQ-002, REQ-003, REQ-004, queues,
      staging, and source inventories.
- [x] Phase 5: Run requested verification from `D:\work\kaoyan`.
- [x] Phase 6: Write REQ-007 requirement and source recovery notes.
- [ ] Phase 7: Run final checks, commit, push, and open PR.

## Key Questions

1. Do all five restored MinerU Markdown files exist?
2. Do their hashes match the old source contract?
3. Does restoring them resolve the previous missing-input `make verify` failure?
4. Should PR #6 be merged, updated, closed, or superseded?

## Decisions Made

- Create branch `codex/math2-source-recovery` from `origin/main`.
- Do not update queue metadata because the restored hashes match the previous
  contract and PR #6 was not merged into `origin/main`.
- Treat the user-provided PR #4 decision as project state for this task: Math2
  2023 option (b), comparison transcript as primary. Do not re-decide 2023 roles.

## Errors Encountered

- Running `mingw32-make NPM=npm.cmd verify` in this isolated worktree reached
  `math2-katex` but failed because local `node_modules` does not contain
  `katex`. The required verification from `D:\work\kaoyan` passed.

## Status

**Currently in Phase 7** - Final checks before commit, push, and PR.
