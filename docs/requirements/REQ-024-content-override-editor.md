# REQ-024: Audited Content Override Editor

## Problem and user value

Correcting one published question currently requires a bespoke script, a cloned
year batch, a PR, and a deployment. For a personal project this is too expensive
for routine text corrections. The maintainer needs a safe operation that feels
close to editing the database directly, while preserving validation, audit
history, optimistic locking, public-content behavior, and rollback.

## In scope

- Add persistent question override and immutable override-revision tables.
- Add one generic JSON patch command with dry-run default and explicit commit.
- Support `upsert` and `revert` actions with expected-revision locking.
- Allow only content fields: stem, A-D options, answer/status, and explanation/status.
- Merge active overrides into authenticated API list/detail responses.
- Provide a small public Math1 override endpoint and merge it into the already
  loaded 2018-2025 static bank without blocking initial rendering.
- Add a reusable example patch and exact Make commands.

## Out of scope

- A browser-based administrator page or general database console.
- Editing subject/year/stable ID, approval/publication state, provenance,
  animations, knowledge points, authentication policy, or learning records.
- Replacing the canonical source bank; overrides remain a separate auditable layer.

## Acceptance criteria

1. A maintainer can dry-run and commit a correction using one JSON file and one Make command.
2. Dry-run is the default and rolls back every database mutation.
3. Every commit creates an immutable revision containing action, before/after
   patches, base snapshot hash, editor, reason, and timestamp.
4. `expectedRevision` rejects concurrent or stale edits; invalid fields and
   malformed option shapes are rejected before SQL mutation.
5. Revert can restore revision 0 (no override) or any prior revision without
   deleting audit history.
6. Base published batches/questions remain unchanged; imports and promotions do
   not overwrite the separate override layer.
7. Authenticated list/detail reads merge active overrides after runtime JSON validation.
8. Anonymous Math1 2018-2025 loads the static bank immediately, then merges the
   small public override payload in parallel; Math2/Math3 remain anonymous 401.
9. Existing published counts and stable IDs remain unchanged.
10. Schema SQL and startup initialization stay synchronized; SQL is parameterized.

## Patch format

```json
{
  "schemaVersion": "kaoyan-content-override-v1",
  "action": "upsert",
  "stableId": "math1-2025-q04",
  "expectedRevision": 0,
  "editor": "maintainer",
  "reason": "Remove OCR artifact",
  "changes": {
    "explanation": "Corrected explanation"
  }
}
```

## Constraints

- Data: no raw arbitrary SQL and no changes outside the allowlist.
- Authentication: the operator command uses existing database credentials; no
  public write endpoint is added.
- Performance: override loading must not block the existing static public bank.
- Compatibility: questions without overrides must be byte-for-byte equivalent at the API boundary.
- Secrets: `.env` is process-only and never printed or committed.

## Verification commands

```powershell
mingw32-make NPM=npm.cmd content-override-example-dry-run
mingw32-make NPM=npm.cmd typecheck test build
git diff --check
```
