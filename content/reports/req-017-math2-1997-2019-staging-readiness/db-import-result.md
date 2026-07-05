# REQ-017 DB Import Result

## Scope

- Requirement: `docs/requirements/REQ-017-math2-1997-2019-staging-readiness.md`
- Report directory: `content/reports/req-017-math2-1997-2019-staging-readiness/`
- Input payloads: `content/staging/math2/1997/questions.json` through `content/staging/math2/2019/questions.json`
- Subject: `math2`
- Years: 1997-2019
- Status boundary: imported as `staging` only; no publication or promotion was performed.

## Source Repository State

Recorded before DB work on 2026-07-05:

- Source repo: `D:\work\Kaoyan-Math2-Papers`
- Branch: `main`
- Commit: `fd42c56eed412cce0cb97d6bd688f314c78e542e`
- Dirty state: source git status included untracked `.obsidian/` plus five untracked MinerU Markdown source files. The generators now ignore `.obsidian/` as local tool metadata and preserve the five MinerU Markdown source files as source dirty evidence.

## Dry Run

Command:

```powershell
mingw32-make NPM=npm.cmd math2-db-1997-2019-import-dry-run
```

Result:

- First sandboxed attempt reached local validation but DB connections were denied by the sandbox network policy (`EACCES`).
- Retried with approved external network access and the configured local `.env` loaded into process environment only.
- Dry-run passed for all 23 years.
- Every import result had `dryRun: true` and `transaction: rolled_back`.
- Validated question total: 455.

## Commit Import

Command:

```powershell
mingw32-make NPM=npm.cmd math2-db-1997-2019-import-commit
```

Result:

- Commit import passed for all 23 years.
- Every import result had `dryRun: false` and `transaction: committed`.
- Committed question total: 455.
- Imported batch IDs: `REQ-017-math2-<year>-aggregate-staging` for 1997-2019.

## Read-Only SQL Verification

The verification query checked `kaoyan_content_batches` joined to `kaoyan_questions` with these filters:

- `subject_code = 'math2'`
- `source_year BETWEEN 1997 AND 2019`
- `status = 'staging'`
- `id LIKE 'REQ-017-math2-%-aggregate-staging'`

Totals:

| Batches | Questions | needs_human_review | blocked |
|---:|---:|---:|---:|
| 23 | 455 | 455 | 455 |

Per-year verification:

| Year | Batches | Questions | Status | needs_human_review | blocked |
|---:|---:|---:|---|---:|---:|
| 1997 | 1 | 17 | staging | 17 | 17 |
| 1998 | 1 | 21 | staging | 21 | 21 |
| 1999 | 1 | 16 | staging | 16 | 16 |
| 2000 | 1 | 21 | staging | 21 | 21 |
| 2001 | 1 | 20 | staging | 20 | 20 |
| 2002 | 1 | 20 | staging | 20 | 20 |
| 2003 | 1 | 17 | staging | 17 | 17 |
| 2004 | 1 | 23 | staging | 23 | 23 |
| 2005 | 1 | 18 | staging | 18 | 18 |
| 2006 | 1 | 23 | staging | 23 | 23 |
| 2007 | 1 | 24 | staging | 24 | 24 |
| 2008 | 1 | 23 | staging | 23 | 23 |
| 2009 | 1 | 23 | staging | 23 | 23 |
| 2010 | 1 | 23 | staging | 23 | 23 |
| 2011 | 1 | 23 | staging | 23 | 23 |
| 2012 | 1 | 16 | staging | 16 | 16 |
| 2013 | 1 | 18 | staging | 18 | 18 |
| 2014 | 1 | 23 | staging | 23 | 23 |
| 2015 | 1 | 11 | staging | 11 | 11 |
| 2016 | 1 | 16 | staging | 16 | 16 |
| 2017 | 1 | 18 | staging | 18 | 18 |
| 2018 | 1 | 18 | staging | 18 | 18 |
| 2019 | 1 | 23 | staging | 23 | 23 |

## Publication Boundary

These records are not publishable in REQ-017. Every year still has blocking source-review anomalies, and every imported question remains:

- `reviewStatus: needs_human_review`
- `finalizationStatus: blocked`

Promotion or publication requires a separate review/promotion requirement.

## Notes

- No database URL, SSL setting, CA, password, token, or API key was written to this report.
- The local dependency install emitted a Node engine warning because the repo declares Node `20.x` while the current shell used Node `v24.15.0`; the import and verification commands completed successfully in this environment.
- Source inventory and staging generation ignore `.obsidian/` so local Obsidian metadata does not change deterministic Math source counts or dirtyState payloads.
