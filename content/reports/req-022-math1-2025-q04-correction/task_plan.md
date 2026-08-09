# REQ-022 Task Plan

## Status

- [x] P0 — Create an isolated branch/worktree from current `origin/main`.
- [x] P0 — Inspect Q04 canonical/review/public records, schemas, provenance conventions, and the supplied image.
- [x] P0 — Inspect supported published-content correction and audit workflows plus current database state.
- [x] P0 — Add durable source evidence and make the minimum C/D-only content correction.
- [x] P0 — Add or adapt a guarded database correction workflow if no supported one exists.
- [x] P0 — Regenerate the public Math1 bank and prove unrelated payloads/counts are unchanged.
- [x] P0 — Run targeted tests, full verification, diff checks, and secret checks.
- [ ] P0 — Apply the controlled production database correction and verify anonymous/authenticated reads.
- [ ] P1 — Prepare commit/PR handoff; do not merge or deploy without independent review.

## Decisions

- The source image is authoritative for C and D only.
- The reversed-looking second integral in C must remain exactly as printed; this task is transcription, not mathematical reinterpretation.
- The maintainer's production screenshot expands acceptance: remove the duplicated option/answer block from Q04's stem so the corrected structured options are the only rendered choices and the answer is not leaked.
- Database mutation is permitted only through an existing controlled workflow or a narrowly scoped guarded workflow added under this requirement.

## Blockers

- Full `make verify` is blocked before project tests by an unrelated external-source fixture drift: `D:/work/Kaoyan-Math2-Papers` currently has 792 files while `tests.test_inventory_math2_markdown` requires 775. The two generated Math2 files from that run were restored.
