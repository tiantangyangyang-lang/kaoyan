# REQ-002 Math2 2020 Pilot Report

## Conclusion

The bounded 2020 pilot passes the frozen staging data contract and remains correctly blocked from publication.

## Inputs

- Primary: `papers/MinerU_markdown_math2_2020_2065687152877731840.md`
  - Git state: untracked
  - SHA-256: `12b4c86d1e5ad865f2354e62d1d64ea6d8472f6d07f2cf457127d77d94b7091d`
- Comparison-only: `solutions/2020/math2_2020/math2_2020.md`
  - Git state: tracked
  - SHA-256: `539e2ecb995ce03ad1c2207c1855321732eec3b7c0211c9011477fcb0cd611e7`
- Source commit: `fd42c56eed412cce0cb97d6bd688f314c78e542e`
- Source dirty state: unchanged; the same five MinerU paper Markdown files remain untracked.

## Outputs

- `content/staging/math2/2020/questions.json`
- `content/staging/math2/2020/anomalies.json`
- `content/staging/math2/2020/validation.json`
- `content/staging/math2/2020/katex-validation.json`
- `content/staging/math2/2020/summary.md`

## Measured Result

- Questions: 23
- Multiple choice: 8
- Fill-in-the-blank: 6
- Solution/proof: 9
- Answers present: 0
- Explanations present: 0
- Stable IDs unique: yes
- Primary A–D option sets: 8 of 8 complete
- KaTeX expressions checked: 96
- KaTeX errors: 0
- Schema errors: 0
- Frontend publication: not configured

## Preserved Blocking Anomalies

- The `solutions/2020/` Markdown is a paper transcription, not a verified solution source.
- Every question has an explicit missing-answer/missing-explanation anomaly.
- The comparison transcript lacks an explicit D label for Q6.
- Q22 has a three-variable/four-dimensional formula conflict and was not repaired.

## Verification

`mingw32-make NPM=npm.cmd verify` passed after rerunning outside the filesystem sandbox required by Vite/esbuild:

- 11 focused Math2 tests passed.
- Python scripts and tests compiled.
- Web and API TypeScript checks passed.
- API test passed.
- Web and API production builds passed.
- KaTeX validation passed with 96 expressions and 0 errors.

Full legacy Python discovery is separately available as `make test-python-all`; it is not green on the starting Math1 repository state and remains out of REQ-002 scope.

## MySQL and API Delivery

- Added staging/published batch and batch-scoped question tables to the existing MySQL schema.
- One generated unique slot prevents two published batches for the same subject/year.
- Import validates the complete payload before inserts and uses one transaction.
- Dry-run executes inserts and count verification, then rolls back.
- Tests prove rollback on both successful dry-run and simulated partial insert failure.
- The gold 23-question pilot passes the importer and rolls back all 23 inserts in the test database path.
- No live MySQL dry-run was executed because `DATABASE_URL` is not set in this worktree. The command is `mingw32-make NPM=npm.cmd math2-import-dry-run`.

Public delivery contract:

- list: `GET /api/content/math2/questions`, maximum 50 records;
- detail: `GET /api/content/math2/questions/:stableId`;
- both return only published batches;
- list omits answer/explanation;
- public payloads omit source paths, hashes, and raw anomalies;
- learning-state endpoints remain authenticated.

Frontend boundary:

- no `apps/web/public/data/math2.json`;
- no staging import from `content/staging/math2`;
- Math2 content requests use `credentials: "omit"`;
- only lightweight API helpers and types were added;
- Math2 remains unavailable in the UI while the pilot batch is staging.
