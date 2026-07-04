# Notes: REQ-016 Math3 1987-1996 Staging and DB Readiness

## Scope Boundary

- This task is for Math3 1987-1996 only.
- 1997-2019 aggregate Math2 work remains separate.
- Live DB commit is not run by Codex.

## Current Code Findings

- `apps/api/schema.sql` stores `subject_code` as `VARCHAR(32)`, so Math3 does not need a table schema change.
- `apps/api/src/math2-import.ts` currently validates only `subjectCode: "math2"` and `stableId` prefix `math2-`.
- `apps/web/scripts/sync-content.mjs` currently exports Math1 and Math2 static banks only.
- `apps/web/src/types.ts` currently defines `SubjectCode = "math1" | "math2"`.

## Source Evidence To Record

- Paper aggregate: `papers/MinerU_markdown_math2_1987-2019_2065686324641095680.md`
- Solution aggregate: `solutions/math2_1987-2019/math2_1987-2019.md`
- Need branch, commit, dirty state, SHA-256, line counts, and post-task state for `D:/work/Kaoyan-Math2-Papers`.

## Generated Output

- Math3 staging output: `content/staging/math3/1987` through `content/staging/math3/1996`
- Total generated records: 178
- Per-year generated records:
  - 1987: 18
  - 1988: 18
  - 1989: 17
  - 1990: 20
  - 1991: 20
  - 1992: 16
  - 1993: 16
  - 1994: 20
  - 1995: 21
  - 1996: 12
- Static web output: `apps/web/public/data/math3.json`
- Catalog output: `apps/web/public/data/subjects.json`

## DB Import Boundary

- Codex did not run a live DB dry-run or commit.
- Maintainer runbook: `content/reports/req-016-math3-1987-1996-staging-db-readiness/db-import-runbook.md`
- Dry-run target: `mingw32-make NPM=npm.cmd math3-db-1987-1996-import-dry-run`
- Commit target: `mingw32-make NPM=npm.cmd math3-db-1987-1996-import-commit`

## Verification So Far

- `mingw32-make NPM=npm.cmd math3-1987-1996-validate` passed.
- `npm.cmd run typecheck:api` passed.
- `npm.cmd run typecheck:web` passed.
- `npm.cmd run test:api` passed.
- `mingw32-make NPM=npm.cmd verify` passed.

## PR

- https://github.com/tiantangyangyang-lang/kaoyan/pull/17
