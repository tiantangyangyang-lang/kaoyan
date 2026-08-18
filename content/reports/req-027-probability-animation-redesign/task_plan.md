# Task Plan: Probability animation redesign

## Goal

Replace the weak radial-density animation for `math1-2023-q22` with a verified
three-step visual derivation while preserving content, authentication, and the
controlled database replacement boundary.

## Phases

- [x] Phase 1: Create an isolated worktree, requirement, and durable plan.
- [x] Phase 2: Inspect the current payload, scene renderer, tests, and production
  replacement workflow.
- [x] Phase 3: Design and implement the three-step mathematical visualization.
- [x] Phase 4: Add targeted regression coverage and render visual evidence.
- [x] Phase 5: Run verification and document deployment/replacement steps.
- [x] Phase 6: Re-sync origin and rerun the pre-PR verification gate.
- [ ] Phase 7: Stage the exact requirement scope, commit, push, and open the PR.
- [ ] Phase 8: Review the final PR diff, merge it, and confirm code deployment.
- [ ] Phase 9: Run the production q22 dry-run, commit the guarded transaction,
  and verify the stored payload and live result.

## Key questions

1. Can the existing `radial-density` kind represent all three steps, or is a
   backward-compatible scene-specific implementation needed?
2. Which database row and expected hash guard the production replacement?
3. How can the non-independence counterexample remain visually obvious on small
   screens and in reduced-motion mode?

## Decisions made

- Use branch `codex/req-027-probability-animation-redesign` from current
  `origin/main` (`e9dd3ca`).
- Limit the requirement to `math1-2023-q22`; do not edit the static question or
  explanation.
- Keep the existing `radial-density` payload kind and replace only its q22 scene
  and seed, so the schema and lazy-loading boundary stay unchanged.
- Use a small rectangle `A×B` around `(3/4,3/4)` as the non-independence
  counterexample. It has positive marginal probability product but zero joint
  probability because `x²+y²=9/8>1` leaves a whole neighborhood outside the
  disk; a mismatch at only one point would not be rigorous for densities.
- Add optional variant `probability-three-results-v1`. Payloads without it keep
  the legacy radial renderer, so the documented code-first deployment followed
  by the database transaction stays consistent, and a refused transaction
  leaves a consistent old experience.
- Add a one-row, hash-guarded, parameterized transaction because the existing
  three-row replacement command is intentionally fixed to the previous sample
  payloads and cannot safely be reused for a later q22-only change.

## Errors encountered

- The first worktree creation attempt could not create a branch ref under the
  sandbox. The same scoped `git worktree add` succeeded after approval.
- One final smoke run reached the page before Vite had opened port 5173 and
  failed with `ERR_CONNECTION_REFUSED`; the immediate rerun and subsequent
  compatibility run passed in full.
- Initial `gh` and `git fetch` checks were blocked by the workspace sandbox from
  reading the GitHub CLI config and worktree `FETCH_HEAD`; repeat them with the
  narrowly scoped approved permissions before publishing.

## Status

**Currently in Phase 7** - origin/main is current and all REQ-027-specific
typechecks, 73 API tests, browser smoke scenarios, builds, secret scan, and diff
checks pass. Staging the exact reviewed scope for commit and PR publication.
