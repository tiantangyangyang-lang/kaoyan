# Math1 1995 Structure Repair Report

## Result

- Input: `content/staging/math1/1995/questions.json`
- Output: `content/review/math1/1995/questions-structure-repaired.json`
- Output SHA-256: `8DAD7D543B8260DFF12BDC83F8C56C1788144117B69D0D4CBF61E6CC9956FE73`
- Questions retained: 22
- Publication status: all questions remain `needs_human_review`

## Deterministic Repairs

- Split the Q11 explanation container into Q11 and Q12.
- Split the Q13 explanation container into Q13 and Q14.

## Validation

- Questions with explanations: 22 / 22
- Multiple-choice questions with A-D options: 5 / 5
- Remaining per-question automatic anomalies: 0
- Original carried-forward structural anomalies resolved: 4 / 4
- Regression tests:
  `tests/test_apply_math1_1995_structural_repair.py`

## Boundary

- Solution questions without an explicit short-answer marker retain missing `answerCandidate`
  values; their explanations are preserved without inventing answers.
- Staging, canonical local fallback review, and the source repository were not modified.
- No mathematical correctness or publication approval is claimed.
