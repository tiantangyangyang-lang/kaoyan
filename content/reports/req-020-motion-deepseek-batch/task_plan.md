# Task Plan: Motion sample review and DeepSeek batch generation

## Goal

Redesign the three rejected Motion samples as question-specific explanations, validate
them locally, and only then decide whether the style is suitable for bounded DeepSeek
draft generation without changing canonical question data.

## Phases

- [x] Phase 1: Audit the existing Motion implementation, payload schema, six pilot seeds,
  and production availability.
- [x] Phase 2: Select three representative review samples and document how to inspect
  them.
- [x] Phase 3: Redesign the q01, q04, and q22 scenes and payload copy while preserving
  the other three samples.
- [x] Phase 4: Add fixed-scope dry-run/transactional replacement support and tests.
- [x] Phase 5: Run type, API, build, smoke, reduced-motion, and rendered visual checks.
- [x] Phase 6: Present the three redesigned samples for maintainer approval.
- [ ] Phase 7: Freeze the approved style rubric, question IDs, and animation-kind mapping.
- [ ] Phase 8: Implement a DeepSeek dry-run generator that emits staging drafts only,
  with a maximum of 10 questions per batch.
- [ ] Phase 9: Validate schema, canonical IDs, duplicates, mathematical consistency, and
  external-data minimization; prepare a human-review report.
- [ ] Phase 10: After separate approval, use the controlled replacement/import workflow and
  verify authenticated/anonymous behavior.

## Key questions

1. Do the existing samples communicate the mathematical idea clearly enough to become
   the batch style baseline?
2. Which of the six frozen animation kinds should be reused, and for which maintainer-
   selected questions?
3. Which DeepSeek endpoint/model and credential source are available without exposing
   secrets?
4. What local validator/import command already exists, and what minimal addition is
   required for staging-only batch drafts?

## Decisions made

- The maintainer rejected the original three-sample style; regenerate the selected three
  locally before any DeepSeek batch call.
- Review three contrasting kinds first: `asymptote`, `integral-region`, and
  `radial-density`.
- Treat those kinds as question-specific scenes for the current samples; do not add a
  seventh kind or change the other three scene branches.
- DeepSeek output will be an untrusted staging draft, never a direct production write.
- Keep the existing 10-question maximum per batch.
- Do not create new animation kinds or let the external model choose mathematical
  conclusions.

## Errors encountered

- The root checkout was 17 commits behind `origin/main` and contained the user's
  untracked `.claude/` directory. A fresh isolated worktree was created from
  `origin/main`; the root checkout and `.claude/` were left untouched.
- Live browser inspection of `https://gongren.xyz` timed out twice while waiting for the
  page/network state. Read-only HTTP timings and repository control-flow inspection were
  used for the performance diagnosis instead; interactive browser behavior remains to be
  rechecked after a fix.
- The root checkout later fell 34 commits behind `origin/main`; the existing REQ-020
  worktree was fast-forwarded to `1c44c98` without touching the root `.claude/` files.
- Full `mingw32-make NPM=npm.cmd verify` reached the existing Math2 source inventory
  test, which still expects 775 files while the read-only source directory now contains
  792. The two generated Math2 files were restored; task-specific API, build, smoke, and
  rendered checks were then run independently and passed.

## Maintainer feedback received

- On 2026-08-09, the maintainer rejected `math1-2025-q04` while its C/D options were
  damaged. REQ-022 and REQ-023 have since corrected the options and explanation on main.
- On 2026-08-11, the maintainer rejected the overall Motion quality and requested new
  versions of q01, q04, and q22 to replace the current three review samples.
- DeepSeek batch generation remains blocked until the three redesigns are reviewed.

## Status

**Release in progress** - the maintainer authorized commit, push, PR, reviewed merge,
deployment, production dry-run, and transactional replacement for exactly q01, q04, and
q22. DeepSeek batch generation remains outside this release.

## Authorized release checklist (2026-08-11)

- [ ] Re-run final scoped verification and inspect the complete diff.
- [ ] Stage only REQ-020 files and create one Conventional Commit.
- [ ] Push `codex/req-020-motion-deepseek-batch` and open one ready PR against `main`.
- [ ] Independently review `origin/main...HEAD` and wait for required checks.
- [ ] Merge the reviewed PR and verify the Render production deployment.
- [ ] Load `D:\work\kaoyan\.env` into the command process without printing values.
- [ ] Run the fixed three-ID production replacement in dry-run mode.
- [ ] If and only if dry-run matches all three reviewed old hashes, commit the transaction.
- [ ] Verify the three production payloads plus authenticated detail/anonymous denial.
