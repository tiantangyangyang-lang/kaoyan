# REQ-024 Task Plan

## Goal

Provide one-command, audited database content corrections that survive imports, support rollback, and update both authenticated and public Math1 reads.

## Phases

- [x] P0 — Create REQ-024 and isolated branch/worktree from current `origin/main`.
- [x] P0 — Choose a separate override layer instead of mutating immutable published batches.
- [x] P0 — Add synchronized schema/startup tables and runtime patch validation.
- [x] P0 — Implement transactional upsert/revert service and generic operator command.
- [x] P0 — Merge overrides into API reads and non-blocking public Math1 loading.
- [x] P0 — Add tests, example, Make commands, and durable operating instructions.
- [ ] P0 — Run targeted database dry-run, full task-relevant verification, security and diff review. (code verification complete; production dry-run follows deployment)
- [ ] P1 — Commit, push, independently review, merge, deploy, and verify production behavior.

## Decisions

- Use an override layer so routine corrections no longer clone or mutate published batches.
- Keep writes local/operator-only for this requirement; a future admin UI can call the same service after an administrator role exists.
- Use a single patch schema for both upsert and revert.
- Load public overrides after the static Math1 bank so API latency never causes a blank initial page.

## Errors encountered

- None.

## Status

Implementation and local verification are complete. Preparing commit, PR, independent review, deployment, and production dry-run.
