# Human Review Checklist: Math1 2000 (Post MD-Finalization)

> Updated: 2026-06-20 | Run: 20260620-150305-cc-math1-md-finalize-year-2000
> Status: All 23 questions marked `needs_human_review`
> MD-Finalization: Applied — 5 answers extracted, 1 formula fixed, 1 anomaly reclassified

---

## P0 — Must Fix Before Approval

### 1. Answer Correctness Verification (all 23 questions)

Each question's `answerCandidate` must be verified by a human mathematician. AI must not judge math correctness per spec §6.

**Answers now populated (extracted from solution markdown during finalization):**

| # | Question ID | Answer | Verification Needed |
|---|------------|--------|---------------------|
| 1 | math1-2000-s01-q01 | π/4 | Confirm integral evaluation correct |
| 2 | math1-2000-s01-q02 | (x-1)/1 = (y+2)/(-4) = (z-2)/6 | Confirm normal vector and line equation |
| 3 | math1-2000-s01-q03 | y = C₁/x² + C₂ | Confirm ODE solution. Note: parens fixed. |
| 4 | math1-2000-s01-q04 | a = -1 | Confirm |A|=0 excludes a=3 logically |
| 5 | math1-2000-s01-q05 | 2/3 | Confirm probability equation solution |
| 6 | math1-2000-s02-q01 | A | Confirm monotonicity direction |
| 7 | math1-2000-s02-q02 | C | Confirm surface integral symmetry |
| 8 | math1-2000-s02-q03 | D | Confirm series convergence logic |
| 9 | math1-2000-s02-q04 | D | Confirm matrix equivalence ⇔ linear independence |
| 10 | math1-2000-s02-q05 | B | Confirm Cov(X+Y, X-Y) = D(X)-D(Y) |
| 11 | math1-2000-s03 | 1 | Confirm left/right limit calculation |
| 12 | math1-2000-s04 | ∂²z/∂x∂y expression | Confirm chain rule steps (extracted from explanation) |
| 13 | math1-2000-s05 | π | Confirm Green's theorem with singularity handling |
| 14 | math1-2000-s06 | f(x)=eˣ(eˣ-1)/x | Confirm Gauss formula → ODE → solution |
| 15 | math1-2000-s07 | (-3,3), converges at x=-3, diverges at x=3 | Confirm radius + endpoint analysis |
| 16 | math1-2000-s08 | (0,0,-R/4) | Confirm triple integral for center of mass |
| 17 | math1-2000-s09 | (proof) | Confirm Rolle's theorem + contradiction argument |
| 18 | math1-2000-s10 | Matrix B (4×4) | Confirm |A*|=|A|³→|A|=2 logic |
| 19 | math1-2000-s11-q01 | System + matrix A | Confirm derivation from problem text |
| 20 | math1-2000-s11-q02 | λ₁=1, λ₂=1/2 | Confirm Aη₁=η₁, Aη₂=½η₂ (using Q1's A) |
| 21 | math1-2000-s11-q03 | Vector expression | Confirm Aⁿ calculation and substitution |
| 22 | math1-2000-s12 | E(X)=1/p, D(X)=(1-p)/p² | Confirm geometric distribution |
| 23 | math1-2000-s13 | θ̂=min{xᵢ} | Confirm monotone likelihood → order statistic |

### 2. OCR Noise Verification (1 item)

- **ANO-2000-006**: Source `solutions/2000年解析.md` line 295: `9 2 10 5 1 3 10 5 5`. This is a residual OCR artifact from failed matrix rendering. The correct matrix A = [[9/10, 2/5], [1/10, 3/5]] is already in staging data. **Verify against PDF** that matrix coefficients are correct.

---

## P1 — Should Fix Before Approval

### 3. Image Dependencies (2 items)

- **ANO-2000-008**: Image `ba84f2ee...jpg` (一(1)题图) — belongs to Q1 geometric method. Currently between Q2 sections in source markdown. Re-associate with Q1 in final question bank.
- **ANO-2000-009**: Image `64aa7798...jpg` (三(13)题图) — contour L and ellipse L0 diagram for Q5. Verify image content matches solution description.

### 4. PDF Visual Confirmation

Key pages to verify against `solutions/2000年解析/a2fe840b-572d-41b4-bb28-db4747a419bf_origin.pdf`:
- Q1 method 2 diagram (ba84f2ee...jpg)
- Q5 contour diagram (64aa7798...jpg)
- Q11 source line 295 OCR artifact
- All complex multi-step solutions (Q3, Q5, Q6, Q8, Q10)

---

## P2 — Nice to Have

### 5. Option Label Normalization

- **ANO-2000-010**: Section 2 Q5 option A uses `\mathrm` formatting. Normalize for consistency with other options.

---

## Summary

| Priority | Items | Post-Finalization Status |
|----------|-------|--------------------------|
| P0 | Answer correctness (×23) | All answers populated; needs human math verification |
| P0 | OCR noise (×1) | Source-only, staging correct; needs PDF confirmation |
| P1 | Image dependencies (×2) | Images exist in source mirror; needs visual confirmation |
| P1 | PDF visual (×4 pages) | PDF exists in source mirror; needs manual review |
| P2 | Formatting (×1) | Cosmetic; no impact on correctness |
