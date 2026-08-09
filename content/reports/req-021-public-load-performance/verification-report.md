# Verification report: Public Math1 load performance

## Result

The performance change is implemented and passes targeted functional, access-control,
type, test, build, and rendered-browser checks. It is ready for commit, PR review, and the
repository's authorized deployment path.

## Requirement

- `docs/requirements/REQ-021-public-load-performance.md`
- Branch: `codex/req-021-public-load-performance`
- Base: `origin/main` at `ea00a44`

## Product changes

- `apps/web/src/App.tsx`: public Math1 loading no longer waits for authentication state;
  an authenticated result still replaces the public bank through the existing effect
  cleanup and user dependency.
- `apps/web/public/_headers`: `/assets/*` receives `public, max-age=31536000, immutable`.
  HTML, `/data/*.json`, and API responses do not receive this rule.
- `apps/web/tests/smoke.mjs`: covers pending authentication, authenticated replacement,
  and anonymous `401` fallback.
- `apps/web/tests/content-access.mjs`: verifies the immutable asset rule and rejects its
  application to mutable HTML/data paths.

## Verification

| Check | Result |
| --- | --- |
| `node apps/web/tests/content-access.mjs` | Passed: 179 public Math1 questions, 2018–2025 only; Math2/Math3 denial artifacts preserved |
| `node apps/web/tests/run-smoke.mjs` | Passed: parallel public load, authenticated replacement, protected redirects, authenticated content, desktop/mobile interactions, no unexpected console/page errors |
| `npm.cmd run typecheck --workspace @kaoyan/web` | Passed |
| `mingw32-make NPM=npm.cmd typecheck` | Passed for Web and API |
| `mingw32-make NPM=npm.cmd test` | Passed: API 24/24 and complete web smoke |
| `mingw32-make NPM=npm.cmd build` | Passed for Web and API |
| Production artifact inspection | Passed: `dist/_headers` contains the asset rule; emitted assets have content hashes |
| Browser QA at `http://127.0.0.1:5173/` | Passed: correct title/URL, meaningful 179-question dashboard, no overlay, zero warnings/errors, Math1-bank navigation works |
| `git diff --check` | Passed |

## Known external blocker

`mingw32-make NPM=npm.cmd verify` stops in an unrelated Math2 inventory test because
`D:/work/Kaoyan-Math2-Papers` currently contains 792 files while the frozen test expects
775. The generated inventory and KaTeX report differences were restored; they are not part
of this requirement.

## Publication status

- Commit `9251015` is pushed to `codex/req-021-public-load-performance`.
- PR #23: `https://github.com/tiantangyangyang-lang/kaoyan/pull/23`.
- Cloudflare Pages check passed and deployed Preview
  `https://60638744.kaoyan-ddg.pages.dev`.
- Deployed Preview verified the intended sequence: 179 public questions render first, then
  an existing authenticated session replaces the bank with all 852 Math1 questions.
- Cloudflare serves the hashed JavaScript asset with one-year immutable caching; `/` and
  `/data/math1.json` retain `max-age=0, must-revalidate`.
- Production remains pending because repository policy requires independent PR review before
  merge; PR #23 currently has no review decision.

## Security and data boundary

- No credentials, connection strings, cookies, or secrets were added.
- No database, canonical question, staged question, promoted content, answer, explanation,
  option, animation, or public-year policy changed.
- Anonymous access remains Math1 2018–2025 (179 questions). Math1 before 2018, Math2, and
  Math3 remain login-only.

## Untouched user files

- Root checkout `D:/work/kaoyan` and its untracked `.claude/` directory.
- REQ-020 Motion/DeepSeek worktree and reports.
- Existing content and database promotion worktrees.
