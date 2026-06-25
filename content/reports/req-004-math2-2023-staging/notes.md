# Notes: REQ-004 Math2 2023 Staging Audit

## Source State

- Before audit: `D:\work\Kaoyan-Math2-Papers` at `fd42c56`, dirty with 5 untracked
  MinerU Markdown files.
- After audit: identical. No source file was modified; reads only.

## Hash Verification (2026-06-25)

```
eef3ea76c3491b8753230bfc1089493d2b67f1b1a815bc45de6666a70cdcb02f  papers/MinerU_markdown_math2_2023_2065687933685170176.md
c353e535aa9dcda945bc9d88c3c441f3f4d23060a3408209ac3e90efa202bed8  solutions/2023/math2_2023/math2_2023.md
```

Both match the REQ-003 `import-queue.md` frozen hashes.

## Structural Comparison: 2020 vs 2023

| Year | MC | Fill | Solution | Total | Type thresholds |
|---|---|---|---|---|---|
| 2020 | 8 | 6 | 9 | 23 | 1–8 / 9–14 / 15–23 |
| 2023 | 10 | 6 | 6 | 22 | 1–10 / 11–16 / 17–22 |

2023 thresholds are read from explicit section headers in the source, so adapting
the 2020 converter is mechanical transcription, not interpretation.

## OCR Defect Detail (primary paper file)

- Q2, line 15: stem ends "...的一个原函数是"; line 16 blank; line 17 begins Q3.
  Options A–D missing entirely.
- Q4, lines 27–29: stem line 27; line 28 blank; line 29 only `$( \mathrm { D } ) a = 0 , b < 0$`.
  Options A–C missing.
- Q6, lines 41–49: `(A)` value at 43, `(B)` empty at 45, `(C)` value at 47, `(D)` empty at 49.
- Q7, lines 51–56: stem line 51; options `(A)`/`(B)`/`(C)`/`(D)` at 53–56 all empty.
- Q9, lines 84–86: stem line 84–85; line 86 begins Q10. No options.
- Q10, lines 86–91: options present but followed by stray `5` (88) and `1` (90) tokens.
- Q8, lines 58–82: options rendered as display-math `$$...$$` blocks; `OPTION_MARKER`
  matches the label lines but values are multi-line.

## Comparison File Quality

The comparison file has complete A–D options for all 10 MC questions and all 22
boundaries. Minor noise: stray `√1+x²` at Q2 (line 15), stray `x²` at Q18 (116),
stray `3x²+y²dedy` at Q20 (129). These are cosmetic and do not affect option
completeness.

## Answer/Explanation Markers

Scanned both files for `【答案】|答案[:：]|参考答案` and `【解】|【解析】|解答[:：]`.
Zero matches in both. Both are question-only transcriptions. No answer evidence.

## Non-Delegable Decision

See `content/reports/math2-2023/source-role-audit.md` § "Non-Delegable Decision
Required". Options (a) re-OCR, (b) promote comparison to primary, (c) relax
schema. Claude Code does not choose.

## Verification

`mingw32-make NPM=npm.cmd verify` run on the audit branch (documentation-only
change; no 2023 code added). Result recorded in task_plan.

## Open Questions for Primary Codex

1. Is the comparison transcript (`solutions/2023/math2_2023/math2_2023.md`)
   trusted as a complete primary for 2023? If yes, option (b) is cheapest.
2. Should the 2023 paper (MinerU) be re-OCR'd to recover Q2/Q4/Q6/Q7/Q9 options?
3. Is a schema relaxation (option c) acceptable for any year, or is A–D
   completeness a hard gate for all Math2 staging?
