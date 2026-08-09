# Published content corrections

This workflow changes only an audited override layer. It does not rewrite the
published batch, stable ID, subject, year, approval state, provenance, or source
evidence.

## Make one correction

1. Copy `content/examples/content-override.math1-2025-q04.json` to a temporary
   JSON file and change `stableId`, `reason`, and only the fields under `changes`.
2. Set `expectedRevision` to `0` for the first correction. For later corrections,
   use the `revision` returned by the previous committed command.
3. Load the database environment without displaying it, then dry-run:

```powershell
$env:DOTENV_CONFIG_PATH='D:/work/kaoyan/.env'
mingw32-make NPM=npm.cmd content-override-dry-run PATCH='D:/path/to/fix.json'
```

The result must say `"transaction": "rolled_back"`. Review the stable ID,
subject, revision, and hashes, then commit the exact same file:

```powershell
mingw32-make NPM=npm.cmd content-override-commit PATCH='D:/path/to/fix.json'
```

The result must say `"transaction": "committed"`. Reload the question page.
Authenticated API reads see every subject override. Anonymous Math1 2018-2025
reads receive the small public override payload after the static bank appears.

Allowed `changes` keys are `stem`, `options`, `answer`, `answerStatus`,
`explanation`, and `explanationStatus`. For a multiple-choice question, options
must be exactly four ordered A-D `{"label","value"}` objects. Options are
rejected for every other question type. Unknown keys are rejected before a
transaction.

## Revert without deleting history

Use the latest returned revision as `expectedRevision`. Set `targetRevision` to
`0` to disable the override, or to an earlier revision to restore that patch:

```json
{
  "schemaVersion": "kaoyan-content-override-v1",
  "action": "revert",
  "stableId": "math1-2025-q04",
  "expectedRevision": 2,
  "editor": "maintainer",
  "reason": "Restore the published base after source correction",
  "targetRevision": 0
}
```

Always run the revert with `content-override-dry-run` first, then use
`content-override-commit`. Each action appends an immutable audit revision.

## When not to use this command

Use the normal source/promotion workflow when changing a stable ID, subject,
year, approval/publication state, provenance, or many questions from a corrected
source. This command is for small, verified content corrections only.
