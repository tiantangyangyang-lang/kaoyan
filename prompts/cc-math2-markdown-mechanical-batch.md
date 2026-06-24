# Claude Code Handoff: Math2 Mechanical Markdown Batch

Do not run this prompt until the primary Codex owner has approved the REQ-002 pilot and supplied one explicit year, exact input files, expected question counts, and hashes.

External Claude Code access may be unavailable because of tenant policy. Do not bypass policy, copy credentials, use an unapproved endpoint, or route the task through another service. If Claude Code is unavailable, return this prompt to the primary Codex owner for local execution.

## Frozen Contract

- Requirement: `docs/requirements/REQ-002-math2-markdown-import.md`
- Schema: `content/schema/math2-question-staging-v2.schema.json`
- Reference converter: `scripts/transform_math2_2020.py`
- Reference tests: `tests/test_transform_math2_2020.py`
- Option shape: `{"label": "A", "value": "..."}`; `option.text` is forbidden.
- Missing answers or explanations remain `null` with status `missing`.
- Every record remains `needs_human_review`.
- No record may be published or connected to `apps/web`.

## Primary-Agent Decisions You Must Not Change

- Selected year: `[YEAR]`
- Primary paper role/path/hash: `[PRIMARY_PATH]` / `[PRIMARY_SHA256]`
- Comparison or solution role/path/hash: `[SECONDARY_PATH]` / `[SECONDARY_SHA256]`
- Expected question counts: `[COUNTS]`
- Allowed anomaly types: `[ANOMALY_TYPES]`
- Explicit version-selection rule: `[VERSION_RULE]`

Stop if any placeholder remains unresolved.

## Allowed Reads

- The exact source files listed above, read-only.
- `docs/requirements/REQ-002-math2-markdown-import.md`
- `content/schema/math2-question-staging-v2.schema.json`
- `scripts/transform_math2_2020.py`
- `tests/test_transform_math2_2020.py`

## Allowed Writes

- `content/staging/math2/[YEAR]/`
- `content/reports/math2-[YEAR]/`
- One year-specific converter under `scripts/`
- One year-specific test under `tests/`

## Forbidden Paths and Actions

- Any write under `D:\work\Kaoyan-Math2-Papers`
- `content/final/`, `content/approved/`, and `content/review/`
- `apps/web/` and `apps/api/`
- Existing Math1 content, scripts, tests, or reports
- Git commit, push, PR creation, deployment, database writes, or publication
- Inventing answers, repairing formulas by mathematical judgment, selecting among ambiguous versions, or changing the schema

## Mechanical Work Only

1. Verify the supplied hashes before parsing.
2. Apply the supplied boundary and role rules exactly.
3. Emit the frozen schema with complete fields.
4. Record every mismatch as an anomaly; do not repair meaning.
5. Run the supplied deterministic validation commands twice.
6. Report changed files, commands, counts, hashes, and unresolved anomalies.

Write the exact result contract requested by
`content/queues/math2-markdown-import-template.json`. The primary Codex agent,
not the delegated batch, runs the MySQL dry-run and reviews the transaction
report.

## Required Validation

```powershell
mingw32-make NPM=npm.cmd math2-pilot
mingw32-make NPM=npm.cmd math2-katex
mingw32-make NPM=npm.cmd test-math2
```

The primary Codex owner performs architecture review, mathematical-boundary review, repository-wide verification, commit, push, and PR creation.
