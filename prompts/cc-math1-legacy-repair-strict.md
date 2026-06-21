Execute a strict Math1 {{YEAR}} legacy staging repair.

This task is for years where prior review has already found reproducible legacy parser defects.
Do not treat the existing staging package as valid just because counts, IDs, or JSON parsing pass.

Read first:
- `真题内容解析与代理处理规范.md`
- `content/reports/math1-1987-2025/batch-manifest.json`
- `content/reports/math1-{{YEAR}}/structure-repair-report.md`
- `content/review/math1/{{YEAR}}/questions-structure-repaired.json`
- `content/review/math1/{{YEAR}}/anomalies-reviewed.json`
- `content/reports/math1-{{YEAR}}/human-review-checklist.md`
- current `content/staging/math1/{{YEAR}}/questions.json`

Allowed outputs:
- `content/staging/math1/{{YEAR}}/questions.json`
- `content/staging/math1/{{YEAR}}/anomalies.json`
- `content/staging/math1/{{YEAR}}/validation.json`
- `content/staging/math1/{{YEAR}}/summary.md`
- `content/reports/math1-{{YEAR}}/legacy-repair-strict-report.md`
- directly relevant `scripts/` and `tests/` only if needed for a deterministic repair helper

Required behavior:
1. Use only the source mirror provided in the run directory for paper and solution source evidence.
2. Use `questions-structure-repaired.json` and `structure-repair-report.md` as the deterministic repair reference. They are review-side evidence of defects that must be propagated into staging.
3. Preserve source tracking fields, hashes, source year, source paths, source commit, dirty flag, stable IDs, and `needs_human_review`.
4. Do not invent missing mathematical answers. For solution questions without explicit short-answer markers, keep `answerCandidate=null` and `answerStatus=missing` while preserving the full explanation.
5. Do not silently repair OCR or formula issues that require PDF evidence. Keep them as anomalies unless the exact correction is already source-supported by the paper/solution Markdown or the structure-repair report.
6. If the current year is 2002, the repaired staging must at minimum:
   - split Q1 explanation content into independent Q1-Q5 answer/explanation candidates;
   - split Q6 explanation content into independent Q6-Q10 answer/explanation candidates;
   - restore Q10 to complete A-D structured options;
   - keep the known Q6 OCR issue and Q9 image dependency as human-review anomalies.
7. If the current year is 2003, the repaired staging must at minimum:
   - replace Q1 and Q2 misattributed explanations with the correct Q1/Q2 solution blocks from the solution source;
   - split Q7 bundled explanation content into independent Q7-Q12 answer/explanation candidates;
   - restore Q20 explanation from the explicit solution source block;
   - keep the Q7 missing image dependency as a human-review anomaly unless the image is present in the provided source mirror.
8. Update validation and summary files so they describe the repaired staging, not the old verified-only state.
9. A run that only verifies existing staging is a failure for this task. If no staging file changes are needed, set status to `failed` and explain why the strict repair reference was wrong.
10. `agent-result.json` must report non-empty `changedFiles` unless the task status is `failed` or `blocked`.

Verification required before finishing:
- JSON parse for all staging JSON outputs.
- `totalQuestions == len(questions)`.
- stable IDs unique and sequential for the year.
- all questions remain `needs_human_review`.
- no `approved` or `published` status appears anywhere in changed JSON.
- source mirror and original source repository are unmodified.

Return a concise report with:
- exact staging files changed;
- which previously known defects are resolved;
- which anomalies remain for human/PDF review;
- the command(s) used for verification.
