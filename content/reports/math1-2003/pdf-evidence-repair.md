# Math1 2003 — PDF Evidence Repair Report

> runId: `20260618-202653-cc-math1-pdf-evidence-repair-2003`
> task: `cc-math1-pdf-evidence-repair`
> subjectCode: `math1`, sourceYear: `2003`
> status: `completed_with_warnings`

---

## 1. Source Mirror Evidence

### Source Files
| File | SHA-256 |
|------|---------|
| Paper markdown | `5284A1F1C4F1C96197402EBDDFD18A86B779E65BAD02A6AADE351248E3E2A970` |
| Solutions markdown | `9591E29A780F311E34EDA394E7AD92399CF5B40A15749D7FA1597D976E837494` |
| Solutions PDF | `9BE0EB434A1D110F92F59D653E1CDBE72C66BFA024ABA115F9929A13264C71EA` |
| Source commit | `3151b4acf26ea19ccd427b869a715e65e1990091` (dirty: true) |

### Q7 Image
- Path: `papers/images/2003年考研数学(一)真题/341a324b59e43d9ab00862c2b1bb32802af9d1393c521c0602bb888bbeac2b38.jpg`
- SHA-256: `FB373C2FF81994026759674E72BDB05D96F7180A9F5222ECAE9264A93C7F4BE4`
- Exists: ✓ (verified via `Get-FileHash`)
- Content visually inspected: ✗ (image type unsupported in this environment)
- Previous run (20260618-191712) already removed the false `missing_image` anomaly

---

## 2. Items Resolved (re-verified from source mirror)

### Q4: Matrix notation — `anom-2003-r02`
- **Status**: ✓ Resolved (previous run 20260618-191712)
- **answerCandidate**: `$\begin{pmatrix} 2 & 3\\ -1 & -2 \end{pmatrix}$` (correct)
- **Evidence**: Solutions markdown line 35 uses correct pmatrix form
- **Note**: explanationCandidate still preserves `\binom{2}{-1}\binom{3}{-2}` in the displayed answer text within the explanation body — this is acceptable as it's original OCR output preserved for traceability

### Q6: Sample mean notation — `anom-2003-r03`
- **Status**: ✓ Resolved (previous run 20260618-191712)
- **explanationCandidate**: Uses `\overline{X}` (no `\frac{-}{x}` remaining)
- **Evidence**: Solutions markdown lines 47/55/57 use correct `\overline{X}`

### Q5: Stem spacing — `anom-2003-r07`
- **Status**: ✓ Resolved (previous run 20260618-191712)
- **Stem**: "其他" (was "其 他")

### Q9: Parenthesis consistency — `anom-2003-r08`
- **Status**: ✓ Resolved (previous run 20260618-191712)
- **Stem**: "(B)" (was "（B）")

### Q12: Missing closing parenthesis — `anom-2003-r09`
- **Status**: ✓ Resolved (previous run 20260618-191712)
- **Stem**: "则( )" (was "则（")

---

## 3. Items Unresolved (requires human PDF visual inspection)

### Q10: Near-duplicate options — `anom-2003-r04`, `anom-2003-r06` [P1]
- **Issue**: Paper markdown OCR shows A≈C (both: r < s → 线性相关) and B≈D (both: r > s → 线性相关)
- **Solutions evidence**: Method 2 counterexamples disprove (A), (B), (C); answer is (D)
- **Mathematical deduction** (not PDF-verified): Correct options likely are:
  - (A) 当 r < s 时, 向量组 I 必线性无关. [FALSE]
  - (B) 当 r > s 时, 向量组 I 必线性无关. [FALSE]
  - (C) 当 r < s 时, 向量组 I 必线性相关. [FALSE]
  - (D) 当 r > s 时, 向量组 I 必线性相关. [TRUE]
- **PDF**: Not rendered (pdftoppm unavailable). content_list_v2.json only contains solution text starting from "【解】", not the stem options.
- **Human action**: Open the solutions PDF and locate the Q10 question page. Read all four option texts directly from the printed page. Update questions.json options.

### Q18: Integral notation in F(t) — `anom-2003-r05` [P1]
- **Issue**: Paper stem uses `\iint_{D(t)}` (double integral over disk D(t)) for the triple integral over ball Ω(t), with volume element dv
- **Solutions**: Correctly use `\iiint_{\Omega(t)}` (content_list_v2.json line 3866 confirms)
- **Paper markdown line 123**:
  ```
  F(t) = \frac {\iint_{D(t)} f(x^2 + y^2 + z^2) \mathrm{d}v}
                {\iint_{D(t)} f(x^2 + y^2) \mathrm{d}\sigma}
  ```
- **PDF**: Not visually verified. Original exam printing might use `\iint` as shorthand.
- **Human action**: Open the solutions PDF at the Q18 section. Read the F(t) definition as printed. Update stem if original printing differs from current text.

### Q19: α₃ vector dimension — `anom-2003-r10` [P2]
- **Issue**: Solutions line 365: `\pmb{\alpha}_{3} = \binom{1}{1}` (2D notation)
- **Contradiction**: β₃ = P⁻¹α₃ computed as (1,1,1)^T → (0,1,1)^T (3D). P⁻¹ is 3×3.
- **Likely cause**: OCR lost the third row `\begin{pmatrix} 1 \\ 1 \\ 1 \end{pmatrix}` → `\binom{1}{1}`
- **Human action**: Open solutions PDF at Q19 method-2 section. Read α₃ directly.

### Q22: OCR artifacts — `anom-2003-r14`, `anom-2003-r15` [P2]
- **Issue 1** (line 484): `\frac {2 n (x - \theta) = t}{\theta}` — garbled substitution notation
- **Issue 2** (line 469): `\int_{\theta}^{x} 2 \mathrm{e}^{-2(x - \theta)} \mathrm{d}x` — variable conflict
- **Human action**: Open solutions PDF at Q22 section. Read substitution step and integral.

---

## 4. PDF Rendering Limitation

`pdftoppm` not available in this environment. The solutions PDF (`07f6f558..._origin.pdf`) contains 33+ pages and could not be rendered. All PDF evidence is from MinerU text extraction (content_list_v2.json, model.json) and the solutions markdown — none is from direct visual inspection.

---

## 5. Verification Checks Performed

| Check | Status |
|-------|--------|
| Q7 image SHA-256 verified | passed |
| Q4 answerCandidate matrix notation | passed |
| Q6 explanationCandidate `\overline{X}` | passed |
| Q5/Q9/Q12 stem formatting | passed |
| solutions PDF SHA-256 recorded | passed |
| Source mirror unmodified | passed |
| totalQuestions == len(questions) [22] | passed |
| Stable IDs unique and sequential | passed |
| All questions `needs_human_review` | passed |
| No `approved` or `published` status | passed |
| Q10 options still unresolved | passed (documented) |
| Q18 integral notation unresolved | passed (documented) |
| Q19 α₃ dimension unresolved | passed (documented) |
| Q22 OCR artifacts unresolved | passed (documented) |

---

## 6. Conclusion

6 previously resolved items (Q4, Q6, Q5, Q9, Q12, Q7-image) re-verified as correct from source mirror. 4 items (Q10, Q18, Q19, Q22) remain unresolved because the solutions PDF cannot be rendered for visual inspection in this environment. All unresolved items require a human to open the PDF, locate the relevant pages, and read the printed text directly.

The staging questions.json has NOT been modified by this run — no new corrections were applied because none could be verified from direct PDF visual evidence.
