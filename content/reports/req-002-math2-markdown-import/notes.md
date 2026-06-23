# Notes: REQ-002 Math2 Markdown Import

## Target Baseline

- Worktree: `C:\Users\60549\.codex\worktrees\e35e\kaoyan`
- Starting commit: `66a90e4faee72017b39a46fd8f92edd47eb3c98b`
- Starting state: clean, detached HEAD
- Created branch: `codex/math2-markdown-import`
- Existing GitHub PRs observed: PR #1, merged, unrelated Math1 workflow

## Source Baseline

- Repository: `D:\work\Kaoyan-Math2-Papers`
- Branch: `main`
- Commit: `fd42c56eed412cce0cb97d6bd688f314c78e542e`
- Dirty state: five untracked paper Markdown files under `papers/`
- Tracked file count: 770
- Markdown inventory: five paper files, six solution files, and `README.md`

Full source hashes and structural findings will be recorded in the audit report.

## Contract Findings

- Frontend options use `options[].value`; `option.text` is incompatible.
- The frontend `Question` type requires full fields, but `loadQuestionBank` currently validates only that `questions` is an array.
- Staging must therefore be fully shaped and remain disconnected from the frontend until promotion.
- The repository had no root `Makefile` at task start.
- 2020 is the pilot: deterministic 23-question boundaries, no explicit solution content, and known Q6/Q22 anomalies.

## Baseline Test Debt

`python -m unittest discover -s tests -p "test_*.py"` is not green on the starting repository state. It ran 134 tests with 14 errors, 4 failures, and 15 skips, all in existing Math1 repair tests that expect earlier staging shapes. REQ-002 does not modify those fixtures or repair scripts.
