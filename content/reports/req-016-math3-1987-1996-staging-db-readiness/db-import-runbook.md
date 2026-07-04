# DB Import Runbook: Math3 1987-1996 Staging

## Boundary

Codex did not run a live DB import or commit. The maintainer should run these commands only in an environment where `DATABASE_URL` points at the intended MySQL database.

The import writes `kaoyan_content_batches.status = 'staging'`. It does not publish content.

## Preflight

From the repository root:

```powershell
$env:DATABASE_URL
mingw32-make NPM=npm.cmd math3-1987-1996-validate
```

Confirm:

- `DATABASE_URL` is configured for the intended database.
- The validation command passes.
- The source inventory still records the same source commit and hashes:
  - `content/reports/req-016-math3-1987-1996-staging-db-readiness/source-inventory.json`

## Dry Run

Run the transactional dry-run first:

```powershell
mingw32-make NPM=npm.cmd math3-db-1987-1996-import-dry-run
```

Expected behavior:

- Every year batch validates and inserts inside a transaction.
- Every transaction returns `transaction: "rolled_back"`.
- No DB rows remain from the dry-run.

## Commit

Only after the dry-run succeeds:

```powershell
mingw32-make NPM=npm.cmd math3-db-1987-1996-import-commit
```

Expected staging batches:

- `REQ-016-math3-1987-aggregate-staging`
- `REQ-016-math3-1988-aggregate-staging`
- `REQ-016-math3-1989-aggregate-staging`
- `REQ-016-math3-1990-aggregate-staging`
- `REQ-016-math3-1991-aggregate-staging`
- `REQ-016-math3-1992-aggregate-staging`
- `REQ-016-math3-1993-aggregate-staging`
- `REQ-016-math3-1994-aggregate-staging`
- `REQ-016-math3-1995-aggregate-staging`
- `REQ-016-math3-1996-aggregate-staging`

Expected total inserted questions: 178.

## Post-Import Check

Use a read-only SQL client against the same database:

```sql
SELECT subject_code, source_year, status, COUNT(*) AS batches
FROM kaoyan_content_batches
WHERE id LIKE 'REQ-016-math3-%'
GROUP BY subject_code, source_year, status
ORDER BY source_year;

SELECT q.source_year, COUNT(*) AS questions
FROM kaoyan_questions q
JOIN kaoyan_content_batches b ON b.id = q.batch_id
WHERE b.id LIKE 'REQ-016-math3-%'
GROUP BY q.source_year
ORDER BY q.source_year;
```

Expected:

- `subject_code = 'math3'`
- `status = 'staging'`
- per-year question counts: 18, 18, 17, 20, 20, 16, 16, 20, 21, 12

## Rollback Boundary

If the committed staging import must be removed before promotion, delete only these staging batches after confirming they are still `status = 'staging'`. Do not delete published batches.
