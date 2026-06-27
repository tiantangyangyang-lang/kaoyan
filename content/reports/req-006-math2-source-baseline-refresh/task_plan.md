# Task Plan: REQ-006 Math2 Source Baseline Refresh

## Goal

Refresh the Math2 source baseline and queue assumptions without editing the source repository or importing Math2 content.

## Phases

- [x] Phase 1: Load local instructions, inspect initial repo state, and create the isolated branch.
- [x] Phase 2: Create the REQ-006 requirement and durable report scaffolding.
- [x] Phase 3: Gather read-only source repository state, file inventory, and hashes.
- [x] Phase 4: Compare current evidence against REQ-002 and queue assumptions.
- [x] Phase 5: Write source-baseline artifacts and queue consequence report.
- [x] Phase 6: Run verification, commit, push, and open the PR.

## Key Questions

1. Is `D:\work\Kaoyan-Math2-Papers` clean at commit `fd42c56eed412cce0cb97d6bd688f314c78e542e`?
2. Are the five REQ-002 untracked MinerU Markdown files still present under `papers/`?
3. Which current files are available for future Math2 work, and which older queue assumptions are invalid?
4. What work, if any, can be delegated to Claude Code without delegating interpretation or queue decisions?

## Decisions Made

- Use branch `codex/math2-source-baseline-refresh`.
- Use REQ-006 even though only REQ-001 and REQ-002 are present in this worktree, because the delegated task explicitly identifies this as the likely next isolated task.
- Treat the Math2 source repository as read-only and use only metadata, listing, and hashes.
- Keep REQ-002 artifacts as historical evidence; place the refreshed current baseline under REQ-006.
- Leave the Makefile unchanged in REQ-006. The failing `math2-pilot` dependency is documented as a stale source assumption instead of silently weakening the root verification target.

## Errors Encountered

- `git rev-parse --abbrev-ref --symbolic-full-name @{u}` failed in PowerShell because unquoted `@{u}` is parsed as a hash literal. Reran with `'@{u}'`.
- `mingw32-make NPM=npm.cmd verify` failed at `math2-pilot` with `FileNotFoundError: audited Math2 2020 Markdown inputs are missing`. This confirms the missing-source baseline finding.
- The failed verify run rewrote `content/reports/req-002-math2-markdown-import/source-inventory.json`; restored that generated change so REQ-002 remains historical and REQ-006 carries current evidence.

## Status

**Complete** - Initial implementation commit `e44395d` was pushed to `codex/math2-source-baseline-refresh`, and PR #6 was opened for REQ-006.
