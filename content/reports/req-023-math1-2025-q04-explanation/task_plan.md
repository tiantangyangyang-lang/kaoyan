# REQ-023 Task Plan

## Goal

Replace the damaged Q04 explanation in source artifacts and provide a guarded v2-to-v3 production correction with complete verification.

## Phases

- [x] P0 — Create REQ-023 and an isolated branch/worktree from current `origin/main`.
- [x] P0 — Confirm the source, database field, frontend rendering behavior, and exact corruption markers.
- [x] P0 — Correct canonical/review content and regenerate the public Math1 artifact.
- [x] P0 — Implement and test a guarded v2-to-v3 explanation-only transaction.
- [x] P0 — Run database dry-run, content/access verification, targeted tests, build/type checks, and diff/security checks.
- [x] P1 — Prepare a reviewable handoff; do not mutate production or publish without a traceable commit and review.

## Decisions

- Remove the source image reference instead of adding Markdown image support; the region is fully expressible in text and LaTeX.
- Preserve `explanationStatus: candidate_from_solutions` because this is a cleanup of the existing sourced solution, not a new independent source.
- Preserve Q04 stem, options, answer, animation, knowledge points, and approval status.

## Errors encountered

- The first combined semantic/KaTeX verification command was rejected by PowerShell because `$` in the inline LaTeX regex was parsed by the shell. No project test ran in that failed call; resolution: move content verification into a checked-in Node script with no shell quoting dependency.
- Full `make verify` reached the unrelated Math2 external inventory test and stopped because the live source has 792 files while the fixture expects 775. The two generated Math2 artifacts were restored exactly.
- The first sandboxed restore attempt could not create the worktree index lock; rerunning the same exact two-file restore with approved Git access succeeded.

## Status

Implementation, independent review, and the production v2-to-v3 transaction are complete. PR #25 is ready for final deployment check and merge.
