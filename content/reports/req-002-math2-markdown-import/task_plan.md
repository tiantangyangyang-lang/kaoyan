# Task Plan: REQ-002 Math2 Markdown Import

## Goal

Deliver a reviewed, deterministic Math2 Markdown pilot with a transactional MySQL import path and bounded API delivery, without modifying the source repository or publishing the full bank.

## Priorities

- P0: preserve source immutability and freeze the data contract.
- P0: audit year pairing, boundaries, options, answers, images, OCR, and duplicates.
- P0: implement and verify one pilot only.
- P0: store content in MySQL without bundling Math2 JSON into frontend assets.
- P0: expose only published content through bounded public reads; keep learning-state writes authenticated.
- P1: add repeatable Makefile commands and a safe mechanical-batch handoff prompt.
- P2: full-bank conversion, dynamic explanations, Motion animations, and publication; explicitly deferred.

## Phases

- [x] Phase 1: Capture target/source baseline and create isolated branch.
- [x] Phase 2: Audit existing schema, frontend consumers, Makefile interface, and source Markdown.
- [x] Phase 3: Freeze REQ-002 schema, conventions, anomaly policy, pilot selection, and acceptance tests.
- [x] Phase 4: Implement bounded pilot converter and validators.
- [x] Phase 5: Run tests, deterministic rerun comparison, KaTeX checks, and root verification.
- [x] Phase 6: Review artifacts, verify source unchanged, prepare safe handoff prompt.
- [x] Phase 7: Freeze MySQL/API/import contract in REQ-002.
- [x] Phase 8: Implement deterministic inventory, transactional import dry-run, content store, and public API tests.
- [x] Phase 9: Verify no Math2 static asset/bundle integration and rerun `make verify`.
- [ ] Phase 10: Conventional commit, push, and open PR referencing REQ-002.

## Key Questions

1. Which years have both paper and solution evidence?
2. Which source layout is representative enough for a pilot but bounded enough to review manually?
3. What exact schema do current frontend consumers require?
4. Which anomalies must block a question versus block the entire year?
5. What deterministic command proves a rerun is byte-identical?
6. Which content fields belong in list versus detail API responses?
7. How does a failed import guarantee that no partial year is visible?

## Decisions Made

- The source repository is strictly read-only.
- Source commit alone is insufficient because five paper Markdown files are untracked; consumed-file SHA-256 values are required.
- The pilot will remain in staging and will not be connected to `apps/web`.
- External agents may receive only frozen, repetitive batches; no policy bypass will be attempted.
- Public content reads will require no account, but will return only atomically published batches.
- Learning-state reads/writes remain authenticated.
- List endpoints omit answers and explanations; detail endpoints return the full published question.
- MySQL import creates a staging batch in one transaction. Publication is a separate transaction and is out of scope for this pilot.
- Math2 JSON will not be copied into `apps/web/public/data` or bundled.
- Dynamic explanations and Motion animations are out of scope for REQ-002.

## Errors Encountered

- The target worktree started detached at `66a90e4faee72017b39a46fd8f92edd47eb3c98b`; resolved by creating `codex/math2-markdown-import` from that exact commit.
- The target repository has no physical `AGENTS.md`; the supplied task instructions are being treated as repository policy.
- `npm exec -- node ...` hung while resolving the KaTeX validator command; fixed the Make target to invoke the installed `node` runtime directly.
- Full legacy Python discovery ran 134 tests with 14 errors, 4 failures, and 15 skips in pre-existing Math1 repair tests whose fixtures no longer match finalized Math1 staging. Kept this diagnostic as `make test-python-all`; the REQ-002 gate uses focused Math2 tests plus compile, KaTeX, typecheck, API tests, and build.
- A live MySQL dry-run cannot run in this worktree because `DATABASE_URL` is not set. The transaction path is covered with a fake connection, including the full 23-question pilot and partial-failure rollback.

## Status

**Currently in Phase 10** — Conventional Commit, push, and dedicated PR.
