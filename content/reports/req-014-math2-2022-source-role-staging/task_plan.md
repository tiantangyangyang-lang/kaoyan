# Task Plan: REQ-014 Math2 2022 Source-Role Staging

## Goal

Decide and, if safe, generate Math2 2022 blocked staging from approved 2022
source candidates without inventing content or mixing unrelated Math2 work.

## Phases

- [x] Phase 1: Read required repo and skill instructions.
- [x] Phase 2: Sync from latest `origin/main` and create the isolated branch.
- [x] Phase 3: Create REQ-014 requirement and durable report files.
- [x] Phase 4: Record mechanical source scans and REQ-011 blocker evidence.
- [x] Phase 5: Decide whether safe no-invention staging is possible.
- [x] Phase 6: Implement staging or blocker report, focused tests, and Makefile
      targets.
- [x] Phase 7: Run focused validation and full verification.
- [ ] Phase 8: Record source after-state, commit, push, and open PR.

## Key Questions

1. Can Q2/Q7 paper boundaries and Q10 solutions boundary be accounted for
   without inventing source content?
2. Can all Q1-Q10 options be recovered from source-visible text with exact
   `{"label","value"}` shape?
3. Should solutions evidence be used only as comparison evidence, or may it
   provide explicit answer/explanation evidence in this requirement?

## Decisions Made

- Scope is 2022 only; do not touch 2021 or 1987-2019.
- Do not run live database dry-run/import in REQ-014.
- Source repo `D:\work\Kaoyan-Math2-Papers` is read-only.
- Mechanical scan may be delegated; source-role and staging decisions remain
  in the main Codex context.
- REQ-014 must not generate 2022 staging: Q5, Q7, and Q10 have no candidate
  source with complete A-D option values.
- REQ-014 must not import 2022 into the database: no schema-valid 2022
  `questions.json` exists.

## Errors Encountered

- Initial sub-agent spawn with full-history fork plus explicit agent type was
  rejected; retried as an independent explorer task.
- Explorer agent `019f22dd-3a08-7483-8c36-9eff7e620337` disconnected before
  completion; main Codex completed the mechanical scans locally.

## Status

**Currently in Phase 7** - Focused validation passed; running full verification
passed after installing missing npm dependencies; preparing PR handoff.
