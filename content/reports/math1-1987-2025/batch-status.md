# Math1 1987-2025 Batch Status

## Current Result

- Scope: Math1 calendar years 1987-2025, 39 years.
- Generated staging: every available year except 1994, 38 years, 850 candidate questions.
- Existing human-reviewed artifact: 2020, 23 questions.
- Available candidate total: 850 questions across all available paper years, excluding blocked 1994.
- Canonical yearly review artifacts now exist for all 38 non-blocked years.
- All generated and reviewed questions remain `needs_human_review`.
- Source repository remains read-only for this project. Do not commit or push it.

## Execution Queue

| Priority | Years | Current state | Next action |
|---|---|---|---|
| P0 | 2004 | Staging complete; semantic review recovered locally to canonical files | Human review Q14 first, then handle Q6/Q13/Q19 |
| P1 | 2005 | Staging complete; semantic review complete with warnings | Human review Q15, Q11/Q14, and Q20 before any publish step |
| P1 | 2006 | Staging complete; semantic review complete with warnings | Human review Q08/Q13/Q14 and Q16 before any publish step |
| P1 | 2007 | Staging complete; local fallback review generated after Claude billing failure | Human review Q03 first; rerun semantic review later if Claude balance is restored |
| P1 | 2008-2019 | Local fallback review packages generated; 276 questions; 20 warnings | Human review by year; rerun semantic review later if Claude balance is restored |
| P1 | 1987-1993, 1995-2003 | 1988, 1989, 1990, 1991, 1992, 1993, 1995, 1996, 1997, 1998, 1999, 2002, and 2003 structure repairs complete; remaining legacy years retain warnings | Continue with the remaining legacy warning years after 2025 |
| P1 | 2021-2023, 2025 | 2022 rebuild complete; 2025 auto repair reduced 12 warnings to 3 source gaps | Obtain 2025 PDF for Q4/Q9/Q10; continue legacy cleanup meanwhile |
| P1 | 2024 | Five-page PDF visual review complete; 12 OCR/boundary issues corrected | Review the possible Q19 source typo and add detailed solutions |
| Blocked | 1994 | Solutions exist, paper missing | Obtain a paper source; do not synthesize questions |

## Immediate Command

Current bottleneck is no longer staging or canonical review generation for non-blocked years. The next
useful action is human review of the highest-risk years:

1. `content/reports/math1-1990/structure-repair-report.md`
2. `content/reports/math1-1991/structure-repair-report.md`
3. `content/reports/math1-1992/structure-repair-report.md`
4. `content/reports/math1-1993/structure-repair-report.md`
5. `content/reports/math1-2003/structure-repair-report.md`
6. `content/reports/math1-1988/structure-repair-report.md`
7. `content/reports/math1-1989/structure-repair-report.md`
8. `content/reports/math1-1995/structure-repair-report.md`
9. `content/reports/math1-1996/structure-repair-report.md`
10. `content/reports/math1-1998/structure-repair-report.md`
11. `content/reports/math1-1999/structure-repair-report.md`

2024 is no longer blocked. Its version-selection and conflict report is:

12. `content/reports/math1-2024/version-selection-report.md`

If Claude billing is restored and you want to replace a local fallback package with a formal
semantic-review run, restart from 2007 or 2008 in the user's Claude Code CMD session:

```cmd
scripts\run-agent-task.cmd -Task ds-math1-year -Year 2007 -PlanOnly -MaxTurns 60
```

## Acceptance Gate For A New Yearly Review

- Reviewed-question count must match the staged question count for that year.
- Every question remains `needs_human_review`.
- Candidate text is preserved without ellipsis or silent correction.
- Any missing labels are reported, not invented.
- Any source conflict includes the source path and evidence.
- `agent-result.json` and `agent-report.md` are present and truthful.

Only after this gate passes should the same process continue to the next year or be used to
replace a local fallback package with a formal semantic-review package.

## 2004 Recovery Note

- The first formal semantic-review run (`20260615-123836-ds-math1-year-2004`) produced a complete
  legacy review file but failed contract validation because `commandsRun` was empty.
- The second formal run (`20260615-130210-ds-math1-year-2004`) produced partial standardized
  files but stopped before writing `agent-result.json`.
- Canonical 2004 review artifacts were recovered locally with
  `scripts/repair_math1_year_review.py` and now exist at:
  - `content/review/math1/2004/questions-reviewed.json`
  - `content/review/math1/2004/anomalies-reviewed.json`
  - `content/reports/math1-2004/human-review-checklist.md`
  - `content/reports/math1-2004/conflicts-and-uncertainties.md`

## 2005 Current State

- `ds-math1-year` completed semantic review content for 2005 and wrote the canonical files:
  - `content/review/math1/2005/questions-reviewed.json`
  - `content/review/math1/2005/anomalies-reviewed.json`
  - `content/reports/math1-2005/human-review-checklist.md`
  - `content/reports/math1-2005/conflicts-and-uncertainties.md`
- The old wrapper falsely marked the run failed because `agent-result.json` reported created files
  with absolute paths. The wrapper now normalizes absolute and relative reported paths before
  comparing them with `output-integrity.json`.
- 2005 priority human-review items:
  - Q15 integral upper bound OCR error
  - Q11 and Q14 incomplete option extraction
  - Q20 eigenvector and LaTeX breakage

## 2006 Current State

- `ds-math1-year` completed semantic review content for 2006 and wrote the canonical files:
  - `content/review/math1/2006/questions-reviewed.json`
  - `content/review/math1/2006/anomalies-reviewed.json`
  - `content/reports/math1-2006/human-review-checklist.md`
  - `content/reports/math1-2006/conflicts-and-uncertainties.md`
- The wrapper logic now treats `completed_with_warnings` as a valid semantic-review outcome when
  the agent explicitly reports findings, failed checks, or `not_run` items.
- 2006 priority human-review items:
  - Q08, Q13, Q14 incomplete option labels
  - Q16 paper/solution formula conflict
  - Q06 and Q14 section-header contamination

## 2007 Current State

- `ds-math1-year -Year 2007 -PlanOnly` succeeded, but the formal run stopped immediately with
  `API Error: 402 Insufficient Balance` before writing canonical review files.
- To avoid blocking the batch, a conservative local fallback generator created the canonical files:
  - `content/review/math1/2007/questions-reviewed.json`
  - `content/review/math1/2007/anomalies-reviewed.json`
  - `content/reports/math1-2007/human-review-checklist.md`
  - `content/reports/math1-2007/conflicts-and-uncertainties.md`
- The local fallback preserves all 24 staged candidates, keeps every question at
  `needs_human_review`, reports the single staging warning, and does not claim any new semantic
  math verification.
- 2007 priority human-review item:
  - Q03 incomplete option extraction (`['B']`)

## 2008-2019 Current State

- A deterministic local fallback generator created canonical review files for all 12 years from
  2008 through 2019:
  - `content/review/math1/<year>/questions-reviewed.json`
  - `content/review/math1/<year>/anomalies-reviewed.json`
  - `content/reports/math1-<year>/human-review-checklist.md`
  - `content/reports/math1-<year>/conflicts-and-uncertainties.md`
- Coverage totals for these 12 years:
  - 276 reviewed candidates
  - 20 carried-forward staging anomalies
- Per-year anomaly counts:
  - 2008: 0
  - 2009: 2
  - 2010: 1
  - 2011: 2
  - 2012: 1
  - 2013: 3
  - 2014: 2
  - 2015: 2
  - 2016: 2
  - 2017: 1
  - 2018: 1
  - 2019: 3

## 1987-1993, 1995-2003 Current State

- A dedicated legacy parser now exists at
  `scripts/transform_math1_legacy_year.py`, with representative real-year coverage in
  `tests/test_transform_math1_legacy_year.py`.
- It stages all available pre-2004 legacy Math1 papers using section-based flattening:
  - headings with `共N小题` are split into `N` scored questions
  - headings without explicit `共N小题` remain one scored question even when the stem contains
    internal `(1)(2)` subparts
  - solution sections are attached by original Chinese section numerals
- Legacy staging outputs now exist for every available year from 1987 through 2003 except the
  blocked 1994 paper gap.
- Legacy local review packages also exist for every staged legacy year:
  - `content/review/math1/<year>/questions-reviewed.json`
  - `content/review/math1/<year>/anomalies-reviewed.json`
  - `content/reports/math1-<year>/human-review-checklist.md`
  - `content/reports/math1-<year>/conflicts-and-uncertainties.md`
- Legacy coverage totals:
  - 348 reviewed candidates
  - 92 carried-forward staging anomalies
- A separate 1992 structure-repaired artifact now exists at
  `content/review/math1/1992/questions-structure-repaired.json`. It restores explanations for
  all 22 questions, splits the merged Q6-Q13 and Q18-Q19 solution blocks, keeps every question at
  `needs_human_review`, and leaves staging plus canonical local fallback review unchanged.
- A separate 1988 structure-repaired artifact now exists at
  `content/review/math1/1988/questions-structure-repaired.json`. It restores explanations for
  all 22 questions, splits the merged Q1-Q3 solution blocks, keeps every question at
  `needs_human_review`, and leaves staging plus canonical local fallback review unchanged.
- A separate 1989 structure-repaired artifact now exists at
  `content/review/math1/1989/questions-structure-repaired.json`. It restores explanations for
  22 of 23 questions, moves the embedded Q12-Q13 blocks out of the misplaced Q11 container,
  splits the embedded Q20-Q22 fill-in blocks out of Q19, keeps every question at
  `needs_human_review`, and leaves staging plus canonical local fallback review unchanged.
- A separate 1990 structure-repaired artifact now exists at
  `content/review/math1/1990/questions-structure-repaired.json`. It restores explanations for
  all 23 questions, splits the merged Q6-Q13 solution blocks, keeps every question at
  `needs_human_review`, and leaves staging plus canonical local fallback review unchanged.
- A separate 1991 structure-repaired artifact now exists at
  `content/review/math1/1991/questions-structure-repaired.json`. It restores explanations for
  all 22 questions, splits the merged Q11-Q13 and Q14-Q15 solution blocks, restores the embedded
  C/D options for Q7, keeps every question at `needs_human_review`, and leaves staging plus
  canonical local fallback review unchanged.
- A separate 1993 structure-repaired artifact now exists at
  `content/review/math1/1993/questions-structure-repaired.json`. It restores explanations for
  all 23 questions, splits the merged Q11-Q13 and Q16-Q17 blocks, restores the embedded choice
  options for Q9 and Q10, keeps every question at `needs_human_review`, and leaves staging plus
  canonical local fallback review unchanged.
- A separate 1995 structure-repaired artifact now exists at
  `content/review/math1/1995/questions-structure-repaired.json`. It restores explanations for
  all 22 questions, splits the merged Q11-Q12 and Q13-Q14 solution pairs, keeps every question at
  `needs_human_review`, and leaves staging plus canonical local fallback review unchanged.
- A separate 1996 structure-repaired artifact now exists at
  `content/review/math1/1996/questions-structure-repaired.json`. It restores explanations for
  all 22 questions, splits the merged Q11-Q12 and Q13-Q14 solution pairs, keeps every question at
  `needs_human_review`, and leaves staging plus canonical local fallback review unchanged.
- A separate 1998 structure-repaired artifact now exists at
  `content/review/math1/1998/questions-structure-repaired.json`. It restores the missing A option
  for Q10, keeps every question at `needs_human_review`, and leaves staging plus canonical local
  fallback review unchanged.
- A separate 1999 structure-repaired artifact now exists at
  `content/review/math1/1999/questions-structure-repaired.json`. It restores the missing A option
  for Q10, keeps every question at `needs_human_review`, and leaves staging plus canonical local
  fallback review unchanged.
- A separate 2003 structure-repaired artifact now exists at
  `content/review/math1/2003/questions-structure-repaired.json`. It restores explanations for
  all 22 questions, splits the merged Q7-Q12 solution blocks, recovers Q20 from the read-only
  source solution Markdown, keeps every question at `needs_human_review`, and leaves staging plus
  canonical local fallback review unchanged.
- Per-year question/anomaly counts:
  - 1987: 20 / 0
  - 1988: 22 / 3
  - 1989: 23 / 6
  - 1990: 23 / 8
  - 1991: 22 / 5
  - 1992: 22 / 9
  - 1993: 23 / 7
  - 1995: 22 / 4
  - 1996: 22 / 4
  - 1997: 22 / 14
  - 1998: 23 / 1
  - 1999: 21 / 1
  - 2000: 21 / 6
  - 2001: 20 / 6
  - 2002: 20 / 11
  - 2003: 22 / 7

## 2021-2023, 2025 Current State

- A deterministic modern mixed-marker parser now exists at
  `scripts/transform_math1_modern_year.py`, with real-source regression coverage in
  `tests/test_transform_math1_modern_year.py`.
- It uses audited per-year question-start line maps because OCR damaged several visible markers.
- Staging and local review packages now exist for all four modern years:
  - 2021: 22 questions / 1 anomaly
  - 2022: 22 questions / 56 anomalies
  - 2023: 22 questions / 11 anomalies
  - 2025: 22 questions / 12 anomalies
- 2022 answers are sourced from the solution file's explicit answer-lookup section. Its paper
  transcription remains severely corrupted and requires PDF comparison.
- 2025 has no separate solution Markdown; 16 answers/explanations were extracted from the same
  combined paper-and-analysis source, and the remaining items stay missing.

## 2024 Current State

- A dedicated multi-version transformer now exists at `scripts/transform_math1_2024.py`.
- It selected `papers/2024年数学(一)真题及参考答案.md` as the primary complete candidate and
  retained all three paper candidates plus `solutions/2024年解析/2024.md` in provenance.
- The solution Markdown is byte-identical to the selected primary combined paper.
- Staging and local review packages contain 22 questions, 22 candidate answers, no detailed
  explanations, and 14 carried-forward anomalies.
- Content-level alternative-answer conflicts are explicitly recorded for Q13, Q14, Q18, Q19,
  Q21, and Q22. Formatting-only differences are ignored by the comparison rule.
- All questions remain `needs_human_review`.
- The original five-page PDF has now been visually reviewed. An evidence-backed artifact exists at
  `content/review/math1/2024/questions-human-reviewed.json`.
- PDF review restored Q2/Q3/Q8/Q9 options, repaired Q4/Q11 OCR fragments, confirmed Q13/Q14,
  corrected Q18, restored Q19/Q21 answers, and repaired the Q22 question boundary.
- The remaining explicit content risk is Q19: the PDF itself visibly repeats `f'(0)=f'(0)`, so it
  was retained and flagged instead of silently reinterpreted.
- The user confirmed the Q17-Q22 stem content. Those stems are now normalized in the separate
  human-reviewed artifact, with PDF-visible notation retained where the pasted text contained
  apparent formatting artifacts.
