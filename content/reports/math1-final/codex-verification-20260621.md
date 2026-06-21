# Math1 Final Aggregation Codex Verification

## Conclusion

The corrected Math1 final aggregation is accepted.

- Available years: 38 (1987-2025 excluding source-blocked 1994)
- Total questions: 852
- `ready_for_approval`: 671
- `ready_with_info`: 175
- `blocked`: 6
- All 852 stable IDs are unique.
- All 852 questions remain `needs_human_review`.
- No question is marked `approved` or `published`.

## Wrapper Failure

Claude run `20260621-062733-cc-finalize-summary` completed with process exit
code 0, source integrity passed, and output integrity passed. The wrapper
rejected the run because `agent-result.json` omitted one changed project path:

`content/reports/math1-final/build-final-v2.js`

This was a result-contract bookkeeping failure, not a source or question-bank
integrity failure.

## Defects Corrected After The Run

The Claude-generated v3 builder still had two defects:

1. A summary number in the 2023 report was interpreted as Q13, incorrectly
   marking `math1-2023-q13` blocked.
2. The batch report inserted the output-file section inside the validation loop.

`content/reports/math1-final/build-final-v4.js` fixes both issues and rejects
any year with unresolved per-question classification instead of defaulting.

## Independent Verification

Codex independently ran:

- Node `JSON.parse` on all three final JSON files
- Python `json.load` on all three final JSON files
- Windows PowerShell `ConvertFrom-Json` on all three final JSON files

All checks passed.

Regression checks passed:

- `math1-2004-q19` is blocked.
- `math1-2004-q23` is `ready_for_approval`.
- `math1-2023-q07` is `ready_with_info`.
- `math1-2023-q13` is `ready_for_approval`.
- `math1-2024-q06` is blocked.
- `math1-2024-q22` is `ready_for_approval`.
- 2002 is 18 RFA / 2 RWI / 0 BLK.
- 2010 is 23 RFA / 0 RWI / 0 BLK.

Current blocked question IDs:

- `math1-2004-q19`
- `math1-2024-q06`
- `math1-2025-q04`
- `math1-2025-q09`
- `math1-2025-q10`
- `math1-2025-q17`

## Canonical Outputs

- `content/final/math1/question-bank.json`
- `content/final/math1/year-summary.json`
- `content/final/math1/validation.json`
- `content/reports/math1-final/batch-report.md`
- `content/reports/math1-final/blocked-items.md`
- `content/reports/math1-final/build-final-v4.js`

The earlier `build-final-v2.js` and `build-final-v3.js` files are retained only
as audit history.
