Run the corrected Math1 Markdown-first all-years final aggregation.

Goal:
Aggregate the completed yearly staging/review artifacts into one unapproved,
system-readable Math1 question bank. Do not redo yearly semantic review. Do not
modify any yearly staging, review, or report artifact.

Read:
- content/staging/math1/<YEAR>/questions.json
- content/staging/math1/<YEAR>/anomalies.json
- content/staging/math1/<YEAR>/validation.json
- content/review/math1/<YEAR>/questions-reviewed.json
- content/review/math1/<YEAR>/anomalies-reviewed.json
- content/reports/math1-<YEAR>/md-finalization.md when present
- final 2003 review reports and review JSON
- content/reports/math1-md-finalize-current-state-20260621.md
- content/reports/math1-md-finalize-all-audit-20260620.md as historical evidence only

Current-state precedence:
- The 2026-06-21 current-state report supersedes retry recommendations in the
  historical 2026-06-20 audit.
- The 2002 retry run 20260620-185410-cc-math1-md-finalize-year-2002 completed.
- The 2010 retry run 20260620-190025-cc-math1-md-finalize-year-2010 completed.
- Never recommend rerunning 2002 or 2010.

Year scope:
- Cover 1987-2025.
- Exclude 1994 from question synthesis because its paper source is missing.
- The question bank must contain exactly 38 years.

Required outputs:
1. content/final/math1/question-bank.json
2. content/final/math1/year-summary.json
3. content/final/math1/validation.json
4. content/reports/math1-final/batch-report.md
5. content/reports/math1-final/blocked-items.md
6. content/reports/math1-final/build-final-v2.js

Per-question classification rules:
- Preserve stableId, sourceYear, type, stem, options, answer, explanation,
  source tracking, and reviewStatus.
- Every reviewStatus must remain needs_human_review.
- Add finalizationStatus:
  ready_for_approval | ready_with_info | blocked.
- Resolve every status from an explicit stableId or question number in yearly
  evidence.
- Parse lists, ranges, and per-question tables in md-finalization.md.
- For 2003, derive per-question status from its final review JSON and reports.
- NEVER read only category counts and distribute statuses by array order.
- NEVER use a whole-year default status.
- If a yearly report gives counts but the corresponding question identities
  cannot be recovered, fail the task instead of guessing.
- For every year, the explicit classified ID sets must be disjoint and their
  union must equal the staging stableId set.

Required regression checks:
- math1-2004-q19 is blocked.
- math1-2004-q23 is not blocked.
- math1-2024-q06 is blocked.
- math1-2024-q22 is not blocked.
- 2002 totals: 18 ready_for_approval, 2 ready_with_info, 0 blocked.
- 2010 totals: 23 ready_for_approval, 0 ready_with_info, 0 blocked.
- No current output recommends retrying 2002 or 2010.
- No year has readyStatusSource=default.

Required global checks:
- 38 available years; 1994 recorded only as source_blocked.
- Total question count equals the sum of 38 staging questions.json files.
- stableId is globally unique.
- All reviewStatus values are needs_human_review.
- RFA + RWI + blocked equals total questions globally and per year.
- Staging and review stableId sets match per year.
- Each yearly evidence classification matches the final per-question mapping.
- Run Node JSON.parse, Python json.load, and PowerShell ConvertFrom-Json on all
  three output JSON files.
- JSON must use ASCII double quotes.
- Run helper scripts immediately; never stop to request another approval.

blocked-items.md rules:
- Include 1994 source_blocked.
- Include only current active error/warning items and explicitly blocked questions.
- Do not include resolved historical retry instructions.
- Do not turn info-only items into blocked items.

Forbidden writes:
- content/staging/
- content/review/
- content/reports/math1-<YEAR>/
- content/approved/
- task_plan.md
- notes.md
- source repositories

Create {{RUN_DIR}}\agent-result.json and {{RUN_DIR}}\agent-report.md.
If any mandatory check fails, report failed or blocked; never claim success.
