# REQ-024 Notes

## Existing constraints

- `kaoyan_users` has no role/admin field.
- Public Math1 initially comes from a generated static artifact; authenticated content comes from MySQL.
- Content-store rows already validate/parse JSON before returning API data.
- Published batches are immutable/versioned and should remain untouched by routine overrides.

## Selected model

- `kaoyan_question_overrides`: current active patch and optimistic revision.
- `kaoyan_question_override_revisions`: immutable before/after audit history.
- Operator JSON patch: allowlisted fields, editor/reason, expected revision, dry-run default.
- Public endpoint: only active Math1 2018-2025 patches; frontend merges them after static content is already visible.

## Implementation findings

- Public Math1 remains immediately available from the 179-question static file;
  the override request is non-blocking and failure falls back to the static bank.
- Authenticated list and detail reads merge validated active overrides inside the
  MySQL content store. Math2 and Math3 anonymous access stays denied.
- A stale override can always be disabled with `revert` to revision 0 after a
  later source promotion changes the published base; restoring an older patch
  across a changed base is rejected.
- Smoke tests must use an isolated port when another Vite process already owns
  5173. The runner now honors `BASE_URL` and resolves the installed Vite binary.

## Known unrelated gate failure

- Full `make verify` stops in the Math2 inventory fixture: current read-only
  source repository has 792 files while the historical test expects 775.
- The command-generated inventory and KaTeX report changes were restored and
  are not part of REQ-024.
