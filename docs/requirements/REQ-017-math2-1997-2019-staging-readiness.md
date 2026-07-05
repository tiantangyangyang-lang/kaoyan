# REQ-017 Math2 1997-2019 Aggregate Split/Staging Readiness

## Problem And User Value

The Math2 1987-2019 aggregate source has already yielded Math3 staging candidates for 1987-1996 because those headings identify the subject as paper three. The remaining 1997-2019 portion must be split and audited before safe Math2 staging or database import can happen.

This requirement supports website launch by identifying the largest safe Math2 historical batch without inventing answers, explanations, options, or formulas.

## In Scope

- Start from latest `main` on an isolated branch.
- Read prior Math2 requirement outputs that constrain aggregate handling.
- Audit the read-only aggregate question and solution sources under `D:\work\Kaoyan-Math2-Papers`.
- Record source repo branch, commit, dirty state, file hashes, line counts, and scan summaries.
- Split 1997-2019 by year when deterministic boundaries are available.
- Generate schema-valid staging only for years that pass mechanical and source-role checks.
- Keep every staging record as `reviewStatus: needs_human_review` and `finalizationStatus: blocked`.
- Add recurring Makefile targets for any new deterministic transform or validation flow.
- Add focused tests and run targeted verification plus `make verify`.
- Prepare database import instructions or Make targets for safe staging batches; run live DB commands only after explicit maintainer approval for this requirement.

## Out Of Scope

- Importing 1987-1996 as Math2.
- Promoting staging records to published content.
- Relaxing `math2-question-staging-v2`.
- Inventing or repairing missing content without source evidence.
- UI publication changes unrelated to Math2 1997-2019 staging readiness.
- Mixing unrelated website launch work into this PR.

## Acceptance Criteria

- Requirement report exists under `content/reports/req-017-math2-1997-2019-staging-readiness/`.
- Source inventory records the aggregate question and solution source paths, hashes, line counts, source repo commit, branch, and dirty state.
- Audit output lists year boundaries, question boundaries, option completeness, answer/explanation markers, and blockers.
- For every generated staging year, `questions.json` validates against the existing staging schema and uses option objects shaped as `{"label","value"}`.
- Generated records preserve missing answers or explanations as `null` with missing status rather than invented content.
- Human-review checklist and KaTeX validation output are generated for every generated year.
- Makefile targets expose the deterministic workflow.
- Tests cover the split/transform behavior and safety invariants.
- PR handoff reports safe years, blocked years, verification commands, and database import boundary.

## Constraints

- `D:\work\Kaoyan-Math2-Papers` is read-only.
- DeepSeek API secrets must not be read, printed, committed, logged, or sent anywhere. If used, DeepSeek may only perform mechanical extraction checks, not final judgment.
- Do not run live DB dry-run or commit unless `DATABASE_URL` is configured and the maintainer explicitly approves this requirement's database action.
- Do not commit `.env`, credentials, `DATABASE_URL`, SSL secrets, or generated secret-bearing logs.
- Keep this PR focused on Math2 1997-2019 aggregate readiness.

## Verification Commands

```powershell
mingw32-make NPM=npm.cmd math2-1997-2019-validate
mingw32-make NPM=npm.cmd verify
```

Additional database dry-run/commit commands may be listed after staging safety is established and approval is granted.
