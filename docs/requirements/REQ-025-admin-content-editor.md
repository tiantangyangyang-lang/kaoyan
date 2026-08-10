# REQ-025: Two-gate administrator content editor

## Problem and user value

The audited JSON override workflow is safe but still requires PowerShell, file
editing, and manual revision handling. The personal-project maintainer needs a
browser form that can search, preview, save, and revert one published question
without exposing content writes to ordinary users.

## In scope

- Add a content-management view inside the existing React application.
- Gate discovery by an authenticated, configured administrator email.
- Gate every administrator content read/write again with an independent secret.
- Store only a SHA-256 digest of that secret in server environment configuration.
- Search a published question by stable ID and load its effective content,
  current override revision, and immutable revision history.
- Edit allowlisted override fields, preview a validated transaction, commit it,
  and revert to revision 0 or a prior revision.
- Reuse the REQ-024 transaction, optimistic locking, validation, and audit model.

## Out of scope

- A general SQL console, bulk editor, source/provenance editor, or publication tool.
- Changing stable IDs, subject/year, approval, batch, authentication policy,
  animations, knowledge points, or source evidence.
- Persisting the administrator secret in localStorage, sessionStorage, cookies,
  logs, database rows, source files, or committed configuration.
- Claiming this static secret is standards-based MFA; it is an independent
  second application gate in addition to account authentication.

## Acceptance criteria

1. An anonymous request cannot discover or call administrator content APIs.
2. A logged-in account not listed in `ADMIN_CONTENT_EMAILS` receives the same
   generic access-denied response as a wrong administrator secret.
3. Every administrator content read, preview, commit, and revert requires both a
   verified session for a configured email and `X-Admin-Content-Key`.
4. The server hashes the supplied key and compares fixed-length SHA-256 digests
   with `timingSafeEqual`; raw keys are never stored or logged.
5. Key-protected endpoints have a stricter rate limit than ordinary content APIs.
6. The browser keeps the key only in React memory and clears it on logout or
   failed administrator authentication.
7. Search returns base/effective content, current revision, active state, and
   revision history after runtime JSON validation.
8. Preview uses the real REQ-024 transaction with `dryRun: true` and reports
   `rolled_back`; save uses the same payload with explicit commit.
9. The UI handles `expectedRevision` automatically and refreshes after writes.
10. Revert to revision 0 or a prior revision appends audit history; it never
    deletes a revision or mutates canonical published batches.
11. Existing public Math1 and protected Math2/Math3 behavior remains unchanged.
12. The feature is disabled safely when either administrator environment value
    is absent; no secret or administrator email is committed.

## Constraints

- **Data:** only REQ-024 allowlisted content fields; exact A-D options for
  multiple-choice questions; parameterized SQL.
- **Authentication:** verified session plus email allowlist plus independent key.
  Configured administrator email addresses are validated and limited to 128
  characters to match immutable audit columns.
- **Performance:** no administrator request is made for anonymous users; normal
  study routes do not wait for administrator eligibility.
- **Compatibility:** preserve existing content counts, public access, and learning data.
- **Deployment:** Render must receive `ADMIN_CONTENT_EMAILS` and
  `ADMIN_CONTENT_KEY_SHA256`; the raw key stays with the maintainer.

## Verification commands

```powershell
npm.cmd run typecheck
npm.cmd run test:api
$env:BASE_URL='http://127.0.0.1:5175'
npm.cmd run test:smoke:ci --workspace @kaoyan/web
npm.cmd run build
git diff --check
```
