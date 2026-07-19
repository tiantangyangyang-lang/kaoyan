# Task Plan: Login-required content approval and promotion

## Goal

Safely approve and promote the 1552 authorized staging questions while ensuring published content is available only to authenticated users.

## Phases

- [x] Phase 1: Confirm branch, PR scope, worktree state, source-repository state, and existing requirements.
- [x] Phase 2: Inspect known database evidence and design the smallest controlled approval workflow.
- [x] Phase 3: Implement authenticated content access, approval workflow, tests, and audit reporting.
- [x] Phase 4: Run targeted verification and dry-run the approval/promotion workflow.
- [x] Phase 5: Execute live approval and promotion, then verify database and authenticated/anonymous behavior.
- [x] Phase 6: Record final evidence and deliver without commit, push, or PR update.
- [x] Phase 7: On maintainer request, transactionally roll back the 74 promoted batches to staging while preserving approval audit state.
- [x] Phase 8: Reconcile commit scope, deployment workflow, PR 20 state, and remote branch state.
- [x] Phase 9: Run the required verification gate and resolve in-scope failures.
- [x] Phase 10: Stage only REQ-018 and its required review evidence, then create a Conventional Commit.
- [ ] Phase 11: Push `codex/complete-db-content` and update PR 20 with the requirement, verification, rollback, and risk evidence.
- [ ] Phase 12: Deploy through the repository's supported workflow and verify the live authentication/content boundary.

## Key questions

1. Can all 74 target staging batches be selected deterministically and validated as exactly 1552 unique questions?
2. Can approval change only lifecycle status fields while preserving all content and source evidence?
3. Do both list and detail APIs reject anonymous access and work with a valid session?

## Decisions made

- Use REQ-018 as the isolated promotion requirement because prior requirements explicitly excluded promotion and authentication changes.
- Fix authentication before any live promotion because current API routes and tests explicitly allow anonymous content reads.
- Preserve the current frontend static-content path.
- Preserve pre-existing untracked review reports. The initial no-commit/no-push boundary was superseded by the maintainer's explicit 2026-07-19 authorization to commit, update PR 20, and deploy after rollback verification.

## Errors encountered

- GitHub CLI config was unreadable inside the sandbox; resolved with approved read-only escalation for `gh pr view`.
- Initial patch could not create the nested report directory; the exact REQ-018 report directory was created with approved filesystem access, then file edits resumed through `apply_patch`.
- The first live read-only inline query failed before connecting because PowerShell stripped TypeScript string quotes; replaced with the tested project CLI.
- The first sandboxed typecheck could not write a TypeScript build-info cache; rerunning with scoped target-worktree write permission passed.
- The first publication-time `make verify` used a file-only snapshot and failed because Git metadata was absent (`trackedFiles=0`). Replaced it with a temporary no-hardlink clone at source commit `fd42c56e...`, plus exactly five approved untracked MinerU files; the resulting 770 tracked/5 untracked input passed the complete gate.
- The first pre-commit secret-scan command had invalid PowerShell quote nesting and did not run. Reissued it with a single-quoted pattern; only the documented `.env.example` and test-only fake URL matched.

## Status

**Currently in Phase 11** — Conventional Commit created and the complete `origin/main...HEAD` diff reviewed; preparing branch push and PR 20 update.
