# REQ-018: Login-required content approval and promotion

## Problem and user value

Math1, Math2, and Math3 content is present in database staging but cannot be used through the production content API. Promotion must be explicit and auditable, and promoted question and paper content must be visible only to authenticated users.

## In scope

- Require a valid session for published Math1, Math2, and Math3 question list/detail APIs.
- Remove public caching semantics from authenticated content responses.
- Add a controlled approval command that changes only staging review/finalization status fields and records the pre-existing risks; it must not alter stems, answers, explanations, options, formulas, stable IDs, or source evidence.
- Approve and promote the maintainer-authorized 74 staging batches: Math1 38/852, Math2 26/522, Math3 10/178.
- Preserve an audit report with counts, affected batches, status transitions, and known risks.
- Keep the frontend on its current static-content path.

## Out of scope

- Inventing, repairing, or rewriting any question content or source evidence.
- Importing Math2 2021 or 2022.
- Switching the frontend to API-only delivery.
- Merging without reviewing the complete PR diff and passing the repository verification gate.

## Acceptance criteria

- Anonymous list/detail requests for all three subjects return `401 authentication_required`.
- An authenticated user can list and read promoted content.
- Database published counts are Math1 852, Math2 522, Math3 178, total 1552.
- Exactly 74 target batches are approved and promoted; no target stable ID is duplicated.
- Approval is limited to staging batches and status columns, is transactional, validates expected counts, and emits an audit-safe result without secrets.
- Existing blocker and `needs_human_review` risks remain documented.

## Constraints

- Data: preserve all content and provenance fields byte-for-byte; only `review_status`, `finalization_status`, batch lifecycle status, and publication timestamps may change.
- Authentication: session cookie validation must run before content lookup; invalid/missing sessions return 401.
- Performance: retain bounded pagination and the existing content rate limiter; authenticated responses must use private/no-store caching.
- Compatibility: no static frontend delivery change; content subject and stable-ID contracts remain unchanged.
- Secrets: load `DATABASE_URL` from `D:/work/kaoyan/.env` into a single process and never print it.

## Verification commands

```powershell
make verify NPM=npm.cmd
npm.cmd run test:api
npm.cmd run typecheck
git diff --check
```

Live database verification additionally checks batches, approved/published question counts, per-subject totals, and duplicate stable IDs without printing connection configuration.

## Maintainer-requested final disposition

After the acceptance criteria had been exercised, the maintainer requested a
rollback because the local authentication fix had not been deployed and the
deployed endpoint could not be independently verified. The controlled rollback
restores only the 74 authorized batch rows to `staging` and clears
`published_at`; all 1552 approvals and known-risk audit states remain intact.
The final required state is therefore 74 staging batches, 0 published target
batches, and no authenticated or anonymous access to those staged questions.

The initial delivery boundary prohibited commit, push, PR updates, and
deployment. On 2026-07-19 the maintainer explicitly authorized all four after
the rollback had been verified. This authorization changes only Git delivery
and deployment; it does not re-authorize promotion or change the final staging
database state.
