# Task Plan: REQ-009 Math2 2024 Source-Role and Image-Evidence Audit

## Goal

Create an isolated audit task that decides the Math2 2024 source role and image
evidence status without staging, importing, publishing, or editing the source
repository.

## Phases

- [x] Phase 1: Read required instructions and confirm repo baseline.
- [x] Phase 2: Create isolated branch from the PR #8 merge commit.
- [x] Phase 3: Inspect queue, prior requirements, and live 2024 source evidence.
- [x] Phase 4: Create REQ-009 requirement and durable report files.
- [x] Phase 5: Update queue metadata with the audit decision.
- [x] Phase 6: Run verification.
- [x] Phase 7: Commit.
- [ ] Phase 8: Push and open PR.

## Key Questions

1. Does a 2024 paper transcript exist outside the queued `solutions/2024/`
   candidate?
2. Are the three queued image references mathematical evidence or only decorative
   watermark/logo artifacts?
3. Is 2024 safe for a follow-up Markdown staging task?

## Decisions Made

- REQ-009 is audit-only. It does not generate `content/staging/math2/2024/*`.
- Maintainer clarified that `solutions/2024/math2_2024.md` is sufficient as the
  2024 Markdown source despite living under `solutions/`.
- The three queued JPG references are watermark/logo crops, not mathematical
  evidence.
- The local origin PDF was inspected during the audit but is superseded by the
  maintainer source-role correction; it is not required for follow-up staging.

## Errors Encountered

- PowerShell parser error: piping directly after a `foreach` statement produced
  `An empty pipe element is not allowed.` Resolution: collect rows in an array,
  then pipe the array to `ConvertTo-Json`.
- PowerShell encoding issue: `Get-Content` without `-Encoding UTF8` displayed
  Chinese source lines as mojibake. Resolution: rerun with `-Encoding UTF8`.
- Bundled `pdfinfo.cmd` wrapper failed with `The system cannot find the path
  specified.` Resolution: call
  `C:\Users\60549\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\poppler\Library\bin\pdfinfo.exe`
  directly.

## Status

**Currently in Phase 8** - Commit created; push and PR remain.
