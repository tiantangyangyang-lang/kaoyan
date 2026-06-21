# Math1 1998 — Markdown-First Finalization: Conflicts and Uncertainties

Generated: 2026-06-20T08:07:40.230364+00:00

## Fixed Issues (Prior Run)

- `math1-1998-q10`: Missing option A restored from source paper stem (`$(\mathrm{A})P(A\mid B) = P(\overline{A}\mid B).$`)
- `math1-1998-q07`: Stem missing closing `\mid` — restored based on solution file usage
- `math1-1998-q07`: Explanation `\lim_{[ - ]}` → `\lim_{x\to -1}` (deterministic OCR fix from mathematical context)
- `math1-1998-q11` through `q23`: `answerCandidate` extracted from solution explanations

## Active Anomalies

- `math1-1998-q06` [info]: Explanation contains garbled substitution notation: '\frac{x^2 - t^2 = u}{2}\frac{1}{2}'. Mathematical meaning preserved but notation is malformed.
  - Evidence: Source solution Markdown matches this garbled text; OCR artifact from original PDF.
- `math1-1998-q17` [warning]: Explanation has 'F(x) = x\int_{x}^{x}f(t)dt' — both integration limits are x, which is nonsensical. Likely OCR error in source.
  - Evidence: Source solution Markdown matches this; original PDF verification needed to determine correct limits.

## Readiness Classification

| Classification | Count | Questions |
|---|---|---|
| ready_for_approval | 22 | `math1-1998-q01`, `math1-1998-q02`, `math1-1998-q03`, `math1-1998-q04`, `math1-1998-q05`, `math1-1998-q06`, `math1-1998-q07`, `math1-1998-q08`, `math1-1998-q09`, `math1-1998-q10`, `math1-1998-q11`, `math1-1998-q12`, `math1-1998-q13`, `math1-1998-q14`, `math1-1998-q15`, `math1-1998-q16`, `math1-1998-q18`, `math1-1998-q19`, `math1-1998-q20`, `math1-1998-q21`, `math1-1998-q22`, `math1-1998-q23` |
| ready_with_info | 1 | `math1-1998-q17` |
| blocked | 0 | — |

## Limitations

- No PDF visual verification performed
- Mathematical correctness not verified (answers from solution Markdown only)
- Source repo was dirty at time of original extraction
- Q6 and Q17 explanations have likely OCR artifacts that need PDF confirmation
