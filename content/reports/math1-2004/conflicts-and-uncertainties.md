# Math1 2004 — Conflicts and Uncertainties Report (Post Md-Finalization)

**Batch ID:** `20260620-162448-cc-math1-md-finalize-year-2004`
**Date:** 2026-06-20
**Sources:** Paper Markdown + Solutions Markdown (PDF not read — `not_run`)

---

## 1. Resolved Conflicts (Md-Finalization)

All 12 anomalies resolvable from Markdown evidence have been fixed:

| ID | Question | Issue | Resolution |
|----|----------|-------|------------|
| R-01 | Q06 | Section header pollution in stem | Stripped from stem and explanation |
| R-02 | Q13 | Missing closing parenthesis | Fixed: `等于(` → `等于( )` |
| R-03 | Q14 | Incomplete options (only B/C) | Rebuilt 4 options from paper lines 77-83 |
| R-04 | Q14 | Section header pollution in options | Cleaned |
| R-05 | Q16 | answerCandidate missing | Extracted: 1.05 km |
| R-06 | Q17 | answerCandidate missing | Extracted: -π |
| R-07 | Q19 | answerCandidate missing | Extracted: min (9,3)=3, max (-9,-3)=-3 |
| R-08 | Q20 | answerCandidate missing | Extracted: a values + solutions |
| R-09 | Q21 | answerCandidate missing | Extracted: a=-2/ -2/3 with results |
| R-10 | Q22 | answerCandidate missing | Extracted: distribution + ρ=√15/15 |
| R-11 | Q23 | answerCandidate missing | Extracted: estimators |
| R-12 | Q15/Q18 | answerStatus "missing" | Updated to "candidate_from_solutions" |

---

## 2. Active Uncertainties (Not Resolvable From Markdown Alone)

### 2.1 Q19 — Explanation Run-On (warning)

- **Solutions line 334:** `极小值为当 (-9,-3) 时` — appears to skip stating `极小值为 3` before transitioning to max case.
- **Impact:** Does not affect answer correctness (min at (9,3)=3, max at (-9,-3)=-3 are derivable from the discriminant computation). But the explanation text may be incomplete.
- **Resolution path:** Human verify against solution PDF `2f4ebac7-a51a-4e7e-a856-b959728f741e_origin.pdf`.
- **This is the only blocking item.**

### 2.2 Q05 — LaTeX Style Variation (info)

- Paper: `$\mathbf{A}\mathbf{B}\mathbf{A}^{*} = 2\mathbf{B}\mathbf{A}^{*} + \mathbf{E}$`
- Solutions: `$\mathbf{ABA}^{*} = 2\dot{\mathbf{BA}}^{*} + \mathbf{E}$`
- `\dot{\mathbf{BA}}` is almost certainly an OCR artifact.
- Does not affect correctness of answer |B| = 1/9.

### 2.3 Q16 — OCR Digit Spacing (info)

- Solution method 2: `v (0) = 7 0 0` — OCR inserted spaces between digits.
- Method 1 keeps `700` correctly.
- Content not affected.

### 2.4 Q12 — Source Formatting (info)

- Paper uses fullwidth `（12）` while Q7-Q11 use halfwidth `(7)-(11)`.
- Source formatting variation — no action needed.

---

## 3. No-Collision Summary

- **Paper ↔ Solutions question count:** 23 = 23. No mismatch.
- **Question type distribution:** 6 fill-in-blank + 8 multiple-choice + 9 solution. Matches expected.
- **No duplicate or missing question numbers.**
- **No cross-subject contamination.**

---

## 4. Source Reference Status

| Source | Status |
|--------|--------|
| Paper Markdown | Fully read — primary evidence for stems/options |
| Solutions Markdown | Fully read — answer/explanation source |
| Solutions PDF | NOT_READ |
| content_list_v2.json | NOT_READ |
| MinerU model/layout JSON | NOT_READ |
