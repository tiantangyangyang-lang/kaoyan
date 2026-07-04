# DB Import Result: Math3 1987-1996 Staging

## Result

REQ-016 Math3 1987-1996 staging was imported into the configured MySQL database on 2026-07-04.

No database URL, credential, CA, or secret value is recorded in this report.

## Commands Run

```powershell
mingw32-make NPM=npm.cmd math3-db-1987-1996-import-dry-run
mingw32-make NPM=npm.cmd math3-db-1987-1996-import-commit
```

The commands loaded `DATABASE_URL`, `DATABASE_SSL`, and optional `DATABASE_CA_BASE64` from `D:\work\kaoyan\.env` into the process environment without printing them.

## Dry-Run Result

All 10 year batches validated and inserted inside transactions, then rolled back:

| Year | Batch ID | Questions | Transaction |
|---:|---|---:|---|
| 1987 | `REQ-016-math3-1987-aggregate-staging` | 18 | rolled_back |
| 1988 | `REQ-016-math3-1988-aggregate-staging` | 18 | rolled_back |
| 1989 | `REQ-016-math3-1989-aggregate-staging` | 17 | rolled_back |
| 1990 | `REQ-016-math3-1990-aggregate-staging` | 20 | rolled_back |
| 1991 | `REQ-016-math3-1991-aggregate-staging` | 20 | rolled_back |
| 1992 | `REQ-016-math3-1992-aggregate-staging` | 16 | rolled_back |
| 1993 | `REQ-016-math3-1993-aggregate-staging` | 16 | rolled_back |
| 1994 | `REQ-016-math3-1994-aggregate-staging` | 20 | rolled_back |
| 1995 | `REQ-016-math3-1995-aggregate-staging` | 21 | rolled_back |
| 1996 | `REQ-016-math3-1996-aggregate-staging` | 12 | rolled_back |

## Commit Result

All 10 year batches committed as `status = 'staging'`:

| Year | Batch ID | Questions | Transaction |
|---:|---|---:|---|
| 1987 | `REQ-016-math3-1987-aggregate-staging` | 18 | committed |
| 1988 | `REQ-016-math3-1988-aggregate-staging` | 18 | committed |
| 1989 | `REQ-016-math3-1989-aggregate-staging` | 17 | committed |
| 1990 | `REQ-016-math3-1990-aggregate-staging` | 20 | committed |
| 1991 | `REQ-016-math3-1991-aggregate-staging` | 20 | committed |
| 1992 | `REQ-016-math3-1992-aggregate-staging` | 16 | committed |
| 1993 | `REQ-016-math3-1993-aggregate-staging` | 16 | committed |
| 1994 | `REQ-016-math3-1994-aggregate-staging` | 20 | committed |
| 1995 | `REQ-016-math3-1995-aggregate-staging` | 21 | committed |
| 1996 | `REQ-016-math3-1996-aggregate-staging` | 12 | committed |

Total committed questions: 178.

## Post-Import Read-Only Check

Read-only DB verification returned:

| Year | Subject | Status | Batches | Questions |
|---:|---|---|---:|---:|
| 1987 | math3 | staging | 1 | 18 |
| 1988 | math3 | staging | 1 | 18 |
| 1989 | math3 | staging | 1 | 17 |
| 1990 | math3 | staging | 1 | 20 |
| 1991 | math3 | staging | 1 | 20 |
| 1992 | math3 | staging | 1 | 16 |
| 1993 | math3 | staging | 1 | 16 |
| 1994 | math3 | staging | 1 | 20 |
| 1995 | math3 | staging | 1 | 21 |
| 1996 | math3 | staging | 1 | 12 |

## Remaining Boundary

These records are in backend staging only. They are not promoted to published content and should remain blocked until a separate review/promotion requirement approves them.
