# REQ-027: Probability animation redesign

## Problem and user value

The dynamic explanation for `math1-2023-q22` currently shows only concentric
radial density bands and a short CDF statement. It does not visually explain the
three requested results: zero covariance, dependence despite zero covariance,
and the transformation from the disk radius to the density of
`Z = X^2 + Y^2`.

The redesigned explanation should let a learner see why each conclusion follows
instead of repeating the final formula already present in the static solution.

## In scope

- Redesign the dynamic explanation for `math1-2023-q22` only.
- Use three explicit steps for covariance, non-independence, and the distribution
  of `Z`.
- Keep the visual and mathematical statements consistent with the verified
  static solution.
- Update the supported animation seed/replacement workflow and its targeted
  tests or visual fixtures.
- Produce a reviewed production replacement plan if database promotion is
  needed.

## Out of scope

- Changes to the question stem, answer, options, static explanation, or source
  evidence.
- Changes to other animation samples or bulk animation generation.
- Authentication or public-content policy changes.
- Direct ad-hoc SQL updates that bypass the existing controlled replacement
  workflow.

## Acceptance criteria

1. Step 1 visibly demonstrates symmetry and the cancellation leading to
   `E(X)=E(Y)=E(XY)=0`, hence `Cov(X,Y)=0`.
2. Step 2 visibly demonstrates non-independence using a positive-area rectangle
   around `(3/4, 3/4)` that lies inside both marginal supports but outside the
   unit disk; a single pointwise density mismatch is not treated as sufficient.
3. Step 3 maps `Z=X^2+Y^2` to `r^2`, grows the disk to radius `sqrt(z)`, and shows
   the cumulative probability calculation `F_Z(z)=z^2`, followed by
   `f_Z(z)=2z` for `0<z<1`.
4. Labels, formulas, color encoding, and motion remain legible on desktop and
   reduced-motion rendering.
5. The animation remains login-only and the availability/authentication behavior
   is unchanged.
6. Targeted typechecks, tests, production build, visual inspection, and
   `git diff --check` pass.
7. A deployed frontend remains compatible with the pre-replacement q22 payload;
   old copy renders the legacy radial scene until the versioned replacement is
   committed, preventing copy/scene mismatch during rollout or a refused update.

## Constraints

- **Data:** Do not modify question content or fabricate source evidence. Any
  animation database replacement must use the existing validated workflow with
  drift detection and transaction rollback.
- **Authentication:** Do not change `requireUser` or anonymous availability
  behavior.
- **Performance:** Do not add a new runtime dependency or materially increase the
  initial application bundle; keep animation code lazy-loaded.
- **Compatibility:** Preserve the existing animation payload schema unless a
  minimal backward-compatible extension is demonstrably required. The new q22
  scene must use an optional validated variant, while payloads without that
  variant keep the legacy renderer.

## Verification commands

```powershell
npm.cmd run typecheck --workspace @kaoyan/web
npm.cmd run test:smoke:ci --workspace @kaoyan/web
npm.cmd run test --workspace @kaoyan/api
npm.cmd run build --workspace @kaoyan/web
git diff --check
```
