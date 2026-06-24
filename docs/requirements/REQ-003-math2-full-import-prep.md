# REQ-003: Math2 Full Import Preparation

## Status

Drafted for follow-up implementation on branch `codex/math2-full-import-prep`.
No broad Math2 import, publication, frontend bundle, dynamic explanations, or Motion
animations are approved by this requirement.

## Problem and User Value

REQ-002 proved a bounded Math2 2020 staging pilot, a schema, a transactional MySQL
dry-run path, and public published-only content APIs. The next useful step is to
prepare the full Math2 import as controlled per-year work so repetitive conversion
can be delegated safely without giving a mechanical agent authority over source
interpretation, schema decisions, mathematical ambiguity, or publication.

This requirement creates reusable queues, validation gates, human spot-check
checklists, and Claude Code handoff prompts. It does not import the full bank.

## Source Baseline

The source repository is strictly read-only:

- Path: `D:\work\Kaoyan-Math2-Papers`
- Branch: `main`
- Commit: `fd42c56eed412cce0cb97d6bd688f314c78e542e`
- Current dirty state: dirty because five MinerU Markdown paper files are untracked
- Current inventory command: `python scripts/inventory_math2_markdown.py D:\work\Kaoyan-Math2-Papers content/reports/req-003-math2-full-import-prep/source-inventory.json`
- Current inventory result: 775 files, 770 tracked, 5 untracked, 727 JPG, 24 JSON, 12 Markdown, 12 PDF, 11 audited non-README Markdown files, 20 remote image references, 0 missing relative image references

The five untracked source files are allowed as read-only inputs only when their
untracked state and SHA-256 are recorded:

- `papers/MinerU_markdown_math2_1987-2019_2065686324641095680.md`
- `papers/MinerU_markdown_math2_2020_2065687152877731840.md`
- `papers/MinerU_markdown_math2_2021_2065687851346780160.md`
- `papers/MinerU_markdown_math2_2022_2065687890395758592.md`
- `papers/MinerU_markdown_math2_2023_2065687933685170176.md`

The source repository must be checked again after work. Its commit and dirty state
must remain unchanged.

## In Scope

- Define REQ-003 scope, exclusions, acceptance criteria, validation gates, and
  delegation boundaries.
- Produce a per-year preparation queue for Math2 years 1987-2024 using Markdown
  as primary evidence when usable Markdown exists.
- Preserve the REQ-002 `math2-question-staging-v2` schema and 2020 pilot as the
  gold reference.
- Produce deterministic validation commands for each future batch.
- Produce a human spot-check checklist that blocks prior Math1/Math2 failure modes.
- Produce Claude Code mechanical-batch prompts that stop on anomalies instead of
  inventing answers or silently selecting versions.
- Document dry-run import and rollback requirements for each future batch.

## Out of Scope

- Running a broad or full Math2 import.
- Publishing any Math2 year.
- Copying Math2 question-bank JSON into `apps/web/public/data` or another frontend
  static asset.
- Adding Math2 dynamic explanations, generated explanations, or Motion animations.
- Changing `apps/web` content delivery or bundling behavior.
- Changing API behavior beyond documenting existing gates.
- Editing `D:\work\Kaoyan-Math2-Papers`.
- Treating PDF as primary when usable Markdown exists.
- Delegating source role interpretation, year/version grouping, schema design,
  acceptance decisions, mathematical ambiguity, or publication to Claude Code.
- Circumventing tenant policy if external Claude Code is unavailable.

## Source Grouping and Queue Policy

The queue is grouped by source risk:

- `2020`: frozen reference pilot. It remains the gold validation gate and is not
  queued for broad re-import.
- `2023`: paper-only staging candidate. Both Markdown candidates contain Q1-Q22
  but no explicit answers or explanations.
- `2024`: role-ambiguous paper-like candidate under `solutions/`, with three local
  image references and no paper candidate under `papers/`.
- `2021`: blocked audit candidate because both Markdown files identify the exam as
  Math3.
- `2022`: blocked audit candidate because ordinary marker scans miss expected
  question boundaries and OCR corruption is severe.
- `1987-2019`: split-preparation source. The combined paper and solution Markdown
  must be split by year first; no combined all-years import is allowed. Years
  1987-1996 require historical subject-title review because headings say `试卷三`.

Each future per-year batch must produce only staging outputs under
`content/staging/math2/<year>/` and reports under `content/reports/math2-<year>/`.
Every output remains `reviewStatus: needs_human_review` and
`finalizationStatus: blocked` until a separate reviewed promotion requirement exists.

## Data and Schema Constraints

- Schema: `content/schema/math2-question-staging-v2.schema.json`.
- Reference pilot: `content/staging/math2/2020/questions.json`.
- Option shape is exactly `{"label": "A", "value": "..."}`.
- `option.text` is forbidden.
- Missing answers and explanations must be `null` with status `missing`.
- Source paths, source commit, dirty state, file hashes, line ranges, and anomaly
  evidence must be preserved.
- Image references must be recorded as source evidence. Missing, remote, or
  role-ambiguous images block publication.
- OCR noise, malformed boundaries, duplicate/version mistakes, and unresolved
  mathematical ambiguity must be anomalies, not silent repairs.

## Authentication, Publication, and Frontend Constraints

- MySQL staging imports must use the existing transactional importer and rollback
  path from REQ-002.
- Dry-run must execute the same validation and SQL path, then roll back.
- No half-published year is acceptable. Publication remains out of scope.
- Public content APIs may read only `published` batches.
- REQ-003 must not make staged Math2 content visible in the frontend.
- Math1 static delivery is unchanged.

## Delegation Contract

Primary Codex owns:

- source audit interpretation;
- year/version grouping;
- schema and validation gate changes;
- acceptance criteria;
- anomaly policy;
- human spot-check policy;
- database publication decisions;
- PR review and final verification.

Claude Code may receive only frozen mechanical batches after the 2020 pilot contract
is treated as the reference. Each handoff must include exact allowed paths, forbidden
paths, input year, expected output paths, deterministic validation commands, and a
result contract. Claude Code must stop on anomalies and must not invent answers,
repair formulas by judgment, select versions, publish, commit, push, or modify
frontend/API code.

If external Claude Code is blocked by tenant policy, keep the prompts and queue as
local handoff artifacts. Do not bypass policy.

## Verification Commands

Small REQ-003 documentation gate:

```powershell
mingw32-make NPM=npm.cmd math2-inventory
mingw32-make NPM=npm.cmd test-math2
```

Full PR gate:

```powershell
mingw32-make NPM=npm.cmd verify
```

Future per-year batch gate, after a year-specific converter and test exist:

```powershell
python scripts/transform_math2_<year>.py D:\work\Kaoyan-Math2-Papers content/staging/math2/<year>
node scripts/validate_math2_katex.mjs content/staging/math2/<year>/questions.json content/staging/math2/<year>/katex-validation.json
python -m unittest tests.test_transform_math2_<year> -v
mingw32-make NPM=npm.cmd math2-import-dry-run
```

`math2-import-dry-run` requires a configured `DATABASE_URL`. If it is unavailable,
the PR must state that the live database dry-run was not executed and cite the
existing transactional unit coverage.

## Acceptance Criteria

- [ ] REQ-003 exists and records scope, exclusions, constraints, validation gates,
      human review policy, Claude Code delegation boundaries, and acceptance criteria.
- [ ] Source inventory is rerun from `D:\work\Kaoyan-Math2-Papers` and records commit,
      dirty state, file counts, source paths, hashes, years, pairings, and anomalies.
- [ ] The source repository commit and dirty state are recorded before and after work
      and remain unchanged.
- [ ] A per-year queue covers 1987-2024 without approving a combined 1987-2019 import.
- [ ] Each batch records allowed source paths, forbidden paths, expected outputs,
      deterministic validation commands, dry-run import command, rollback requirement,
      and result contract.
- [ ] The queue keeps 2021, 2022, 2024, and 1987-1996 blocked until their specific
      source anomalies are reviewed.
- [ ] A human spot-check checklist guards against option shape drift, invented answers,
      malformed boundaries, duplicate/version mistakes, missing years, image references,
      OCR noise, KaTeX failures, partial-field frontend/API crashes, and half-published
      DB years.
- [ ] Claude Code handoff prompt and queue files state exact allowed paths, forbidden
      paths, deterministic validation, expected result contract, and stop-on-anomaly
      behavior.
- [ ] No Math2 content is added to frontend static assets or bundled.
- [ ] No broad/full Math2 import is run.
- [ ] No dynamic explanation or Motion animation work is added.
- [ ] Smallest meaningful verification is run and reported. If code/docs changed enough,
      `mingw32-make NPM=npm.cmd verify` is run before commit.
- [ ] Branch uses Conventional Commits, is pushed, and a dedicated PR references this
      requirement.
