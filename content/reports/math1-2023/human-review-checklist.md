# 数学一 2023 人工审核清单

> Run: 20260620-143325-cc-math1-md-finalize-year-2023
> Markdown-First Finalization
> All questions: `needs_human_review`

## 优先级

- P0: 0 项
- P1: 1 项
- P2: 14 项

## P0（必须先处理）

- 无

## P1（建议本轮处理）

- `math1-2023-q07`: Option C vector is OCR-damaged even in solutions (2-component vector in 3D context). Needs PDF verification to recover correct 3D vector.

## P2（OCR 修复记录，可顺手核实）

- `math1-2023-q01`: Options extracted from stem/solutions: Option B OCR noise (\mathrm{~e~}) fixed from solutions; structured options extracted.
- `math1-2023-q02`: Options extracted from stem/solutions: Option B OCR noise (\mathrm{~}) fixed; structured options extracted.
- `math1-2023-q03`: Options extracted from stem/solutions: Structured options extracted from stem; stem LaTeX normalized.
- `math1-2023-q04`: Options extracted from stem/solutions: Severe OCR corruption in stem: garbled LaTeX ($\mathrel{\phantom{=}}\displaystyle{\langle...\rangle}$ and $\because$) replaced with clean text from solutions explanationCandidate. The solution contains the identical semantic content in clean form.
- `math1-2023-q05`: Options extracted from stem/solutions: Stem LaTeX normalized (brackets→pmatrix, γ→r). Option C had bare text 'r3 ≤ r2 ≤ r1' — fixed to LaTeX. Option D had \mathsf formatting — normalized.
- `math1-2023-q06`: Options extracted from stem/solutions: Severe OCR truncation in paper stem: matrices B, C, D lost. Reconstructed from solutions explanationCandidate which lists all four matrices in clean LaTeX. Stem rendering uses display math for matrix readability.
- `math1-2023-q07`: Options extracted from stem/solutions: Severe OCR corruption in both paper and solutions for options. Options A/B/D vectors recovered (labels garbled in solutions: '(3)'→B, '(1)'→D). Option C is damaged even in solutions: only shows 2-component vector k(1,2)^T in 3D context — cannot uniquely recover without PDF.
- `math1-2023-q08`: Options extracted from stem/solutions: OCR noise in stem LaTeX (stray array/matrix braces) and options (A: '1e', B/C: \mathrm formatting, C: subscript/superscript confusion). Fixed from solutions.
- `math1-2023-q09`: Options extracted from stem/solutions: Paper stem had empty options (A/B/C/D with no text). Options reconstructed from solutions explanationCandidate. Also fixed stem typo: $Y_n$→$Y_m$ in second sample description.
- `math1-2023-q10`: Options extracted from stem/solutions: Severe OCR issues in stem and options. Stem: garbled matrix braces and '末知'→'未知'. Options: A had stray 'π', B/C/D had various formatting issues. Fixed from solutions. Also fixed stem: missing N in '总体N(μ,σ²)'.
- `math1-2023-q15`: Garbled characters '' and stray 'β = 3' removed. γ expression simplified from solutions (no k₄α₄ term in solutions). Stem typo: γ^T α_1 → γ^T α_i in condition — fixed.
- `math1-2023-q21`: Stem had '#' prefix (Markdown heading leak) — removed. Bold notation normalized from \pmb to \boldsymbol. No content changed.
- `math1-2023-q22`: Piecewise function had malformed braces and scattered text ('x2 + y2 ≤ 1', '求其他'). Reconstructed from solutions. Note: stem says '协方差' but solution says '方差' — preserved paper stem wording.

## 审核要求

- 本次已基于 solutions Markdown 对 OCR 损坏的 stem/options 进行确定性修复
- 所有修复均记录在 questions-reviewed.json 的 modifications 字段中
- 逐题对照 PDF/原始 Markdown 确认题干、选项、答案、解析和知识点
- 确认 Q4、Q6、Q7 的重建内容与 PDF 一致（纸面 OCR 损坏最严重）
- 添加知识点标签
