# REQ-002: Math2 Markdown Import

## Status

Pilot contract frozen. No Math2 content is approved for frontend publication.

## Goal

Import a bounded, traceable pilot of Kaoyan Math2 exam questions and solutions from the read-only source repository `D:\work\Kaoyan-Math2-Papers` into validated staging artifacts in this repository.

## Scope

- Audit and pair Math2 paper Markdown with solution Markdown.
- Define and validate one canonical question schema.
- Build a deterministic converter for one representative pilot year.
- Store staged and eventually published Math2 content in the existing MySQL database.
- Provide bounded, filterable API reads and per-question detail reads.
- Preserve source paths, source repository commit, dirty-state disclosure, and file hashes.
- Produce machine-readable anomalies instead of filling uncertain content.
- Validate schema completeness, question boundaries, options, answers, Markdown/LaTeX, and deterministic reruns.

## Exclusions

- Full-bank conversion or frontend publication before pilot review.
- Dynamic explanations, generated explanations, and Motion animations.
- Copying generated Math2 JSON into `apps/web/public/data` or another frontend static asset.
- Editing `D:\work\Kaoyan-Math2-Papers`.
- Inventing answers, options, question text, formulas, images, or missing years.
- Resolving mathematical ambiguity without explicit source evidence.
- Delegating schema, parsing, ambiguity, mathematical correctness, architecture, review, or acceptance decisions to an external coding agent.

## Canonical Schema

The pilot uses `math2-question-staging-v2`.

Each question must contain all frontend-facing fields even while blocked:

- `stableId`, `sourceYear`, `subjectCode`, `type`, and `questionNumber`;
- non-empty `stem`;
- `options`, always an array;
- `answer`, always a string or `null`;
- `answerStatus`;
- `explanation`, always a string or `null`;
- `explanationStatus`;
- `reviewStatus`, fixed to `needs_human_review`;
- `finalizationStatus`, fixed to `blocked` for this pilot;
- `knowledgePoints`, always an array;
- `anomalies`, always an array;
- source evidence and hashes.

An option is exactly:

```json
{
  "label": "A",
  "value": "option Markdown"
}
```

`option.text` is forbidden. Multiple-choice records must have labels `A`, `B`, `C`, and `D` exactly once or carry a publication-blocking anomaly and fail pilot acceptance.

Staging data is not a frontend question bank. Publication requires a separate reviewed promotion step; `apps/web` must not read `content/staging/math2/`.

## MySQL Contract

Math2 content is stored in two tables:

- `kaoyan_content_batches`: one import/version candidate for one subject and year;
- `kaoyan_questions`: question records scoped to a batch.

The batch records source repository metadata, input file hashes, schema version, content hash, expected/actual counts, review status, and lifecycle status.

The question table stores:

- stable ID, subject, year, number, and type;
- stem and canonical `options[].value`;
- answer and explanation with explicit statuses;
- source traceability;
- review and finalization statuses;
- knowledge points and anomalies.

Batch lifecycle values are `staging`, `published`, `superseded`, and `failed`.

- Import creates or replaces one `staging` batch inside a transaction.
- All records are validated before the first insert.
- Any insert, count, or integrity failure rolls back the entire transaction.
- Dry-run executes the same statements and validations, then always rolls back.
- Staging import never changes the currently published batch.
- Publication is a separate transaction that verifies the complete year, supersedes the previous published batch, and publishes exactly one new batch.
- A generated unique publication slot prevents more than one published batch for the same subject/year even if application logic fails.
- REQ-002 implements no publication command and publishes no Math2 batch.

## API and Access Decision

Published Math2 content reads are public. Learning-state reads and writes remain authenticated.

Rationale:

- Guests should be able to learn without registration or downloading the whole bank.
- Question content is not user-private; requiring authentication would add friction without protecting learning state.
- Attempts, notes, wrong-book state, and paper sessions are user data and remain behind the existing session authentication.

Endpoints:

- `GET /api/content/math2/questions?page=1&pageSize=20&year=2020&type=multiple_choice`
  - public;
  - returns only published batches;
  - returns bounded metadata, stem preview/full stem, and options;
  - omits answer, explanation, source traceability, and internal anomalies;
  - maximum page size is 50.
- `GET /api/content/math2/questions/:stableId`
  - public;
  - returns one full published question, including answer/explanation and user-safe content status;
  - does not expose internal source paths, hashes, or raw anomaly payloads.
- Existing `/api/learning-state/math2` reads/writes remain authenticated.

Security and caching:

- Public content routes are read-only, parameter-validated, rate-limited, and served only from `published` batches.
- Responses use `Cache-Control: public` with short list caching and longer detail caching.
- No cookies or authentication state affect content responses, so shared caches are safe.
- Frontend Math2 content requests explicitly use `credentials: "omit"`.
- Internal traceability and anomaly evidence remain in MySQL and staging reports, not public API payloads.
- CORS remains restricted to the configured web origin for browser use.

## Frontend Delivery Contract

- No Math2 generated JSON is copied into `apps/web/public/data`.
- The frontend contains only lightweight types/API helpers and, after publication approval, bounded list/detail UI.
- Lists fetch pages on demand; selecting a question fetches its detail on demand.
- No prefetch of the full Math2 bank.
- The current pilot stays unavailable in the UI because its database batch is `staging`, not `published`.
- Math1 static delivery is unchanged in REQ-002.

## Source Traceability

Every generated artifact must identify:

- source repository path;
- source repository commit;
- source repository dirty state;
- exact paper and solution relative paths;
- SHA-256 for each consumed source file;
- converter version or target repository commit when available.

Untracked source files are permitted only when their untracked status and SHA-256 are recorded explicitly.

Pilot sources:

| Role | Relative path | Git state | SHA-256 |
|---|---|---|---|
| primary paper transcription | `papers/MinerU_markdown_math2_2020_2065687152877731840.md` | untracked | `12b4c86d1e5ad865f2354e62d1d64ea6d8472f6d07f2cf457127d77d94b7091d` |
| comparison paper transcription | `solutions/2020/math2_2020/math2_2020.md` | tracked | `539e2ecb995ce03ad1c2207c1855321732eec3b7c0211c9011477fcb0cd611e7` |

The source commit is `fd42c56eed412cce0cb97d6bd688f314c78e542e`, with a dirty worktree caused by five untracked paper Markdown files.

## Markdown and LaTeX Conventions

- Preserve mathematical meaning and source spelling; do not algebraically simplify or repair formulas.
- Normalize only newlines, surrounding whitespace, and option-marker presentation.
- Keep inline math as `$...$` and display math as `$$...$$`.
- Do not convert source image references into invented text.
- Validate every delimited expression with the same KaTeX package used by `apps/web`.
- Record unmatched delimiters and KaTeX parse failures as publication-blocking anomalies.
- Retain exact source paths and line ranges so normalized text can be compared with the original.

## Anomaly Policy

- Fail closed on malformed question boundaries or schema violations.
- Record missing or ambiguous answers as anomalies; never infer them silently.
- Record image references and OCR noise with source location evidence.
- Keep unresolved questions out of publishable output.
- Treat parser warnings as deterministic, reviewable data.
- A file path does not determine its content role. A paper-like file under `solutions/` is classified as a comparison transcription, not a solution.
- Wrong-subject labels such as the 2021 `数学三` title block conversion.
- Formula dimension conflicts such as 2020 Q22's three-variable quadratic forms with four-dimensional transformation vectors block publication.
- Missing answers and explanations are valid staging states but block publication.

## Duplicate and Version Policy

- Pair paper and solution by exam subject and year, not filename proximity alone.
- Detect duplicate year/version candidates before conversion.
- Select no canonical version silently.
- Record all candidates, hashes, and the explicit selection reason.
- Textually different transcriptions of the same exam are retained as version candidates, not merged field by field.
- The pilot selects the 2020 MinerU paper as primary because it has all 23 explicit question boundaries and complete A–D option markers for Q1–Q8.
- The 2020 file under `solutions/` is comparison-only because it has no explicit answer or explanation markers and omits Q6's D label.

## Pilot

The pilot is Math2 2020, exactly 23 questions:

- 8 multiple choice;
- 6 fill-in-the-blank;
- 9 solution/proof questions.

All 23 answers and explanations remain `null` with status `missing`. Q22 must carry a formula-dimension anomaly. The comparison transcript's missing Q6 D label must be recorded without weakening the complete primary-paper option set.

The pilot stays under `content/staging/math2/2020/` and is not wired into `apps/web`.

Math2 2021 is excluded from the pilot because both Markdown candidates are titled `数学三` and contain severe OCR loss. Math2 2022 is excluded because its question markers and answers contain severe OCR corruption. Full 1987–2019 conversion is excluded because the combined files require a separate per-year split contract.

## Acceptance Criteria

- [x] Source baseline records commit, dirty state, relative paths, byte counts, and SHA-256.
- [x] Paper/solution inventory identifies available years, missing counterparts, and duplicate/version candidates.
- [x] Canonical schema is explicit and rejects `option.text`/`option.value` drift.
- [x] Pilot parser has deterministic tests for boundaries, options, answers, anomalies, and reruns.
- [x] Pilot artifacts include source traceability and no invented answers.
- [x] KaTeX-oriented validation reports unsupported or malformed math without silently rewriting meaning.
- [x] Partial or invalid records cannot reach frontend content.
- [x] MySQL dry-run rolls back all pilot inserts and partial failures roll back the full batch.
- [x] Public list/detail API returns only published content; learning-state writes remain authenticated.
- [x] No Math2 static question-bank asset or full-bank frontend bundle is created.
- [x] Root Makefile exposes recurring audit/pilot/verification commands when needed.
- [x] `mingw32-make NPM=npm.cmd verify` passes.
- [x] Source repository git state and consumed-file hashes are unchanged after work.
- [x] Branch uses Conventional Commits and PR #2 references REQ-002.
