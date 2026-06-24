# Task Plan: REQ-003 Math2 Full Import Preparation

## Goal

Prepare safe per-year Math2 import queues, validation gates, human review checklists,
and Claude Code mechanical-batch handoff prompts without running a broad import.

## Priorities

- P0: preserve source immutability and record source commit/dirty state before and after.
- P0: define REQ-003 scope, exclusions, validation gates, and acceptance criteria.
- P0: keep 2020 as the frozen pilot reference and block full import/publication.
- P0: create per-year queue and human review checklist.
- P0: create Claude Code prompts that are mechanical only and stop on anomalies.
- P1: run deterministic inventory and focused Math2 verification.
- P1: run full `mingw32-make NPM=npm.cmd verify` before commit if time and environment allow.
- P2: future converter implementation, live database dry-runs, frontend UI, dynamic explanations, and publication.

## Phases

- [x] Phase 1: Read AGENTS.md and required local skills.
- [x] Phase 2: Inspect branch/worktree state and create isolated branch.
- [x] Phase 3: Record source repository commit and dirty state before edits.
- [x] Phase 4: Inspect REQ-002 artifacts, inventory, schema, commands, and handoff prompt.
- [x] Phase 5: Report proposed queue structure before broad edits.
- [x] Phase 6: Create REQ-003 requirement and durable report artifacts.
- [x] Phase 7: Rerun inventory into the REQ-003 report directory.
- [x] Phase 8: Run smallest meaningful verification.
- [x] Phase 9: Record source repository commit and dirty state after work.
- [x] Phase 10: Review diff, commit, push, and open PR.

## Decisions Made

- Use the current isolated Codex worktree at `C:\Users\60549\.codex\worktrees\04cc\kaoyan`.
- Create branch `codex/math2-full-import-prep` from REQ-002 tip `89d9579`.
- Treat `D:\work\Kaoyan-Math2-Papers` as read-only.
- Do not alter `D:\work\kaoyan`, which is on a different branch.
- Do not add Make targets yet; existing `math2-inventory`, `math2-validate`, `test-math2`, `math2-import-dry-run`, and `verify` are enough for this preparation task.
- Keep all non-2020 years as queued preparation, not imported content.

## Evidence Captured

- Target branch before new branch: detached at `89d9579`, also `origin/codex/math2-markdown-import`.
- Source commit before work: `fd42c56eed412cce0cb97d6bd688f314c78e542e`.
- Source dirty state before work: dirty with five untracked MinerU Markdown paper files.
- Current inventory rerun result: 775 files and 11 audited Markdown sources.
- Verification: `mingw32-make NPM=npm.cmd verify` passed after `mingw32-make NPM=npm.cmd install` installed missing npm dependencies.
- Verification details: 96 KaTeX expressions with 0 errors, 14 focused Math2 Python tests passed, 10 API tests passed, web smoke passed, web/API builds passed, and Python compileall passed.
- Source commit after work: `fd42c56eed412cce0cb97d6bd688f314c78e542e`.
- Source dirty state after work: unchanged; the same five MinerU Markdown paper files remain untracked.

## Errors Encountered

- A first probe looked for `tests\test_inventory_math2.py`, which does not exist. The actual file is `tests\test_inventory_math2_markdown.py`.
- The first `mingw32-make NPM=npm.cmd verify` failed because `node_modules` was absent and `katex` could not be resolved. Resolved by running `mingw32-make NPM=npm.cmd install`; npm reported an engine warning because the repo requires Node `20.x` and the environment uses Node `24.15.0`.
- Verification touched `content/staging/math2/2020/katex-validation.json` only at Git stat/line-ending metadata level; `git update-index --really-refresh` cleared the no-content status so it is not part of this change.
- `git add -- docs/requirements/REQ-003-math2-full-import-prep.md content/reports/req-003-math2-full-import-prep content/queues/math2-full-import-prep.json prompts/cc-math2-full-import-prep-mechanical-batch.md` was rejected by the approval system because the account hit its usage limit. Commit, push, and PR creation remain blocked until approval is available again or the user runs the git commands locally.

## Status

**Phase 10 in progress (Claude Code follow-up).** Artifacts and verification were finished in the prior Codex session; staging/commit/push/PR were blocked by an approval-system usage limit. Claude Code unblocked the git workflow: staged the nine REQ-003 artifacts and committed them on `codex/math2-full-import-prep`. Push and PR creation against `main` follow (PR #2 already merged; branch base `89d9579` is an ancestor of `origin/main`).
