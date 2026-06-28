# Task Plan: REQ-010 Math2 2024 Markdown Staging

## Goal

Generate a deterministic blocked Math2 2024 staging batch from the
maintainer-approved Markdown source and leave a clear launch-readiness boundary.

## Phases

- [x] Phase 1: Read required instructions and confirm branch/PR baseline.
- [x] Phase 2: Create isolated branch from current `origin/main`.
- [x] Phase 3: Inspect existing Math2 pipeline, REQ-009 decision, and source
      evidence.
- [x] Phase 4: Create REQ-010 requirement and durable report files.
- [x] Phase 5: Implement 2024 transformer, tests, and Make targets.
- [x] Phase 6: Generate 2024 staging artifacts and human checklist.
- [x] Phase 7: Add/configure feedback-email path without hardcoding an invented
      address.
- [x] Phase 8: Run focused validation and full verification.
- [ ] Phase 9: Record final source repo state, commit, push, and open PR.

## Key Questions

1. Can the parser reliably split 2024 Q1-Q22 despite subpart markers inside
   solution questions?
2. Does the source contain explicit answers or explanations?
3. Can the user feedback path be visible without inventing a feedback email?

## Decisions Made

- Use `solutions/2024/math2_2024.md` directly; do not require the origin PDF.
- Keep all generated records blocked and marked `needs_human_review`.
- Treat the three image references as non-blocking source artifacts from
  REQ-009 unless the Markdown parser finds they are needed for a question.
- Do not hardcode `verify@mail.gongren.xyz`; it is a verification sender, not a
  feedback address.

## Errors Encountered

- None yet.

## Status

**Currently in Phase 9** - Implementation and verification are complete; commit,
push, and PR remain.
