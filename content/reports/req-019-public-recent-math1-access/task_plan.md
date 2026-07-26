# Task Plan: Public recent Math1 access

## Goal
Enforce Math1 2018-2025 as the only anonymously visible question content across API and static web assets, while preserving authenticated access to all 1,552 promoted questions and leaving content data unchanged.

## Priorities
- P0: Prevent API and static-asset disclosure of protected content.
- P0: Preserve authenticated access to all promoted content.
- P1: Keep recent Math1 available anonymously without making the frontend API-only.
- P1: Add regression coverage and rendered-flow verification.
- P2: Commit, push, PR, and deploy only after local verification and user confirmation.

## Phases
- [x] Phase 1: Create isolated branch/worktree and define REQ-019.
- [x] Phase 2: Inspect API auth, content filters, frontend loading, static generation, and tests.
- [x] Phase 3: Implement the server-side policy and tests.
- [x] Phase 4: Remove protected static payloads and implement authenticated frontend loading with tests.
- [x] Phase 5: Run targeted/full verification, review the diff, and write the access audit.
- [ ] Phase 6: Commit the reviewed scope, push the branch, update the PR, deploy, and verify production access.

## Key questions
1. Can existing session middleware distinguish authenticated and anonymous access without changing response shapes?
2. Which static artifacts contain protected records, and how does React load them?
3. What bounded pagination strategy restores protected content after login?
4. How can rendered tests prove anonymous and authenticated states without production credentials?

## Decisions made
- Math1 2018-2025 inclusive is public; Math1 1987-2017 and all Math2/Math3 require login.
- Enforce independently in API and generated public assets.
- Retain a hybrid frontend.
- Do not mutate approval, publication, question, or provenance data.
- Use branch `codex/req-019-public-recent-math1-access` in the ignored isolated worktree.
- On 2026-07-26, the user confirmed continuing through Git delivery and deployment.

## Errors encountered
- Initial Git metadata writes were sandbox-blocked. `origin/main` was confirmed at `75d8d65`, then the worktree was created with approved Git permission; no content changed.
- The first multi-file patch stalled after writing the requirement because the nested report directory did not exist. It was terminated, the partial state was checked, and the remaining files were split into smaller patches.
- The first smoke run could not find Vite because the isolated worktree had no local `node_modules`. A sandboxed install could not read the user npm cache; the approved install completed, then the same smoke command passed.
- Browser console assertions initially reported expected mock 401/404 resource errors and exposed a real Math2-to-Math1-animation API mismatch. The workspace now renders animation gates only for Math1; anonymous auth mocks return a null user without console noise.
- Live database verification was blocked by sandbox networking, and the controlled network retry was rejected because the authorization reviewer hit its usage limit. No database command ran with elevated network access.
- `make verify` stopped at the pre-existing Math2 source inventory mismatch (current 792 files versus fixed expectation 775). Generated REQ-002 inventory changes were removed with a precise reverse patch; the external source repository was unchanged.
- Two multi-hunk smoke-test patches failed context verification and made no changes. Smaller exact patches applied successfully.

## Status
**Currently in Phase 6** - implementation is locally complete; Git delivery and production verification are in progress.
