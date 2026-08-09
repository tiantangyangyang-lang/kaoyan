# Notes: Public Math1 load performance

## Baseline diagnosis

- The current public load is gated by `/api/auth/me` even though eligible Math1 content is
  a static public asset.
- The API is hosted on a free Render plan and can cold start.
- Existing production responses revalidate hashed assets instead of caching them immutably.

## Findings

- `apps/web/src/App.tsx` has two effects. The data effect exits while `authReady` is false;
  the authentication effect sets `authReady` only after `getCurrentUser()` settles.
- Removing the `authReady` gate makes the initial `user === null` render start the public
  Math1 flow immediately. When authentication later resolves to a user, the dependency
  change cleans up the public effect and starts the authenticated API flow. Existing
  `cancelled` checks prevent a late public result from overwriting authenticated state.
- No other code reads `authReady`, so the state can be removed rather than maintained as a
  second representation of authentication status.
- The existing Playwright smoke test can hold `/api/auth/me` open, verify that the 179-item
  public dashboard renders first, then release an authenticated user and verify replacement
  with a one-item API bank.
- The web app is deployed through Cloudflare Pages (`*.pages.dev` is an allowed origin and
  the public directory already contains a Pages `_redirects` file). A public `_headers`
  artifact is therefore the existing-platform mechanism for asset cache policy.
- Vite emits content-hashed files below `/assets/`; applying immutable caching to that path
  does not affect `index.html`, `/data/*.json`, or API responses.

## Regression baseline and implementation result

- Before implementation, the cache test failed because `_headers` had no `/assets/*` rule.
- Before implementation, the delayed-auth browser test timed out after 30 seconds without
  rendering the 179-question public dashboard.
- After removing the gate, the delayed-auth test rendered 179 public questions while the
  auth route was still pending, then rendered the one-question authenticated fixture after
  the auth gate was released.
- The first post-change browser run reached its final console check but failed because the
  temporary dependency junction placed KaTeX fonts outside Vite's allow-list. This is an
  isolated-worktree setup issue; final QA requires local dependencies and a clean console.

## Targeted verification

- Content-access test: passed with 179 public Math1 questions limited to 2018–2025; Math2
  and Math3 legacy static paths remain denial payloads.
- Browser smoke: passed the delayed-auth public render, authenticated replacement, desktop,
  mobile, protected-subject redirect, authenticated Math2, paper, review queue, and export
  checks with no console/page errors after a lockfile-based local dependency install.
- Web typecheck: passed.
- Production web build: passed. `dist/_headers` contains the `/assets/*` immutable rule and
  the emitted JS, CSS, and KaTeX assets have content hashes in their filenames.
- Browser plugin QA at `http://127.0.0.1:5173/`: title and URL matched, meaningful public
  dashboard rendered with 179 questions, no framework overlay appeared, console contained
  no warnings/errors, and navigation into the Math1 bank succeeded.
- A dedicated anonymous page received `401 authentication_required` from `/api/auth/me`
  and still rendered the 179-question public dashboard.
- Full `make verify` did not complete because the external read-only Math2 repository now
  contains 792 files while `test_exact_repository_counts` expects 775. The command stopped
  before reaching this change's typecheck/test/build phases; those phases were run
  independently and passed.

## Publication and Preview deployment

- Commit: `9251015 perf(web): parallelize public Math1 loading`.
- Pull Request: `https://github.com/tiantangyangyang-lang/kaoyan/pull/23`.
- Cloudflare Preview: `https://60638744.kaoyan-ddg.pages.dev` (successful).
- Browser QA on Preview first observed the 179-question public dashboard; after the existing
  login session resolved, the Math1 bank showed all 852 questions. This confirms the public-
  first/authenticated-replacement sequence on the deployed build.
- Preview console contained no application warnings/errors and Math1-bank navigation worked.
- Live Preview headers:
  - `/assets/index-Bors5hCA.js`: `public, max-age=31536000, immutable`.
  - `/`: `public, max-age=0, must-revalidate`.
  - `/data/math1.json`: `public, max-age=0, must-revalidate`.
- Production `https://gongren.xyz` still requires PR merge. Repository policy prohibits
  merging without independent review; PR #23 currently has no review decision.
