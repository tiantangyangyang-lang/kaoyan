# Notes: Probability animation redesign

## Confirmed target

- Question: `math1-2023-q22`.
- Existing animation kind: `radial-density`.
- Visible weakness: the current scene only communicates that density increases
  with radius and does not cover covariance or non-independence.

## Findings

- Only `math1-2023-q22` uses the `radial-density` scene, so changing the scene is
  isolated from the other five animation samples.
- The existing q22 payload only illustrated radial density, its CDF, and its
  derivative. It omitted the first two requested conclusions.
- The existing `animation-sample-replacement` workflow is intentionally fixed to
  the earlier q01/q04/q22 payload set. A new q22-only replacement path is needed
  to keep database drift detection meaningful.
- The new replacement locks exactly one active Math1 row, hashes the raw stored
  JSON before schema normalization, uses a parameterized update, checks
  `affectedRows === 1`, and rolls back on dry-run or any error.
- First visual render found clipped formulas in steps 1 and 2. The covariance
  conclusion was split into two centered lines and all counterexample labels
  were moved inside the SVG view box before the final render passed inspection.
- Independent review identified a rollout mismatch while old and new payloads
  shared the same renderer key. The fix adds an optional validated scene variant
  and retains the legacy renderer. Browser coverage now exercises both the
  pre-transaction old payload and the post-transaction new payload.
- The non-independence scene uses a positive-area rectangle `A×B` around
  `(3/4,3/4)`, not a single pointwise density mismatch. Positive and negative
  `xy` labels also use dark text with a white outline for contrast.

## Visual evidence

- `apps/web/temp/web-qa/animation-q22-covariance.png`
- `apps/web/temp/web-qa/animation-q22-not-independent.png`
- `apps/web/temp/web-qa/animation-q22-z-density.png`
- `apps/web/temp/web-qa/animation-q22-legacy-compatible.png`

These generated screenshots are test artifacts and are not tracked source files.

## Production boundary

- Dry-run command after deployment: `make probability-animation-replace-dry-run NPM=npm.cmd`
- Commit command only after a successful dry-run and explicit approval:
  `make probability-animation-replace-commit NPM=npm.cmd`
- Neither command was run during local implementation. The command fails closed
  if the current production payload differs from the reviewed old payload.
- Deploying the compatible frontend before the dry-run is safe: the existing
  payload has no new variant and therefore continues to use the legacy scene.
