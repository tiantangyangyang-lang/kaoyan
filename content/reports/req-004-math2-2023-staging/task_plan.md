# Task Plan: REQ-004 Math2 2023 Staging Audit

## Goal

Determine whether the 2023 Math2 batch is mechanically convertible under the
frozen schema, and if not, produce a durable audit handing the non-delegable
decision to primary Codex. Do not force a staging through OCR corruption.

## Priorities

- P0: preserve source immutability; record commit/dirty state before and after.
- P0: verify 2023 source hashes against the REQ-003 frozen queue.
- P0: confirm subject identity, structure, boundaries, and answer/explanation absence.
- P0: document OCR corruption with exact line references.
- P0: state the non-delegable decision (OCR recovery / source-role / schema) for Codex.
- P1: run `mingw32-make NPM=npm.cmd verify` to confirm no regression.
- P2: mechanical 2023 execution (converter + staging) — deferred to a follow-up
  requirement after Codex's decision.

## Phases

- [x] Phase 1: Create branch `codex/math2-2023-audit` off `origin/main`.
- [x] Phase 2: Record source commit/dirty state before audit.
- [x] Phase 3: Verify 2023 source hashes against the REQ-003 queue.
- [x] Phase 4: Read-only audit of paper and comparison files.
- [x] Phase 5: Confirm subject (Math2), structure (10/6/6=22), boundaries, answer absence.
- [x] Phase 6: Document OCR corruption (Q2/Q4/Q6/Q7/Q9 missing MC options).
- [x] Phase 7: State non-delegable decision and stop conditions.
- [x] Phase 8: Write REQ-004, audit report, task_plan, notes.
- [x] Phase 9: Run `mingw32-make NPM=npm.cmd verify`.
- [x] Phase 10: Record source commit/dirty state after audit (unchanged).
- [x] Phase 11: Commit, push, open PR (#4).
- [ ] Phase 12: Primary Codex decision on (a)/(b)/(c); follow-up REQ-005 scopes execution.

## Decisions Made

- Base the audit branch on `origin/main` (independent PR) so Codex can act on the
  2023 finding without waiting for PR #3 to merge.
- Do NOT create `transform_math2_2023.py` or staging outputs: the OCR block makes
  any such output require a non-delegable decision.
- Treat the comparison file as comparison (not answer source); it is a second
  question transcription, not an answer key.

## Evidence Captured

- Source commit before/after: `fd42c56eed412cce0cb97d6bd688f314c78e542e` (unchanged).
- Source dirty state before/after: 5 untracked MinerU Markdown files (unchanged).
- 2023 paper hash: `eef3ea76...` (matches queue).
- 2023 comparison hash: `c353e535...` (matches queue).
- OCR defects: Q2 (line 15), Q4 (27–29), Q6 (41–49), Q7 (51–56), Q9 (84–86).
- Structure headers: 选择题 1–10, 填空题 11–16, 解答题 17–22.

## Status

**Phase 11 complete.** Audit complete; 2023 staging blocked on a primary-Codex
decision (OCR recovery / source-role / schema relaxation). Committed `aa664ca`,
pushed `codex/math2-2023-audit`, opened PR #4 (base `main`).

## Delivery

- Branch: `codex/math2-2023-audit` (based on `origin/main` `d20a724`).
- Commit: `aa664ca` — `docs(math2): audit 2023 staging, block on OCR/source-role decision` (4 files, +378).
- PR: https://github.com/tiantangyangyang-lang/kaoyan/pull/4 (base `main`, head `codex/math2-2023-audit`).
- Source repo `D:\work\Kaoyan-Math2-Papers` unchanged at `fd42c56` before and after.
- Verification: `mingw32-make NPM=npm.cmd verify` passed (docs-only; no 2023 code).
- Pending: primary-Codex decision on (a) re-OCR / (b) promote comparison / (c) relax schema.
