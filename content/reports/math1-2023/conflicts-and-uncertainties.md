# Math1 2023 — Markdown-First Finalization: Conflicts and Uncertainties

> Run: 20260620-143325-cc-math1-md-finalize-year-2023

## OCR Fixes Applied (from solutions evidence)

- Q1: Options extracted from stem/solutions: Option B OCR noise (\mathrm{~e~}) fixed from solutions; structured options extracted.
- Q2: Options extracted from stem/solutions: Option B OCR noise (\mathrm{~}) fixed; structured options extracted.
- Q3: Options extracted from stem/solutions: Structured options extracted from stem; stem LaTeX normalized.
- Q4: Options extracted from stem/solutions: Severe OCR corruption in stem: garbled LaTeX ($\mathrel{\phantom{=}}\displaystyle{\langle...\rangle}$ and $\because$) replaced with clean text from solutions explanationCandidate. The solution contains the identical semantic content in clean form.
- Q5: Options extracted from stem/solutions: Stem LaTeX normalized (brackets→pmatrix, γ→r). Option C had bare text 'r3 ≤ r2 ≤ r1' — fixed to LaTeX. Option D had \mathsf formatting — normalized.
- Q6: Options extracted from stem/solutions: Severe OCR truncation in paper stem: matrices B, C, D lost. Reconstructed from solutions explanationCandidate which lists all four matrices in clean LaTeX. Stem rendering uses display math for matrix readability.
- Q7: Options extracted from stem/solutions: Severe OCR corruption in both paper and solutions for options. Options A/B/D vectors recovered (labels garbled in solutions: '(3)'→B, '(1)'→D). Option C is damaged even in solutions: only shows 2-component vector k(1,2)^T in 3D context — cannot uniquely recover without PDF.
- Q8: Options extracted from stem/solutions: OCR noise in stem LaTeX (stray array/matrix braces) and options (A: '1e', B/C: \mathrm formatting, C: subscript/superscript confusion). Fixed from solutions.
- Q9: Options extracted from stem/solutions: Paper stem had empty options (A/B/C/D with no text). Options reconstructed from solutions explanationCandidate. Also fixed stem typo: $Y_n$→$Y_m$ in second sample description.
- Q10: Options extracted from stem/solutions: Severe OCR issues in stem and options. Stem: garbled matrix braces and '末知'→'未知'. Options: A had stray 'π', B/C/D had various formatting issues. Fixed from solutions. Also fixed stem: missing N in '总体N(μ,σ²)'.
- Q15: Garbled characters '' and stray 'β = 3' removed. γ expression simplified from solutions (no k₄α₄ term in solutions). Stem typo: γ^T α_1 → γ^T α_i in condition — fixed.
- Q21: Stem had '#' prefix (Markdown heading leak) — removed. Bold notation normalized from \pmb to \boldsymbol. No content changed.
- Q22: Piecewise function had malformed braces and scattered text ('x2 + y2 ≤ 1', '求其他'). Reconstructed from solutions. Note: stem says '协方差' but solution says '方差' — preserved paper stem wording.

## Remaining Warnings (active, need human verification)

- [warning] Q7: Option C vector is OCR-damaged even in solutions (2-component vector in 3D context). Needs PDF verification to recover correct 3D vector.

## Uncertainties

1. **Q6 option rendering**: Options use display math ($$) for matrix readability. Confirm rendering works in target platform.
2. **Q7 option C**: Solutions explanationCandidate had garbled option C text. Reconstructed as $k(-1,1,2)^T$ from the derivation structure, but the exact vector in option C needs PDF confirmation.
3. **Q15 γ expression**: Paper stem had extra term $k_4\alpha_4$ and garbled characters. Simplified to $k_1\alpha_1 + k_2\alpha_2 + k_3\alpha_3$ based on solutions. Confirm with PDF.
4. **Q22 sub-question (1)**: Paper stem says "协方差" (covariance) but solution says "方差" (variance). Preserved paper wording — confirm which is correct.
5. **Q20 sub-question (1)**: Solutions says "若 $f(x) = 0$" but likely should be "若 $f(0) = 0$" as in paper stem. Stem preserved.

## Limits

- No PDF visual verification performed
- No mathematical correctness review
- No knowledge point tags added
- All fixes based on solutions Markdown text matching, not PDF evidence
