# Math1 1993 — MD-Finalization Conflicts and Uncertainties

> Run: 20260620-154345-cc-math1-md-finalize-year-1993
> Based on: paper Markdown + solutions Markdown + structure-repaired.json

## Resolved Conflicts

All 7 anomalies from the legacy transform have been resolved:

| # | Type | Resolution |
|---|------|------------|
| 1 | section_split_mismatch (section 三) | Split merged Q11-Q13 solution blocks |
| 2 | section_split_mismatch (section 六) | Split merged Q16-Q17 solution blocks |
| 3 | incomplete_options Q9 | Restored option D from embedded text |
| 4 | incomplete_options Q10 | Restored options B and D from embedded text |
| 5 | missing_solution Q12 | Assigned Q12 explanation from split block |
| 6 | missing_solution Q13 | Assigned Q13 explanation from split block |
| 7 | missing_solution Q17 | Assigned Q17 explanation from split block |

## Deterministic OCR Repairs

| Question | Field | Original OCR | Repaired | Confidence |
|----------|-------|--------------|----------|------------|
| Q7 | Option B | `4 $\int$...` (split math mode) | `$4\int$...` (unified) | High |
| Q7 | Option C | `2√cos20dθ` | `$2\int_{0}^{\frac{\pi}{4}}\sqrt{\cos 2\theta}\,\mathrm{d}\theta$` | High |

## Remaining Uncertainties

- Q7 Option C OCR repair needs human PDF confirmation to ensure exact intended expression.
- Solution-type proof questions (Q16, Q17, Q19, Q20) have no extractable short answer — structurally correct.
- Knowledge point tags have not been assigned — deferred to human review.

## Boundary

- PDF pages were not read during MD-finalization.
- Mathematical correctness has not been verified.
- All content remains `needs_human_review`.
