# Math1 1987-2025 Batch Plan

## Goal

Convert and review the available Math1 papers from 1987 through 2025 without modifying the
source repository or allowing uncertain content to enter approved/published data.

## Phases

- [x] Confirm scope and immutable-source boundary.
- [x] Generate a per-year source/readiness manifest.
- [x] Generalize the deterministic Math1 converter beyond 2020.
- [x] Validate representative old/new/high-risk years.
- [x] Produce the executable batch queue and agent commands.
- [ ] Run yearly conversion and semantic-review batches.
- [ ] Track human-review completion and unresolved years.

## Known Boundaries

- 1994 has solutions but no paper: do not synthesize questions.
- 2025 has a paper but no solutions: stage questions with missing answers/explanations.
- 2024 has three paper candidates: retain all and record version conflicts without silent fixes.
- 2020 has a corrected dirty-worktree source snapshot and a human-reviewed artifact.
- The source repository is not owned by the user: do not commit or push.
- Process one year per batch, at most 25 questions, and keep all results at
  `needs_human_review` until human review.

## Status

Staging and canonical local review packages are now complete for all 38 non-blocked years,
yielding 850 candidate questions. Only 1994 remains blocked because it has no paper source.
The 2024 competing versions are handled by a dedicated multi-version transformer and a durable
version-selection report; all detected content conflicts remain `needs_human_review`.

The Math1 2004 semantic-review content has now been recovered into canonical project artifacts by
the local repair path. The next checkpoint is human review of Q14, Q6, Q13, and Q19; after that,
handle the 2005 human-review blockers (Q15, Q11/Q14, Q20), then the 2006 blockers
(Q08/Q13/Q14/Q16). Math1 2007-2019 now also have conservative local fallback review packages
because the formal Claude path is currently blocked by `API Error: 402 Insufficient Balance`.
Their next checkpoint is year-by-year human review, with optional semantic reruns later when
billing is restored.

The newly added legacy parser, `scripts/transform_math1_legacy_year.py`, has now generated
staging and conservative local review packages for 1987-1993 and 1995-2003. The highest-priority
legacy human-review years are 1997, 2002, 1992, and 1990 because they currently carry the
largest anomaly counts.

The modern parser, `scripts/transform_math1_modern_year.py`, has generated staging and local
review packages for 2021-2023 and 2025. Human review should start with OCR-heavy 2022, then 2025.

The legacy, sequential, modern, and 2024 multi-version parser paths now cover every available
Math1 paper year from 1987 through 2025. Do not synthesize 1994 until a paper source is obtained.

## Errors Encountered

- The first direct batch execution of `transform_math1_sequential_year.py` failed before
  producing outputs because direct script execution did not include the project root on
  `sys.path`. The entry point was corrected and will be rerun.
- A PowerShell ad-hoc count command initially read UTF-8 JSON using the console's legacy
  default encoding and reported invalid JSON. Reading explicitly as UTF-8 confirmed that the
  generated JSON is valid.
- Claude Code is not available in the Codex process PATH. Dynamic agent tasks must be launched
  from the user's existing Claude Code CMD session.
- The first `ds-math1-year` formal run for 2004 produced semantic-review content but failed the
  wrapper contract because `agent-result.json` reported an empty `commandsRun`.
- The second `ds-math1-year` formal run for 2004 wrote only partial standardized outputs before
  stopping, leaving no `agent-result.json`.
- A deterministic local repair script, `scripts/repair_math1_year_review.py`, was added to
  normalize legacy yearly review output into canonical `questions-reviewed.json` and checklist
  artifacts without touching the source repository.
- The yearly wrapper now normalizes absolute `createdFiles` / `changedFiles` paths from
  `agent-result.json` before comparing them with project-relative changed paths. This fixes the
  false failure seen in the 2005 semantic-review run.
- The yearly wrapper now also accepts `completed_with_warnings` as a valid semantic-review
  terminal state when the agent reports concrete findings (`warnings`, `errors`, `failed` checks,
  or `not_run` checks). This avoids falsely failing anomaly-discovery runs like 2006.
- The 2007 `ds-math1-year` formal run failed before contract output with `API Error: 402
  Insufficient Balance`. A deterministic local fallback generator,
  `scripts/generate_math1_year_review_local.py`, now produces conservative canonical yearly-review
  files directly from staging artifacts when external billing blocks the remote semantic pass.
- A dedicated legacy parser, `scripts/transform_math1_legacy_year.py`, now covers 1987-1993 and
  1995-2003. It flattens scored questions by section-count rules instead of the 2004+ sequential
  numbering rule, and it attaches solution sections by original Chinese section numerals.
