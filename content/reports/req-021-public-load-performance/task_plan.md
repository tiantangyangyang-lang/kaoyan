# Task Plan: Public Math1 load performance

## Goal

Load public Math1 independently of authentication latency and cache hashed frontend assets
immutably without changing access rules or content.

## Phases

- [x] Phase 1: Create an isolated requirement, branch, worktree, and persistent artifacts.
- [x] Phase 2: Inspect the application boot sequence, tests, and deployment header support.
- [x] Phase 3: Add failing targeted tests for parallel public loading and cache headers.
- [x] Phase 4: Implement the smallest race-safe loading and cache configuration changes.
- [x] Phase 5: Run targeted tests, rendered browser QA, and the repository verification gate.
- [x] Phase 6: Review the full diff and prepare a handoff without committing or pushing.
- [ ] Phase 7: Commit, push, open the PR, review checks, and complete the authorized
  deployment path.

## Key questions

1. Which state transition currently gates public data on authentication?
2. How does the app replace public data with authenticated API content without stale races?
3. Which static-header mechanism is supported by the current Render/Vite deployment?
4. What existing tests can prove request ordering without brittle timing assertions?

## Decisions made

- Use `origin/main` as the clean base at `ea00a44`.
- Keep mutable HTML and JSON on their current revalidation policy; apply immutable caching
  only to Vite content-hashed assets.
- Do not touch Q04 content, database state, Motion generation, or public-year policy.

## Errors encountered

- Initial worktree creation could not write the Git ref inside the sandbox. The same scoped
  `git worktree add` command succeeded after permission approval.
- A requested `.github/workflows/ci.yml` inspection failed because this repository has no
  file at that path. The root Makefile and package scripts remain the verification source.
- The first direct content-access test stopped before the new assertion because a fresh
  worktree had not generated `apps/web/public/data/math1.json`. Run the existing
  `sync:content` command before repeating the baseline test.
- The first browser regression run could not start Vite because the isolated worktree has
  no local `node_modules`. Reuse the root workspace's already-installed dependencies through
  an ignored directory junction; do not download packages or change the lockfile.
- With the junction, both new loading assertions completed, but Vite rejected KaTeX font
  files resolved outside its serving allow-list and the smoke test correctly failed on 403
  console errors. Replace the junction with a worktree-local lockfile install before the
  final browser run.
- A foreground Vite command reached ready state but the shell wrapper timed out after 10
  seconds because the server is intentionally long-running. It was restarted as a hidden
  scoped process for Browser QA and stopped afterward.
- While stopping the QA server, process-tree enumeration returned an access-denied warning.
  The known root process was stopped directly and port 5173 was verified closed.
- Modeling `401` on every anonymous smoke page made Chromium report the expected HTTP status
  as generic console errors. Coverage was split into a dedicated 401 fallback page, while
  the general pages retain strict unexpected-console-error checks.

## Status

**Currently in Phase 7** - commit `9251015` is pushed, PR #23 is open, and Cloudflare
Preview deployment passed. Production merge/deployment is waiting for the independent PR
review required by repository policy.
