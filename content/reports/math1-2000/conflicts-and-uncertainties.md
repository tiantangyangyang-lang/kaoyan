# Conflicts and Uncertainties: Math1 2000 (Post MD-Finalization)

> Updated: 2026-06-20 | Run: 20260620-150305-cc-math1-md-finalize-year-2000

## Paper / Solution Conflicts

**Total conflicts found: 0**

No content-level conflicts detected between paper Markdown and solution Markdown. All stems, formulas, options, and answers are consistent.

### Numbering Convention

Solution uses continuous numbering (1)-(21); paper uses section-based (一~十三). This is structural convention, not conflict. Staging correctly maps:
- Paper 一 → Solution (1)-(5)
- Paper 二 → Solution (6)-(10)
- Paper 三~十三 → Solution (11)-(21)

---

## OCR Noise (Post-Finalization)

| ID | Type | Location | Status |
|----|------|----------|--------|
| ANO-2000-006 | raw_matrix_numbers | solutions/2000年解析.md:295 | Source-only artifact. Staging data unaffected. Matrix A = [[9/10, 2/5], [1/10, 3/5]] correctly captured. |

No other OCR noise patterns detected (no split "l i m", "rx²", random garbled characters).

---

## Formula Issues (Post-Finalization)

| ID | Question | Issue | Status |
|----|----------|-------|--------|
| ANO-2000-007 | math1-2000-s01-q03 | Unbalanced parens in constant notation | **RESOLVED**: Fixed to `$y = \frac{C_1}{x^2} + C_2$ ($C_1, C_2$ 为任意常数).` |
| ANO-2000-010 | math1-2000-s02-q05 | Option A uses \mathrm formatting | Unresolved (cosmetic, info-level) |

---

## Missing Answers (Post-Finalization)

| # | Question ID | Original Status | Resolution |
|---|------------|-----------------|------------|
| 1 | math1-2000-s04 | missing | **EXTRACTED**: Final ∂²z/∂x∂y expression from solution explanation line 141 |
| 2 | math1-2000-s07 | missing | **EXTRACTED**: "收敛区间为(-3,3), 在x=-3处收敛, 在x=3处发散" from solution lines 183-201 |
| 3 | math1-2000-s09 | missing (proof) | **CONFIRMED INTENTIONAL**: Proof body IS the answer |
| 4 | math1-2000-s11-q01 | missing | **EXTRACTED**: System of equations and matrix A from solution lines 289-293 |
| 5 | math1-2000-s11-q02 | missing | **EXTRACTED**: λ₁=1, λ₂=1/2 from solution lines 297-299 |

---

## Image Dependencies (Unresolved, Non-Blocking)

| Image | Question | Content | Note |
|-------|----------|---------|------|
| ba84f2ee...jpg | Q1 | Geometric area diagram | Misplaced between Q2 sections in source. Correctly belongs to Q1 method 2. |
| 64aa7798...jpg | Q5 | Contour L and ellipse L0 | Correctly placed in source. Visual content unverified without PDF. |

---

## Remaining Uncertainties

1. **Answer correctness** (all 23 questions): Per spec §6, Claude Code cannot judge mathematical correctness. Human mathematician must verify all answers.

2. **PDF visual confirmation**: The source PDF (`a2fe840b...origin.pdf`) exists in the source mirror (2.98 MB) but `pdftoppm`/PDF reading tools are not available in the execution environment. Human reviewer should:
   - Verify images against PDF pages
   - Confirm formulas visually where OCR ambiguity is possible
   - Check the OCR artifact at solutions line 295

3. **Source dirty flag**: Source commit `3151b4acf` was dirty at inventory time. This means untracked/modified files existed in the source repo. The impact is limited to this batch since both paper and solution markdown files are tracked.

---

## Risk Summary (Post-Finalization)

| Risk Level | Count | Description |
|------------|-------|-------------|
| High | 0 | No blocking issues |
| Medium | 1 | OCR artifact in source (verified not in staging data) |
| Low | 4 | Image dependencies, formatting, intentional missing answer |
