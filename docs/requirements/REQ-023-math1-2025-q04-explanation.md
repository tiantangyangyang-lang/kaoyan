# REQ-023: Math1 2025 Q04 Explanation Correction

## Problem and user value

`math1-2025-q04` publishes an OCR-damaged explanation. It exposes an unresolved
Markdown image reference, repeats the OCR token `for`, and contains corrupted
mathematical symbols. Learners need a readable derivation that preserves the
verified answer and the source-backed integral transformation.

## In scope

- Replace only Q04's explanation and explanation candidate with a concise,
  mathematically equivalent cleanup of the existing sourced solution.
- Remove the unresolved image reference and OCR artifacts without adding claims
  that are not derivable from the question and existing solution.
- Regenerate the public Math1 artifact.
- Add a guarded, auditable `math1-final-2025-v2` to `v3` correction transaction
  that changes only Q04's explanation fields.

## Out of scope

- Changing Q04's stem, answer, options, animation, or knowledge points.
- Changing any of the other 851 Math1 questions or any Math2/Math3 content.
- Adding general Markdown image rendering to the frontend.

## Acceptance criteria

1. Q04's explanation contains no unresolved `![](images/...)` reference, no
   repeated OCR `f ~ o ~ r`, and no corrupted `\mathbb M I` or `\mathbf \Pi` text.
2. The explanation derives
   `x in [-2,-sqrt(4-y)] or [sqrt(4-y),2]` for `0 <= y <= 4` and concludes A.
3. Q04's stem, options A-D, answer A, animation, and knowledge points are byte-for-byte unchanged.
4. Canonical, review, and generated public Q04 explanations agree.
5. The database correction clones the 22-question 2025 v2 batch to v3, updates
   only Q04's explanation, supersedes v2, and publishes v3 in one transaction.
6. Published Math1 remains 38 batches / 852 unique questions; anonymous Math1
   remains limited to 2018-2025 (179 questions), and Math2/Math3 remain login-only.
7. Dry-run rolls back; commit mode is explicit and every mutation validates exactly one expected row/count.

## Constraints

- Data: do not invent an answer, option, formula, source, or evidence. Preserve
  the existing `candidate_from_solutions` explanation status.
- Authentication: do not alter the public Math1 or protected Math2/Math3 policy.
- Performance: do not add new runtime requests or frontend dependencies.
- Compatibility: retain the current database schema and API response shape.
- Secrets: load `DATABASE_URL` only through the process environment and never print it.

## Verification commands

```powershell
mingw32-make NPM=npm.cmd sync
mingw32-make NPM=npm.cmd math1-2025-q04-explanation-correct-dry-run
mingw32-make NPM=npm.cmd math1-2025-q04-explanation-verify
mingw32-make NPM=npm.cmd typecheck test build
git diff --check
```
