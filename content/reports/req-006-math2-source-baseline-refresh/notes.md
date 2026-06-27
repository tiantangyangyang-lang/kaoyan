# Notes: REQ-006 Math2 Source Baseline Refresh

## Initial Local State

- kaoyan worktree started clean at detached `HEAD`.
- Branch created: `codex/math2-source-baseline-refresh`.
- Current kaoyan commit before edits: `d20a7247cbace880dbf976772037d7891ab1757b`.
- `docs/requirements/REQ-002-math2-markdown-import.md` records the source commit as `fd42c56eed412cce0cb97d6bd688f314c78e542e` with a dirty worktree caused by five untracked paper Markdown files.

## REQ-002 Recorded Untracked MinerU Paper Markdown Files

- `papers/MinerU_markdown_math2_1987-2019_2065686324641095680.md`
- `papers/MinerU_markdown_math2_2020_2065687152877731840.md`
- `papers/MinerU_markdown_math2_2021_2065687851346780160.md`
- `papers/MinerU_markdown_math2_2022_2065687890395758592.md`
- `papers/MinerU_markdown_math2_2023_2065687933685170176.md`

## Source State Evidence To Fill

- Source path: `D:\work\Kaoyan-Math2-Papers`
- Branch/upstream: `main` / `origin/main`
- Commit: `fd42c56eed412cce0cb97d6bd688f314c78e542e`
- Dirty state: clean
- Untracked files: none
- Ahead/behind `origin/main`: `0/0`
- Five MinerU files present/missing: all five missing

## Queue Assumptions To Check

- REQ-002 source traceability and pilot source assumptions.
- `content/queues/` Math2 queue files, if any.
- Any REQ-003 requirement or report files discoverable in this worktree.

Findings:

- No REQ-003 artifact is present in this worktree.
- `content/queues/math2-markdown-import-template.json` is the only Math2 queue file and has an empty `tasks` list.
- Existing Math2 2020 staging still references the missing 2020 MinerU primary path and should be treated as a historical frozen candidate, not as reproducible from the current source checkout.
- Full root verification fails at `math2-pilot` because `scripts/transform_math2_2020.py` cannot find the audited Math2 2020 Markdown inputs.

## Delegation Boundary Draft

Claude Code may later do mechanical source listing, hash computation, byte counts, and narrow per-file audits against explicit checklists. It must not decide source roles, select canonical versions, change queue status, or approve publication/import.

## Verification

- JSON parse check for `content/queues/math2-markdown-import-template.json` and `content/reports/req-006-math2-source-baseline-refresh/source-inventory.json`: passed.
- Source repo unchanged check: passed, `## main...origin/main`.
- `mingw32-make NPM=npm.cmd verify`: failed at `math2-pilot` with missing audited Math2 2020 Markdown inputs; documented in `verification.md`.
