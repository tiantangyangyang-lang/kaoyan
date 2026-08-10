# REQ-025 Notes

## User decision

- Intended administrator account: supplied by the maintainer, configured only in
  deployment environment as `ADMIN_CONTENT_EMAILS`.
- Require an additional independent administrator key.

## Security model

- Gate 1: valid verified application session and allowlisted email.
- Gate 2: raw key sent only over HTTPS in `X-Admin-Content-Key`; server compares
  its SHA-256 digest against `ADMIN_CONTENT_KEY_SHA256` in constant time.
- Browser storage: React memory only.

## Existing implementation reused

- `executeContentOverride` already supplies row locks, optimistic revision checks,
  allowlisted Zod validation, dry-run rollback, commit, and immutable audit rows.
- Existing origin middleware rejects cross-origin writes; administrator writes add
  a verified session, email allowlist, key digest check, and strict rate limiter.
- Public Math1 and authenticated subject APIs are separate from new `/api/admin`
  paths and need no access-policy changes.
# Implementation notes

- The administrator email is configuration-only. The user-provided address is
  intentionally not present in tracked files.
- `ADMIN_CONTENT_KEY_SHA256` stores only a lowercase 64-character SHA-256
  digest. Empty configuration disables the feature instead of enabling a
  fallback key.
- Both allowlisted email and key verification are evaluated before returning a
  generic `admin_access_denied` response; the session must also be verified.
- The UI keeps the raw key in top-level React state only. It is cleared after
  logout, a 401 session failure, a 403 administrator failure, or a page reload.
- Preview and commit call the same REQ-024 override transaction. Preview sends
  `dryRun: true`, while the server supplies the audit editor from the session.
- Browser smoke verification confirms that the key is sent only in the custom
  header and is absent from localStorage and sessionStorage.
- Stored multiple-choice options reuse the same canonical A-D schema as
  overrides; all other question types must store an empty option array.
- Administrator query/mapping, stored JSON validation, editor state, forms,
  history, and styles live in focused modules rather than the shared store or a
  single large React component.
