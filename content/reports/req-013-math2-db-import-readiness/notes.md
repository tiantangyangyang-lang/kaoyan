# REQ-013 Notes

## Confirmed State

- PR #13 was merged into `main` at `2026-07-01T11:07:22Z`.
- Current branch: `codex/req-013-math2-db-import-readiness`.
- Branch base: `origin/main` after PR #13.
- PR handoff: https://github.com/tiantangyangyang-lang/kaoyan/pull/14

## Existing Import Behavior

- Script: `apps/api/scripts/import-math2.ts`
- Package command: `npm run import:math2 --workspace @kaoyan/api -- --input <questions.json> [--commit]`
- Default behavior is dry-run because `dryRun = !args.includes("--commit")`.
- Import writes one batch per staging payload.
- Imported batches are inserted with `status = 'staging'`.
- Public API queries only `status = 'published'` batches.

## Safe Import Candidates

- 2020: already staged and validated, 23 questions.
- 2023: already staged and validated, 22 questions.
- 2024: already staged and validated, 22 questions.

These are candidates for database staging import, not publication.

## Remaining Years

- 2021: blocked by source identity/OCR evidence from prior audit work; do not
  import until a separate source repair/staging requirement validates it.
- 2022: blocked by source-role/repair issues from prior audit work; do not import
  until a separate source repair/staging requirement validates it.
- 1987-2019: one aggregate source must be split by year first; 1987-1996 require
  historical subject-title review because headings say `试卷三`.

## Source Repository State

- Branch: `main...origin/main`
- Commit: `fd42c56eed412cce0cb97d6bd688f314c78e542e`
- Dirty state: existing untracked files under `papers/`:
  - `MinerU_markdown_math2_1987-2019_2065686324641095680.md`
  - `MinerU_markdown_math2_2020_2065687152877731840.md`
  - `MinerU_markdown_math2_2021_2065687851346780160.md`
  - `MinerU_markdown_math2_2022_2065687890395758592.md`
  - `MinerU_markdown_math2_2023_2065687933685170176.md`

## Local Database Configuration

- `DATABASE_URL`: missing in this shell.
- Live database import was not run at this point.

## Makefile Targets Added

- `math2-2020-import-dry-run`
- `math2-2023-import-dry-run`
- `math2-2024-import-dry-run`
- `math2-db-preview-import-dry-run`
- `math2-2020-import-commit`
- `math2-2023-import-commit`
- `math2-2024-import-commit`
- `math2-db-preview-import-commit`

`math2-import-dry-run` remains available as an alias for the 2020 pilot dry-run.

## Verification Results

- `npm.cmd run typecheck --workspace @kaoyan/api`: passed.
- `npm.cmd run test --workspace @kaoyan/api`: passed.
- `mingw32-make NPM=npm.cmd -n math2-db-preview-import-dry-run`: passed.
  - It would validate and import 2020, 2023, and 2024 staging payloads in order.
  - It was intentionally run in `-n` mode because `DATABASE_URL` is missing.
- `mingw32-make NPM=npm.cmd verify`: passed.
