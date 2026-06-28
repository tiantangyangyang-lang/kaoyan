# REQ-008 Task Plan

## Scope Lock

Implement Math2 2023 staging only. The approved source-role decision is to use
the complete 2023 transcript as primary. Live REQ-008 verification found the
complete transcript at `papers/MinerU_markdown_math2_2023_2065687933685170176.md`
and the defective comparison transcript at `solutions/2023/math2_2023/math2_2023.md`.

## Plan

- [x] Create isolated branch from `origin/main`.
- [x] Create REQ-008 requirement and persistent report files.
- [x] Verify 2023 source files still match the recorded hashes.
- [x] Inspect 2020 transformer/test conventions and reuse their staging
      contract.
- [x] Implement `scripts/transform_math2_2023.py`.
- [x] Add `tests/test_transform_math2_2023.py`.
- [x] Generate `content/staging/math2/2023/` artifacts.
- [x] Update `content/queues/math2-full-import-prep.json` for the resolved 2023
      source-role blocker.
- [x] Run focused validation commands.
- [x] Run `mingw32-make NPM=npm.cmd verify` when available.
- [x] Record final verification and PR handoff notes.

## Final State

The tool-layer usage-limit blocker cleared on 2026-06-28. REQ-008 staging was
generated from the read-only source repo, focused validation passed, and full
project verification passed.

## Guardrails

- Do not edit `D:\work\Kaoyan-Math2-Papers`.
- Do not import Math2 into frontend, API, database, auth, deployment, final, or
  approved content.
- Do not decide source roles for 2021, 2022, 2024, or 1987-2019.
- Do not use REQ-004 path labels without live source verification; REQ-008
  records that the labels are inverted relative to current file contents.
- Do not relax `math2-question-staging-v2`.
- Do not invent answers, explanations, options, or formulas.

## Delegation

Dirty/repetitive work can be delegated only for mechanical evidence collection:
source listings, hash checks, parser parity checks, and line audits. Primary
Codex retains decisions about source roles, queue status, verification gates, and
PR readiness.
