# Verification Report: REQ-027

## Result

Local implementation passes automated, transaction, build, and visual checks.
Production state is unchanged.

## Checks

- `npm.cmd run typecheck --workspace @kaoyan/web` — passed.
- `npm.cmd run typecheck --workspace @kaoyan/api` — passed.
- `node --import tsx --test tests/probability-animation-replacement.test.ts`
  from `apps/api` — 6/6 passed.
- `npm.cmd run test --workspace @kaoyan/api` — 73/73 passed after updating the
  q22 seed expectation to the new three-step progression.
- `npm.cmd run test:smoke:ci --workspace @kaoyan/web` — passed, including all
  three q22 steps under reduced motion, the pre-migration legacy q22 payload,
  and the existing authentication/content access scenarios. One earlier run
  hit a Vite startup `ERR_CONNECTION_REFUSED`; the immediate and final reruns
  passed.
- `npm.cmd run build --workspace @kaoyan/web` — passed, 470 modules transformed.
- `npm.cmd run build --workspace @kaoyan/api` — passed.
- `git diff --check` — passed; only Git's existing LF-to-CRLF checkout warnings
  were emitted.
- Visual inspection — passed after correcting clipped labels in the first two
  screenshots, scaling the `(3/4,3/4)` point consistently, adding the
  positive-area `A×B` neighborhood, and increasing `xy` label contrast.

## Review fixes

- HIGH rollout mismatch: fixed with `probability-three-results-v1` and a legacy
  fallback renderer; browser coverage verifies both states.
- Pointwise non-independence argument: replaced by a positive-area rectangle
  event with zero joint probability and positive marginal probability product.
- Low-contrast `+xy` labels: replaced by dark semantic labels with a white
  outline while retaining explicit signs.
- Independent re-review: approved with no remaining blocker or important
  finding. The safe rollout order is explicitly code deployment first, then
  production dry-run and transaction.

## Database safety coverage

- Dry-run executes the guarded update and rolls back.
- Commit mode commits exactly one q22 row.
- Unknown-field and trailing-whitespace drift both refuse the update.
- Missing row and `affectedRows !== 1` both roll back.
- No live `DATABASE_URL` was loaded and no production database command was run.

## Pre-PR rerun (2026-08-18)

- Remote sync: branch and `origin/main` both at `e9dd3ca`; ahead/behind `0/0`
  before commit.
- Web/API typechecks: passed.
- API tests: 73/73 passed.
- Web smoke: passed, including legacy and new q22 payload renderers.
- Web/API production builds: passed; no dependency changes.
- Secret-pattern scan and `git diff --check`: passed.
- Root `make verify`: stopped in an unrelated existing Math2 inventory test
  because the read-only source directory now contains 792 files while the old
  fixture expects 775. The two generated unrelated audit files were restored;
  no Math2 artifact is included in REQ-027.

## Remaining external steps

Commit, PR review, merge, deployment, production dry-run, and the approved
production transaction remain intentionally unperformed pending user direction.
