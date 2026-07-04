# REQ-016: Math3 1987-1996 Staging and DB Readiness

## Problem

The 1987-2019 Math2 aggregate source contains 1987-1996 sections whose headings say `考研数学试卷三` / `考研数学试卷三解答`. These years should not be imported as Math2. They can be prepared as a separate Math3 topic so safe source-backed data can reach the backend without inventing content.

## User Value

- Makes the legacy 1987-1996 material available for review under a Math3 topic.
- Preserves source traceability, review blocking, and database import safety.
- Keeps this PR focused on Math3 1987-1996 instead of mixing the 1997-2019 Math2 split work.

## In Scope

- Record source repository branch, commit, dirty state, file hashes, and line counts before and after processing.
- Deterministically split the aggregate paper and solution Markdown for years 1987-1996.
- Generate `content/staging/math3/<year>/questions.json` plus validation, anomaly, summary, and KaTeX reports.
- Keep every generated record at `reviewStatus: needs_human_review` and `finalizationStatus: blocked`.
- Preserve answers and explanations only when they are directly sourced from aggregate evidence; otherwise use `null` with `missing` status.
- Add reusable Makefile targets for generation, validation, and DB import dry-run/commit commands.
- Generalize the backend import validation enough for schema-valid `math3` staging batches without weakening the existing Math2 contract.
- Add static web catalog/data support for a Math3 preview topic.
- Provide a DB import runbook for the maintainer to execute when `DATABASE_URL` is available.

## Out of Scope

- No live DB commit from Codex.
- No promotion from staging to published.
- No invention of missing answers, explanations, options, stems, formulas, or cross-paper referenced content.
- No Math2 1997-2019 staging in this PR.
- No schema relaxation of `math2-question-staging-v2` beyond subject-aware validation needed for Math3 staging.
- No use of DeepSeek for final judgment.

## Data Constraints

- Source repo `D:/work/Kaoyan-Math2-Papers` is read-only.
- Option objects must be exactly `{ "label", "value" }`; `option.text` is forbidden.
- Multiple-choice questions require complete A-D options or must be marked as blocked/anomalous rather than filled in.
- Question numbering inside each DB batch must be contiguous from 1.
- Source evidence must include relative path, role, git state, SHA-256, and line range.

## API and Database Constraints

- The MySQL schema already stores `subject_code` as `VARCHAR(32)`; no table migration is expected.
- Import must use parameterized SQL and transactional rollback on dry-run.
- Import commits require a configured `DATABASE_URL` and maintainer execution.
- Staging batches remain `status = 'staging'`; public API publication is a separate requirement.

## Acceptance Criteria

- `content/staging/math3/1987` through `content/staging/math3/1996` exist with schema-valid question batches.
- Generated records have `subjectCode: "math3"` and stable IDs like `math3-1987-q01`.
- All generated records keep `reviewStatus: needs_human_review` and `finalizationStatus: blocked`.
- The source inventory captures paper and solution hashes, line counts, branch, commit, and dirty state.
- The importer accepts Math2 and Math3 staging payloads and still rejects `option.text`.
- Web static content sync produces a Math3 catalog entry and `apps/web/public/data/math3.json`.
- Focused tests and full verification pass.
- Final handoff includes exact DB dry-run and commit commands for the maintainer.

## Verification Commands

```powershell
mingw32-make NPM=npm.cmd math3-1987-1996-validate
mingw32-make NPM=npm.cmd verify
```

Optional maintainer DB commands, only with `DATABASE_URL` configured:

```powershell
mingw32-make NPM=npm.cmd math3-db-1987-1996-import-dry-run
mingw32-make NPM=npm.cmd math3-db-1987-1996-import-commit
```
