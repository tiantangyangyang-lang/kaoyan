# REQ-025 Task Plan

## Goal

Provide a browser-based single-question editor protected by account email and an
independent non-persisted administrator key, while reusing audited overrides.

## Phases

- [x] P0 — Create isolated worktree, branch, requirement, and durable plan.
- [x] P0 — Inspect current auth, content override service, routes, and UI navigation.
- [x] P0 — Add administrator configuration and constant-time two-gate middleware.
- [x] P0 — Add validated admin read/preview/commit/revert store and API paths.
- [x] P0 — Add the memory-only key UI, question form, preview, history, and revert.
- [x] P0 — Add security, transaction, API, and browser regression tests.
- [x] P0 — Run targeted and repository verification, secret scan, and full diff review.
- [x] P1 — Prepare authorized commit/PR/deployment after configuration is available.

## Decisions

- Administrator identity and key digest are environment-only; no personal email
  or raw/digest key is committed.
- Use the existing override service rather than direct SQL mutation.
- Treat this as two independent application gates, not standards-based MFA.

## Errors encountered

- The first browser selector treated the exact accessible label for the
  explanation textarea too narrowly. The test now selects the second wide
  editor textarea and passed the full smoke flow.
- Authenticated smoke mocks initially returned 404 for the new non-blocking
  eligibility request. Each authenticated fixture now returns
  `{ "eligible": false }` unless it is the administrator scenario.
- Repository `make verify` stopped because the external Math2 source now has
  792 files while its frozen test expects 775. The generated inventory and
  KaTeX report changes were restored; the feature-specific gates pass.
- Independent review requested two P1 fixes: strict base JSON validation and a
  way to revert beyond the 50 displayed history rows. Both were implemented and
  covered before requesting re-review.
- Re-review required exact canonical A-D validation and smaller modules. The
  shared option schema, 51-row history test, focused API store/validation
  modules, React hook/components, and feature CSS were added before final review.

## Status

Implementation and feature-specific verification are complete. The maintainer
authorized commit, push, PR, independent review, merge, deployment, and use of
the separately generated 18-character administrator key. Final pre-deployment
independent review: APPROVE, with no P0 or P1 findings.
