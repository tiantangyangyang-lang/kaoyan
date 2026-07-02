# REQ-013 Math2 Database Import Readiness

## Problem and User Value

The maintainer now wants Math2 data to move from static preview artifacts toward
database-backed content, and then continue the remaining Math2 years. The safe
first step is to make database import repeatable for the already-staged and
validated Math2 years, without mixing incomplete source-audit work into the same
PR.

## Scope

In scope:

- Add Makefile-driven database import commands for the already-staged Math2
  years:
  - 2020: `content/staging/math2/2020/questions.json`
  - 2023: `content/staging/math2/2023/questions.json`
  - 2024: `content/staging/math2/2024/questions.json`
- Keep default import commands as transactional dry-runs.
- Add an explicit commit command path that requires `DATABASE_URL` and `--commit`.
- Preserve the current staging-only batch lifecycle unless a later publication
  requirement explicitly promotes batches to `published`.
- Create a concrete remaining-years roadmap for 2021, 2022, and 1987-2019.

Out of scope:

- Directly importing 2021, 2022, or 1987-2019 before they have validated staging
  artifacts.
- Splitting the 1987-2019 aggregate source in this PR.
- Repairing OCR/source-role blockers for 2021 or 2022 in this PR.
- Publishing database batches through the public API.
- Inventing answers, explanations, options, formulas, or source traceability.
- Editing `D:/work/Kaoyan-Math2-Papers`.

## Acceptance Criteria

- The Makefile exposes year-specific dry-run targets for Math2 2020, 2023, and
  2024.
- The Makefile exposes a single multi-year dry-run target for Math2 2020, 2023,
  and 2024.
- The Makefile exposes an explicit multi-year commit target for those same years.
- The commit target is clearly named and does not run as part of `make verify`.
- Existing import validation still rejects:
  - non-canonical option shapes such as `option.text`;
  - duplicate stable IDs;
  - year/stableId mismatches;
  - non-contiguous question numbers.
- The report records whether `DATABASE_URL` was present and whether live commit
  was run.
- Remaining-years plan is explicit:
  - 2021 and 2022 require separate source-role/OCR repair tasks before staging;
  - 1987-2019 requires aggregate split-by-year and 1987-1996 historical
    subject-title review before staging.

## Constraints

Data:

- Do not mutate source files under `D:/work/Kaoyan-Math2-Papers`.
- Do not invent missing answers or explanations.
- Keep Math2 staging records as `reviewStatus: needs_human_review` and
  `finalizationStatus: blocked` unless a later promotion requirement changes
  that rule.

Database:

- MySQL is the production database.
- Application tables remain under the `kaoyan_` prefix.
- Imports must remain transactional.
- Dry-run imports must roll back.
- Live commit imports require an explicit `DATABASE_URL` and explicit command
  invocation.

Compatibility:

- Do not remove the existing single-file `import:math2` script.
- Do not change API publication semantics: public content APIs still read only
  `published` batches.

## Verification Commands

Run from the repository root:

```powershell
mingw32-make NPM=npm.cmd math2-db-preview-import-dry-run
npm.cmd run typecheck --workspace @kaoyan/api
npm.cmd run test --workspace @kaoyan/api
mingw32-make NPM=npm.cmd verify
```

Live commit command, only when the maintainer has configured and confirmed the
target database:

```powershell
mingw32-make NPM=npm.cmd math2-db-preview-import-commit
```
