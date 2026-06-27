# REQ-006: Math2 Source Baseline Refresh

## Status

Implemented for PR review. Full root verification is blocked by the missing REQ-002 Math2 2020 MinerU Markdown input, which is the source-state change this requirement documents.

## Problem and User Value

The Math2 source repository state appears to have changed after REQ-002 recorded five untracked MinerU Markdown files as usable source inputs. The current project needs a refreshed, evidence-backed baseline so future Math2 queues do not rely on missing or stale source files.

This task records the current read-only state of `D:\work\Kaoyan-Math2-Papers`, compares it with REQ-002 and later queue assumptions, and states which work can be safely delegated for mechanical follow-up.

## Scope

- Confirm the Math2 source repository branch, commit, and dirty state from the source repository itself.
- Confirm whether the previously recorded untracked MinerU Markdown files under `papers/` are present or absent.
- Inventory available Math2 source files by relative path, role, size, and SHA-256 where practical.
- Compare the refreshed source baseline against REQ-002 assumptions and any discoverable REQ-003 or queue assumptions.
- Create durable report artifacts under `content/reports/req-006-math2-source-baseline-refresh/`.
- State consequences for existing Math2 staging, source queues, and any future Claude Code delegation.

## Out of Scope

- Full Math2 import or re-import.
- Frontend static Math2 bank generation.
- Dynamic explanations, generated explanations, or Motion animations.
- Editing `D:\work\Kaoyan-Math2-Papers`.
- Mathematical source-role interpretation by Claude Code.
- Queue acceptance or publication decisions delegated to Claude Code.

## Data Constraints

- `D:\work\Kaoyan-Math2-Papers` is read-only for this task.
- Generated artifacts in this repository may record source file metadata but must not copy full source content from the external repository.
- Hashes are computed only for files that exist at verification time.
- Missing files must be recorded explicitly instead of silently dropped.

## Authentication Constraints

No API authentication behavior changes are in scope.

## Performance Constraints

Inventory commands should be bounded to Math2 source metadata. Full content conversion and full-bank parsing are excluded.

## Compatibility Constraints

- Existing Math1 artifacts are untouched.
- Existing Math2 staging remains present but must be marked as dependent on the older REQ-002 source baseline if its source files are now unavailable.
- Root Makefile is changed only if a recurring project command is needed.

## Acceptance Criteria

- [x] Requirement and report files exist for REQ-006.
- [x] Source repository state records branch, commit, upstream state, and dirty/untracked status.
- [x] The five previously recorded untracked MinerU Markdown paths are checked one by one and classified as present or missing.
- [x] Available source PDFs, solution Markdown files, and tracked Markdown-like artifacts are listed with size and SHA-256 where usable.
- [x] The report compares current evidence against REQ-002 source assumptions and any discoverable REQ-003 or queue assumptions.
- [x] Queue consequences are explicit: which assumptions are invalidated, blocked, or still usable.
- [x] Claude Code delegation boundaries are explicit and limited to mechanical listing, hashing, and per-file audit checks.
- [x] No source repo files are modified.
- [x] No full Math2 import, frontend static bank, dynamic explanation, or Motion work is performed.
- [x] The smallest meaningful verification is run; `mingw32-make NPM=npm.cmd verify` was also run and failed at the expected missing-source gate.
- [x] Changes are committed with a Conventional Commit, pushed, and opened as PR #6 referencing this requirement.

## Verification Commands

```powershell
git status --short --branch
git -C D:\work\Kaoyan-Math2-Papers status --short --branch
git -C D:\work\Kaoyan-Math2-Papers rev-parse HEAD
git -C D:\work\Kaoyan-Math2-Papers ls-files
mingw32-make NPM=npm.cmd verify
```
