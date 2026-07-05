# Task Plan: REQ-017 Math2 1997-2019 Staging Readiness

## Goal

Split and audit the Math2 aggregate 1997-2019 source, then generate and verify only schema-valid, source-supported staging batches that can safely proceed toward database import.

## Phases

- [x] Phase 1: Start from latest main and create isolated branch.
- [x] Phase 2: Create requirement, task plan, and notes files.
- [x] Phase 3: Read prior REQ-003/011/013/016 constraints and existing transform/import code.
- [x] Phase 4: Inventory read-only aggregate sources and record hashes, line counts, source repo state.
- [x] Phase 5: Run mechanical scans for year boundaries, question boundaries, options, answer/explanation markers, and blockers.
- [x] Phase 6: Decide safe staging years and implement deterministic transform for safe years only.
- [x] Phase 7: Generate staging, KaTeX reports, human-review checklist, audit summaries, Makefile targets, and focused tests.
- [x] Phase 8: Run targeted validation and `make verify`.
- [x] Phase 9: Commit, push, open focused PR, and report DB import boundary.

## Key Questions

1. Which years from 1997-2019 have deterministic year and question boundaries?
2. Which years have complete options for multiple-choice questions without needing invented content?
3. Which answers or explanations are directly source-supported and which must remain missing/null?
4. Is live DB import allowed in this requirement after staging is verified?

## Decisions Made

- Branch: `codex/req-017-math2-1997-2019-staging-readiness`.
- Scope excludes Math3 1987-1996 and unrelated website publication work.
- Live DB commands require explicit approval for REQ-017 even though prior DB setup exists.
- 1997-2019 can be generated as schema-valid Math2 staging because source headings say 试卷二; all generated records remain blocked due source-review anomalies.
- Cross-paper references such as 同试卷一... are not expanded or invented; they are stored as unknown or blocked review items with cross_paper_reference anomalies.

## Errors Encountered

- Source read blocked on 2026-07-04: escalated read-only commands for `D:\work\Kaoyan-Math2-Papers` were rejected by the approval layer because the Codex usage limit was reached. No workaround was attempted. Without direct source access, REQ-017 cannot safely decide year boundaries, option completeness, or staging eligibility.

## Status

**Complete** - PR #19 is open and REQ-017 handoff is recorded.
