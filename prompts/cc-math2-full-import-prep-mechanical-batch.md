# Claude Code Handoff: Math2 Full Import Preparation Batch

You are receiving one mechanical Math2 preparation batch. Do not proceed if any
placeholder remains unresolved.

External Claude Code access may be unavailable because of tenant policy. Do not
bypass policy, copy credentials, use an unapproved endpoint, or route this task
through another service. If blocked, return this prompt to the primary Codex owner
for local execution.

## Frozen Contract

- Requirement: `docs/requirements/REQ-003-math2-full-import-prep.md`
- REQ-002 reference: `docs/requirements/REQ-002-math2-markdown-import.md`
- Schema: `content/schema/math2-question-staging-v2.schema.json`
- Reference pilot: `content/staging/math2/2020/questions.json`
- Reference converter: `scripts/transform_math2_2020.py`
- Reference tests: `tests/test_transform_math2_2020.py`
- Option shape: `{"label": "A", "value": "..."}`
- `option.text` is forbidden.
- Missing answers or explanations remain `null` with status `missing`.
- Every record remains `needs_human_review` and `blocked`.
- No record may be published or connected to `apps/web`.

## Batch Inputs

- Batch ID: `[BATCH_ID]`
- Year: `[YEAR]`
- Source root: `D:\work\Kaoyan-Math2-Papers`
- Source commit: `[SOURCE_COMMIT]`
- Source dirty state: `[SOURCE_DIRTY_STATE]`
- Allowed read paths:
  - `[ALLOWED_READ_PATH_1]`
  - `[ALLOWED_READ_PATH_2]`
- Input hashes:
  - `[RELATIVE_PATH]`: `[SHA256]`
- Allowed write paths:
  - `content/staging/math2/[YEAR]/`
  - `content/reports/math2-[YEAR]/`
  - `scripts/transform_math2_[YEAR].py`
  - `tests/test_transform_math2_[YEAR].py`
- Expected outputs:
  - `content/staging/math2/[YEAR]/questions.json`
  - `content/staging/math2/[YEAR]/anomalies.json`
  - `content/staging/math2/[YEAR]/validation.json`
  - `content/staging/math2/[YEAR]/katex-validation.json`
  - `content/staging/math2/[YEAR]/summary.md`
  - `content/reports/math2-[YEAR]/human-review-checklist.md`
- Expected counts: `[EXPECTED_COUNTS_OR_AUDIT_ONLY]`
- Allowed anomaly types: `[ALLOWED_ANOMALY_TYPES]`
- Dry-run import: `[DRY_RUN_COMMAND_OR_FORBIDDEN]`
- Rollback requirement: `[ROLLBACK_REQUIREMENT]`

## Forbidden Paths and Actions

- Do not write under `D:\work\Kaoyan-Math2-Papers`.
- Do not edit `apps/web/**`.
- Do not edit `apps/api/**`.
- Do not edit `content/final/**`, `content/approved/**`, or `content/review/**`.
- Do not edit Math1 content, scripts, tests, or reports.
- Do not commit, push, create a PR, deploy, publish, or write to a live database.
- Do not invent answers, explanations, options, formulas, image descriptions, years,
  or source paths.
- Do not repair formulas by mathematical judgment.
- Do not select among ambiguous versions.
- Do not change the schema.

## Mechanical Steps

1. Verify source commit and dirty state.
2. Verify every supplied hash.
3. Read only allowed source paths.
4. Apply the supplied boundary and role rules exactly.
5. Emit the frozen schema with complete fields.
6. Record every mismatch as an anomaly.
7. Run deterministic validation commands twice.
8. Stop on any unresolved anomaly or forbidden-path need.
9. Return the result report from `content/reports/req-003-math2-full-import-prep/claude-code-batch-contract.md`.

## Required Validation

```powershell
python scripts/transform_math2_[YEAR].py D:\work\Kaoyan-Math2-Papers content/staging/math2/[YEAR]
node scripts/validate_math2_katex.mjs content/staging/math2/[YEAR]/questions.json content/staging/math2/[YEAR]/katex-validation.json
python -m unittest tests.test_transform_math2_[YEAR] -v
```

Run the dry-run import only when the batch explicitly provides a dry-run command.
If dry-run is forbidden, report that it was not run.
