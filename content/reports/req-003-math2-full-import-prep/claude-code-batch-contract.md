# Claude Code Mechanical Batch Contract

## Purpose

Claude Code may be used only for repetitive, local, per-year conversion mechanics
after the primary Codex owner has frozen the schema, selected exact source paths,
approved year/version grouping, and supplied expected validation commands.

## Non-Delegable Decisions

Claude Code must not decide:

- source role or subject identity;
- whether Math3-labeled content can be treated as Math2;
- how to split ambiguous historical years;
- whether OCR-corrupted text is recoverable;
- whether to select one version over another;
- whether to change schema;
- whether to publish a batch;
- whether to add frontend/API functionality;
- whether to invent or infer answers.

## Required Handoff Fields

Each handoff must include:

- `batchId`
- `year`
- source root
- source commit
- source dirty state
- exact allowed read paths
- exact allowed write paths
- forbidden paths
- input SHA-256 hashes
- expected output files
- expected question counts or a statement that counts are audit-only
- allowed anomaly types
- deterministic validation commands
- dry-run import command or explicit dry-run prohibition
- rollback requirement
- result contract

## Stop Conditions

Claude Code must stop and return a report if it sees:

- source hash mismatch;
- extra source path needed;
- missing or duplicate question boundaries;
- wrong-subject title;
- OCR corruption that changes math meaning;
- unresolved image reference;
- answer/explanation ambiguity;
- `option.text`;
- schema violation;
- KaTeX failure;
- unexpected database write requirement;
- any need to edit forbidden paths.

## Tenant Policy Boundary

If external Claude Code is unavailable because of tenant policy, keep this prompt
as a local handoff artifact. Do not bypass policy, copy credentials, use an
unapproved endpoint, or route the task through another service.

## Result Report Template

```markdown
# Batch Result: <batchId>

## Inputs
- Source root:
- Source commit:
- Source dirty state:
- Files read:
- Hash check:

## Outputs
- Changed files:
- Questions generated:
- Questions skipped:
- Question counts by type:
- Anomaly counts:
- Image references:

## Validation
- Commands:
- Results:
- Deterministic rerun:
- KaTeX:
- Schema:
- Dry-run import and rollback:

## Blockers
- Unresolved anomalies:
- Stop conditions triggered:

## Boundary Confirmation
- Source repo unchanged:
- Forbidden paths unchanged:
- No frontend publication:
- No DB publication:
```
