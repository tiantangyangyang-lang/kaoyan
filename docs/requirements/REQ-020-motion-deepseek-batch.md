# REQ-020: Motion sample review and DeepSeek batch generation

## Problem and user value

Generating every dynamic explanation with the primary Codex session consumes too much
usage. The project already has six deployed Motion samples, but the maintainer found the
three proposed style baselines too generic. Those three must first be redesigned as
question-specific visual explanations before any style is frozen or batch drafting is
delegated to DeepSeek.

## In scope

- Redesign and locally preview `math1-2023-q01`, `math1-2025-q04`, and
  `math1-2023-q22` without changing their canonical question content.
- Replace the three generic scenes with step-specific visuals that directly encode the
  asymptote limit, the two disjoint horizontal integration intervals, and the radial
  transformation from a disk to `f_Z(z)=2z`.
- Keep the other three REQ-001 samples unchanged.
- Provide a controlled, fixed-scope database replacement command with dry-run and
  transactional apply modes; do not execute production apply without separate approval.
- Ask the maintainer to review the three redesigned samples before any batch call.
- After explicit sample approval, send only the minimum per-question context needed by
  DeepSeek to draft payloads using already approved animation kinds.
- Limit each generated batch to at most 10 questions.
- Write generated payloads to staging/review artifacts first.
- Validate IDs, schema, duplicate detection, field limits, and canonical-question
  existence before any supported database import.
- Preserve login-only animation payload access and lazy Motion loading.

## Out of scope

- Calling DeepSeek before the maintainer approves the samples.
- Allowing DeepSeek to select questions, invent mathematical answers, change canonical
  content, or introduce a new animation kind.
- Writing generated payloads directly to production or bypassing the existing database
  workflow.
- Sending repository secrets, environment files, database URLs, user data, or the whole
  repository to an external model.
- Changing question, answer, option, formula, explanation, provenance, approval, or
  publication records.
- Replacing the other three animation samples or adding a seventh animation kind.

## Acceptance criteria

1. All three redesigned payloads pass the existing Zod schema and map to canonical IDs.
2. Their SVG scenes visibly change across all three steps and match the canonical math.
3. The other three deployed sample definitions remain byte-for-byte unchanged.
4. A fixed-scope replacement command previews exactly three IDs, uses parameterized SQL,
   and applies all three updates in one transaction only with explicit apply mode.
5. The maintainer explicitly approves the redesigned sample style or lists concrete
   revisions.
6. No DeepSeek request is made before criterion 5 passes.
7. Every later batch contains no more than 10 maintainer-selected question IDs and an
   approved animation-kind mapping.
8. DeepSeek output is treated as an untrusted draft and passes local runtime-schema,
   canonical-ID, and duplicate validation before human review.
9. Generated drafts do not modify canonical question content or production database
   state.
10. Only reviewed payloads may enter the existing controlled animation import path.
11. Anonymous users still receive only an availability boolean; animation detail remains
   login-only.

## Data and security constraints

- Minimum external context: stable ID, question stem, existing options when present,
  existing answer/explanation, and the frozen payload schema.
- Do not transmit `.env`, credentials, database fields unrelated to the selected
  question, source repository paths, or user/session data.
- Preserve Zod runtime validation and parameterized database access.
- Record provider, model, batch ID, selected questions, validation result, and human
  decision in the review report without recording API keys.

## Verification commands

```powershell
npm.cmd run typecheck:api
npm.cmd run test:api
npm.cmd run build:web
npm.cmd run test:smoke:ci --workspace @kaoyan/web
git diff --check
```

The later batch implementation must also expose one repeatable Make/npm command for
dry-run generation and validation. Live import and deployment require separate explicit
maintainer approval.
