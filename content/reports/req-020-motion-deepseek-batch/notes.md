# Notes: Motion samples and DeepSeek batch boundary

## Existing implementation

- Requirement: `docs/requirements/REQ-001-math1-animation-analysis.md`.
- Payload source: `apps/api/src/animationSeeds.ts`.
- Renderer: `apps/web/src/components/math-animation/MathAnimation.tsx` using
  `motion/react`.
- Payloads remain in `kaoyan_question_animations`; they are not bundled into the public
  question bank.
- Anonymous users receive only an availability boolean. Animation payloads require a
  valid login session.
- The Motion bundle loads lazily only after an authenticated payload is received.

## Six deployed pilot records

Production availability was checked on 2026-08-09. All six returned `available=true`:

- `math1-2023-q01` — `asymptote`
- `math1-2023-q12` — `tangent-plane`
- `math1-2023-q17` — `tangent-intercept`
- `math1-2023-q19` — `cylindrical-solid`
- `math1-2025-q04` — `integral-region`
- `math1-2023-q22` — `radial-density`

## External generation boundary

- The existing batch guide limits batches to 10 questions.
- Allowed external work is mechanical payload drafting under a frozen schema and an
  explicit question-to-kind mapping.
- Question selection, mathematical correctness, new animation kinds, authentication,
  database import, and promotion remain local/human-controlled decisions.
- No DeepSeek credential or endpoint has been inspected yet because sample approval is
  the current blocking gate.

## Q04 content diagnosis (2026-08-09)

- `content/final/math1/question-bank.json` and
  `content/review/math1/2025/questions-reviewed.json` contain OCR-damaged placeholders
  for options C and D of `math1-2025-q04`; both are marked
  `source_damaged_ocr_unrecoverable`.
- The deployed `https://gongren.xyz/data/math1.json` currently serves the same damaged
  placeholders. This is a data/provenance problem, not a KaTeX or Motion rendering bug.
- The maintainer-provided source image reads:
  - C: `\int_0^4[\int_{-2}^{-\sqrt{4-y}}f(x,y)\,dx+\int_2^{\sqrt{4-y}}f(x,y)\,dx],dy`
  - D: `2\int_0^4dy\int_{\sqrt{4-y}}^2f(x,y)\,dx`
- Answer A remains consistent with the region shown by the existing explanation and
  animation. No answer, explanation, option, source evidence, database row, or deployed
  asset was modified during diagnosis.

## Three-sample redesign decision (2026-08-11)

- REQ-022 and REQ-023 have repaired q04 options C/D and its explanation on main.
- The maintainer rejected the current Motion quality for the three review samples.
- Fixed redesign scope: `math1-2023-q01`, `math1-2025-q04`, and `math1-2023-q22`.
- Current renderer weakness: each scene is mostly a static drawing; q04 step 2 says
  “fixed y” while the stage still draws vertical slices, and q22 never visualizes the
  final one-dimensional density `f_Z(z)=2z`.
- Required visual progression:
  - q01: slope limit -> offset limit -> final oblique asymptote;
  - q04: vertical source region -> horizontal two-piece slice -> correct two intervals;
  - q22: radial density -> cumulative disk of radius `sqrt(z)` -> triangular density
    graph `f_Z(z)=2z` on `[0,1]`.

## Three-sample redesign verification (2026-08-11)

- `math1-2023-q01` now renders the direction ratio `y/x -> 1`, the offset
  `y-x -> 1/e`, and the final answer B as three distinct states.
- `math1-2025-q04` now replaces vertical source slices with a horizontal slice whose
  excluded middle is dashed, then labels the two correct intervals and answer A.
- `math1-2023-q22` now renders outward-increasing radial density, the cumulative disk
  `r <= sqrt(z)` with `F_Z(z)=z^2`, and the final triangular graph `f_Z(z)=2z`.
- Authenticated local browser QA exercised every step button for all three samples. The
  final run had no browser console errors or warnings.
- The replacement workflow locks and validates exactly the three existing active Math1
  rows, checks their reviewed pre-change SHA-256 payload hashes, uses parameterized SQL,
  and rolls the whole transaction back on drift or partial scope.
- No production database was contacted and no DeepSeek request was made.

### Commands and results

- `npm.cmd run typecheck --workspace @kaoyan/api` — passed.
- `npm.cmd run typecheck --workspace @kaoyan/web` — passed.
- `npm.cmd run test --workspace @kaoyan/api` — 67/67 passed after adding raw-payload
  drift and partial-update rollback coverage.
- `npm.cmd run build --workspace @kaoyan/api` — passed.
- `npm.cmd run build --workspace @kaoyan/web` — passed; Motion remains a separate lazy
  chunk.
- `npm.cmd run test:smoke:ci --workspace @kaoyan/web` — passed, including authenticated
  animation loading, Q04 step switching, and reduced-motion mode.
- Local authenticated browser QA — every step of q01, q04, and q22 rendered and switched;
  the final run produced no console errors or warnings.
- `git diff --check` — passed.
- `mingw32-make NPM=npm.cmd verify` — blocked only by the unrelated Math2 inventory
  drift (expected 775 files, observed 792).
- Independent code review initially caught raw-payload hash normalization and the Q04
  Bézier cusp. Both were fixed; drift tests now cover unknown fields and trailing
  whitespace, the parabola matches the vertical-slice equation exactly, and the reviewer
  approved the corrected diff with no remaining blocking or important findings.

## Website performance diagnosis (2026-08-09)

- `apps/web/src/App.tsx` waits for `/api/auth/me` before starting public subject and Math1
  data loading. Anonymous users therefore pay a serial waterfall: application JavaScript,
  authentication request, `subjects.json`, then `math1.json`.
- `render.yaml` uses the free API plan. A sleeping API can make the authentication request
  slow, and that request currently blocks otherwise-public Math1 content.
- Warm compressed measurements were approximately: root 0.32 s, `/api/auth/me` 0.45 s,
  `math1.json` 0.52 s (90 KB transferred), main JavaScript 0.39 s (73 KB), CSS 0.31 s
  (14 KB), and KaTeX JavaScript 0.37 s (77 KB). The serial dependency is more important
  than the bundle size.
- Root, data, and hashed assets currently use `Cache-Control: public, max-age=0,
  must-revalidate` and Cloudflare reports dynamic delivery, so repeat visits still
  revalidate assets.
- Recommended repair order: load public subjects/Math1 in parallel with authentication;
  give hashed assets long immutable caching; then decide whether API cold starts justify
  paid hosting or a keep-warm strategy. None of these changes was implemented in this
  diagnostic pass.
