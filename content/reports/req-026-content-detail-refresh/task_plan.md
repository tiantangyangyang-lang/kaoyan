# Task Plan: Refresh edited question details

## Goal

Ensure the current practice question displays the latest saved detail and never
mislabels an unloaded detail as missing.

## Phases

- [x] Phase 1: Isolate the requirement and create durable planning artifacts.
- [x] Phase 2: Inspect current state flow and tests; record exact change points.
- [x] Phase 3: Add failing regression tests for the three acceptance behaviors.
- [x] Phase 4: Implement the smallest state-refresh and loading-label changes.
- [x] Phase 5: Run targeted and repository verification; document results.
- [x] Phase 6: Reconcile with current `origin/main` and run pre-publish checks.
- [ ] Phase 7: Stage exact REQ-026 files, commit, push, and create one PR.
- [ ] Phase 8: Complete an independent full-diff review and wait for required CI.
- [ ] Phase 9: Merge the approved PR, verify deployment, and test production.

## Key questions

1. What is the smallest callback contract from the admin editor to `App`?
2. How can authenticated bank replacement refresh one selected detail without a
   request loop or stale response overwrite?
3. Which component currently conflates `not_loaded` and `missing`?

## Decisions made

- Use a new `codex/req-026-content-detail-refresh` branch and worktree from the
  latest `origin/main`; the root worktree is behind and contains an unrelated
  untracked `.claude/` directory.
- Keep database, API, authentication, and content unchanged.

## Errors encountered

- Initial `git worktree add` could not create a ref lock under the sandbox. It
  succeeded after a scoped approval for `git worktree add`.
- Initial `make install` could not read the user npm cache under the sandbox. The
  same command succeeded after scoped approval. npm also warned that the local
  Node 24 runtime differs from the declared Node 20 engine.
- The first regression run waited for a dashboard count after the scenario had
  already navigated to practice. The test precondition was corrected to assert
  the visible workspace before rerunning.
- With the corrected precondition, the old code timed out waiting for
  `正在加载参考答案…`, confirming the intended regression failure.
- The first post-fix smoke run passed functional assertions but reported four
  404 console errors because the expanded solution now requested animation
  availability. The test route was updated to return `available: false`.
- Full `make verify` stopped in the pre-existing Math2 inventory gate: the test
  expects 775 files in `D:/work/Kaoyan-Math2-Papers`, while the current read-only
  source contains 792. Generated REQ-002/Math2 artifacts were restored and the
  code-relevant `make typecheck test build` gate is being run separately.

## Status

**Currently in Phase 7** - staging the exact REQ-026 scope for commit and PR.
