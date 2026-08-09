# REQ-022: Correct Math1 2025 Q04 options C and D

## Problem and user value

`math1-2025-q04` currently exposes OCR-damaged placeholders for options C and D. The maintainer supplied a source image that makes both formulas readable. Restoring the two options makes the public Math1 question complete while preserving the original question, answer, and provenance.

## In scope

- Record the maintainer-supplied image as correction evidence without altering it.
- Replace only option C and option D of `math1-2025-q04` in the canonical and review data.
- Normalize Q04's structured stem to end at the equals sign, removing duplicated option text and the embedded answer marker from the stem while preserving the separate answer field.
- Update only correction-related status and audit metadata that the existing schemas support.
- Regenerate the public Math1 artifact from canonical content.
- Update the already-published database record through a transactional, parameterized, auditable project workflow.
- Verify anonymous public access, authenticated access, unchanged counts, and unchanged unrelated content.

## Out of scope

- Changing option A or B, the mathematical question text, correct answer, explanation, animation, or any other question.
- Correcting the mathematics beyond faithfully transcribing the supplied source image.
- Changing Math2 or Math3 content.
- Changing authentication or public-visibility policy.

## Acceptance criteria

1. Option C exactly preserves the two source-image integrals, including the displayed bounds and order.
2. Option D exactly preserves the source-image iterated integral.
3. Option A, option B, answer, explanation, and every other stable ID remain byte-for-byte unchanged in their semantic payloads.
4. Q04's rendered stem contains only the question through the equals sign; duplicated options and `【答案】A` are absent from the stem, while the separate answer remains A.
5. The generated public Math1 bank contains 179 questions and exposes corrected Q04 to anonymous users under the existing 2018+ policy.
6. The database retains 852 Math1 questions and the existing approval/publication state; only `math1-2025-q04` receives the controlled correction.
7. The database update checks the expected old values and old stem structure, runs in a transaction, uses parameterized SQL, and creates or preserves an audit record.
8. No secret or connection string is printed, written, or committed.

## Constraints

- **Data:** The supplied image is the source of truth. Do not invent, normalize away, or mathematically rewrite its content.
- **Authentication:** Existing policy remains: Math1 2018 and later is public; protected content still requires login.
- **Performance:** Regeneration must not undo hashed-asset cache headers or parallel public/auth loading from REQ-021.
- **Compatibility:** Keep existing JSON and API contracts. Use existing correction/import/promotion conventions where available.
- **Database:** Load `DATABASE_URL` only into the command process from `D:\work\kaoyan\.env`; never echo it.

## Verification commands

- `npm.cmd run sync:content --workspace @kaoyan/web`
- Targeted content/correction tests discovered during implementation
- `mingw32-make NPM=npm.cmd verify`
- `git diff --check`
- Controlled database correction dry run, then explicit commit mode
- Anonymous and authenticated API checks without logging credentials
