# Math1 Markdown-First Current State

## Completed Retries

- 2002 run `20260620-185410-cc-math1-md-finalize-year-2002`: completed.
- 2010 run `20260620-190025-cc-math1-md-finalize-year-2010`: completed.
- Both runs passed source integrity, output integrity, Node parsing, Python
  parsing, and PowerShell parsing.

The retry recommendations in
`content/reports/math1-md-finalize-all-audit-20260620.md` are historical and
must not be treated as current blockers.

## First Aggregation Defects

Run `20260620-192210-cc-finalize-summary` has two defects:

1. It copied the resolved 2002/2010 retry recommendations into current reports.
2. It read yearly category counts and assigned statuses by question array order.

This caused identity corruption:

- The 2004 report classifies Q19 as blocked, but the generated bank marked Q23.
- The 2024 report classifies Q6 as blocked, but the generated bank marked Q22.

The corrected aggregation must map every status to an explicit stableId or
question number. Count-only sequential assignment is prohibited.

## Regression Facts

- `math1-2004-q19` is blocked; `math1-2004-q23` is not blocked.
- `math1-2024-q06` is blocked; `math1-2024-q22` is not blocked.
- 2002 is 18 RFA / 2 RWI / 0 BLK.
- 2010 is 23 RFA / 0 RWI / 0 BLK.
- Current reports must not instruct another 2002 or 2010 retry.
