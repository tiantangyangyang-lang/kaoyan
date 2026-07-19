# REQ-018 Promotion Audit

Status: promotion completed and then rolled back on 2026-07-19 at the maintainer's request.

## Final disposition

The final live database state is **not published**. A fixed-scope transactional
rollback restored all 74 authorized batches to `staging` and cleared their
`published_at` values. It did not reverse approval or modify question content.

| Subject | Staging batches | Staging questions | Published batches | Approved with known risks |
|---|---:|---:|---:|---:|
| Math1 | 38 | 852 | 0 | 852 |
| Math2 | 26 | 522 | 0 | 522 |
| Math3 | 10 | 178 | 0 | 178 |
| **Total** | **74** | **1552** | **0** | **1552** |

Post-rollback stable ID duplicates: 0. Anonymous list requests return 401;
valid-session list requests return 200 with 0 published questions.

## Historical promotion result before rollback

| Subject | Approved | Published batches | Published questions |
|---|---:|---:|---:|
| Math1 | 852 | 38 | 852 |
| Math2 | 522 | 26 | 522 |
| Math3 | 178 | 10 | 178 |
| **Total** | **1552** | **74** | **1552** |

All 74 promotion transactions committed. Published stable ID duplicates: 0.
No authorized Math1/Math2/Math3 staging batch remains.

This state was temporary and was superseded by the rollback recorded above.

## Authentication verification

The production route implementation now runs session validation before content
lookup and returns `Cache-Control: private, no-store`.

The following table records the temporary promoted state before rollback; after
rollback, valid-session list requests still return 200 but contain 0 questions.

| Subject | Anonymous list | Valid-session list | Valid-session detail | API total |
|---|---:|---:|---:|---:|
| Math1 | 401 | 200 | 200 | 852 |
| Math2 | 401 | 200 | 200 | 522 |
| Math3 | 401 | 200 | 200 | 178 |

The live verification used the real MySQL content store and an in-process valid
session identity. It did not create a user or session row.

## Approval boundary

- Exact target: 74 batch IDs encoded in `AUTHORIZED_BATCH_IDS`.
- Pre-approval state: 1552 not approved; 706 finalization-blocked
  (Math1 6, Math2 522, Math3 178).
- Post-approval state: 1552 `review_status=approved` and 1552
  `finalization_status=approved_with_known_risks`.
- The approval SQL updated only `review_status` and `finalization_status`.
- Promotion updated batch lifecycle status and `published_at` through the
  pre-existing `publishContentBatch` gate.
- No stem, option, answer, explanation, formula, anomaly, stable ID, or source
  evidence field was changed.

## Known risks retained

- The authorization intentionally accepted existing blocked and
  `needs_human_review` records; approval does not mean missing content was repaired.
- The review queue records 274 questions with publication-blocking anomalies,
  661 missing answers, 251 missing explanations, and 95 unknown question types.
- Math2 2021 was not imported because the source is Math3.
- Math2 2022 was not imported; its Q10 option/analysis conflict remains documented.
- The frontend remains on its static content path; it was not switched to API-only.

## Verification

- `mingw32-make NPM=npm.cmd MATH2_SOURCE=D:/work/kaoyan/.tmp/math2-source-req018-verify-clone verify`: complete source, type, API, Web smoke, and production build gate passed using the recorded 770 tracked/5 approved untracked source baseline.
- `npm.cmd run test:api`: 23/23 passed.
- `npm.cmd run typecheck`: passed.
- `npm.cmd run content:approve --workspace @kaoyan/api`: 74/1552 dry-run rolled back.
- `npm.cmd run content:approve --workspace @kaoyan/api -- --commit`: 74/1552 committed.
- `npm.cmd run content:publish-authorized --workspace @kaoyan/api`: 74/1552 dry-run rolled back.
- `npm.cmd run content:publish-authorized --workspace @kaoyan/api -- --commit`: 74/1552 committed.
- `npm.cmd run content:verify-promoted --workspace @kaoyan/api`: counts, stable IDs,
  anonymous 401, authenticated 200, and list/detail checks passed.
- `npm.cmd run content:unpublish-authorized --workspace @kaoyan/api`: exact 74/1552 dry-run rolled back.
- `npm.cmd run content:unpublish-authorized --workspace @kaoyan/api -- --commit`: exact 74/1552 rollback committed.
- `npm.cmd run content:verify-rollback --workspace @kaoyan/api`: staging counts,
  published=0, approvals=1552, stable IDs, anonymous 401, and authenticated
  zero-content responses passed.
- `git diff --check`: passed.
- No connection string, password, CA, token, or other secret was printed or written.

## Source repository and Git boundary

`D:/work/Kaoyan-Math2-Papers` remained read-only at
`fd42c56eed412cce0cb97d6bd688f314c78e542e`; its pre-existing untracked files
were unchanged. Database approval, promotion, and rollback were completed before
Git delivery. The maintainer subsequently authorized commit, PR update, and
deployment; current Git delivery status is tracked in PR 20.
