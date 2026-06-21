# Task Plan: Math1 2000 Legacy Deterministic Conversion

## Goal
Convert math1 2000 (legacy_section_based) paper + solutions into structured JSON with hierarchical IDs.

## Disposition
- `needs_legacy_parser` — NOT blocked, eligible for conversion ✓
- structureFamily: `legacy_section_based`
- risks: [] (none)

## Phases
- [x] Phase 1: Read manifest, source files, verify disposition
- [x] Phase 2: Assess existing staging (problems found: wrong ID scheme, q01 wrong explanation, q06 merged solutions)
- [x] Phase 3: Write deterministic parser script (scripts/legacy_math1_2000_transform.py)
- [x] Phase 4: Generate output (23 questions in questions.json)
- [x] Phase 5: Validate output (counts 23=23, IDs unique, all needs_human_review)
- [x] Phase 6: Write report files and agent-result.json

## Source Info
- Paper: `papers/2000年考研数学(一)真题.md` SHA256: `F68B1FD5...` ✓
- Solutions: `solutions/2000年解析/2000年解析.md` SHA256: `E43CE996...` ✓
- HEAD: `3151b4acf26ea19ccd427b869a715e65e1990091` (dirty=true)
- Expected question count: 23 leaf items (5 fill + 5 choice + 13 solution) ✓

## ID Scheme
- Section-level: `math1-2000-s{NN}`
- Question-level: `math1-2000-s{NN}-q{NN}` when section has sub-questions
- Solo questions: `math1-2000-s{NN}` when section has single question

## Decisions
- Use hierarchical IDs per spec requirement for legacy_section_based ✓
- Map solution flat numbers (1-21) to hierarchical via section ordering ✓
- Mark all as needs_human_review ✓
- Do not judge math correctness ✓
- 5 warnings for missing explicit answer in computation/proof questions

## Status
**Completed** — 23 questions written to staging. Ready for human review.
