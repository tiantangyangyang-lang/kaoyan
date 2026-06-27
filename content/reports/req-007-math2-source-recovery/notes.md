# Notes: REQ-007 Math2 Source Recovery

## Conclusion

The five restored MinerU Markdown files match the previous Math2 source contract
exactly. Their paths, byte counts, and SHA-256 hashes match REQ-002, REQ-003,
REQ-004, the existing Math2 queues, the 2020 staging provenance, and Math2 source
inventory reports.

The previous `make verify` missing-input failure is resolved in the requested
verification repository: `mingw32-make NPM=npm.cmd verify` passed from
`D:\work\kaoyan`.

## PR #6 Inspection

- PR: `https://github.com/tiantangyangyang-lang/kaoyan/pull/6`
- Title: `REQ-006: refresh Math2 source baseline`
- State: open
- Branch: `codex/math2-source-baseline-refresh` into `main`
- Main claim: the five REQ-002 MinerU paper Markdown inputs were missing and the
  Math2 queue should remain blocked by that refreshed baseline.

Recommendation: do not merge PR #6 as-is. It documented a real transient source
state, but the source files have now been restored with matching hashes. PR #6
should be closed or superseded by REQ-007 rather than merged into `main`, because
its queue-blocking metadata is no longer current.

## Source Repository State

- Source path: `D:\work\Kaoyan-Math2-Papers`
- Branch: `main`
- Commit: `fd42c56eed412cce0cb97d6bd688f314c78e542e`
- Dirty state: five untracked restored MinerU Markdown files under `papers/`
- Source repo write status: read-only inspection only; no source files were
  edited, deleted, moved, or committed.

`git status --short --branch` showed:

```text
## main...origin/main
?? papers/MinerU_markdown_math2_1987-2019_2065686324641095680.md
?? papers/MinerU_markdown_math2_2020_2065687152877731840.md
?? papers/MinerU_markdown_math2_2021_2065687851346780160.md
?? papers/MinerU_markdown_math2_2022_2065687890395758592.md
?? papers/MinerU_markdown_math2_2023_2065687933685170176.md
```

## Restored File Hashes

| Relative path | Bytes | SHA-256 | Match |
|---|---:|---|---|
| `papers/MinerU_markdown_math2_1987-2019_2065686324641095680.md` | 444494 | `c8cf81ea4a1b38fd483cbd5bc569a1e7d443792406f075f2fecb61f0156f23d3` | yes |
| `papers/MinerU_markdown_math2_2020_2065687152877731840.md` | 6073 | `12b4c86d1e5ad865f2354e62d1d64ea6d8472f6d07f2cf457127d77d94b7091d` | yes |
| `papers/MinerU_markdown_math2_2021_2065687851346780160.md` | 29863 | `6c7c470e3edcafa3a5541365406c10cfcd6322db32cb5e27581cb3e8a34f8f1e` | yes |
| `papers/MinerU_markdown_math2_2022_2065687890395758592.md` | 32659 | `5ccb6ed1c8d12157bd72d44414dff2616465da113a39295acedceb7675052b70` | yes |
| `papers/MinerU_markdown_math2_2023_2065687933685170176.md` | 6964 | `eef3ea76c3491b8753230bfc1089493d2b67f1b1a815bc45de6666a70cdcb02f` | yes |

## Comparison Targets

The restored hashes match the values recorded in:

- `docs/requirements/REQ-002-math2-markdown-import.md`
- `content/reports/req-002-math2-markdown-import/source-inventory.json`
- `content/reports/req-002-math2-markdown-import/source-audit.md`
- `content/reports/req-002-math2-markdown-import/pilot-report.md`
- `content/reports/pilot-math2-2020/plan-review.md`
- `docs/requirements/REQ-003-math2-full-import-prep.md`
- `content/reports/req-003-math2-full-import-prep/source-inventory.json`
- `content/reports/req-003-math2-full-import-prep/import-queue.md`
- `content/queues/math2-full-import-prep.json`
- `docs/requirements/REQ-004-math2-2023-staging.md`
- `content/reports/math2-2023/source-role-audit.md`
- `content/staging/math2/2020/questions.json`
- `content/inventory/source-inventory.json`
- `content/inventory/source-anomalies.md`

## Contract Decision

The restored files match the previous Math2 source contract. No new source
contract is needed for the five restored files.

The contract remains: source repo commit `fd42c56eed412cce0cb97d6bd688f314c78e542e`
plus a dirty worktree containing these five untracked MinerU paper Markdown files
with their recorded SHA-256 hashes.

The restored files should stay untracked unless the maintainer explicitly
approves committing them in the source repository.

## 2020 Pilot Reproducibility

REQ-002 2020 pilot can still be reproduced from the restored source inputs.
Evidence:

- `scripts/transform_math2_2020.py` ran during `make verify` in this worktree
  and reported `Math2 2020: 23 questions, schemaValid=True`.
- `mingw32-make NPM=npm.cmd verify` from `D:\work\kaoyan` passed.
- No tracked diff was produced in this REQ-007 worktree after the transform
  reran, so regenerated Math2 2020 artifacts are byte-identical to tracked
  outputs.

## Verification

Requested verification from `D:\work\kaoyan`:

```powershell
mingw32-make NPM=npm.cmd verify
```

Result: passed.

Important observed steps:

- web typecheck passed;
- API typecheck passed;
- API tests passed: 5 tests;
- web smoke test passed;
- web build passed;
- API build passed.

Additional REQ-007 worktree check:

```powershell
mingw32-make NPM=npm.cmd verify
```

Result: failed after the missing-source gate was resolved. It ran
`math2-inventory` and `math2-pilot`, then failed at `math2-katex` because this
isolated worktree does not have the `katex` package installed in `node_modules`.
`D:\work\kaoyan\node_modules\katex` exists, while this worktree's
`node_modules\katex` does not.

This is an environment/dependency limitation of the isolated worktree, not a
source-recovery failure.

## PR #6 Disposition

Recommendation: close or supersede PR #6 with REQ-007. Do not merge PR #6 as-is.

Reason: PR #6's central queue-blocking conclusion was correct when the files were
missing, but the restored files now match the old hashes exactly. Merging PR #6
would add stale metadata saying the source checkout is missing the REQ-002
primary MinerU Markdown files.

## Source Contract Update

No update to Math2 source baseline metadata is needed in this task. Existing
metadata already describes the restored state:

- source commit `fd42c56eed412cce0cb97d6bd688f314c78e542e`;
- dirty source repo with five untracked MinerU paper Markdown files;
- matching SHA-256 hashes for all five files.

## 2023 Boundary

This task does not decide 2023 source roles. The user supplied the current PR #4
decision for this task: option (b), use the comparison transcript as primary for
Math2 2023. REQ-007 only verifies restored file availability and hash integrity.

## Handoff

- Initial implementation commit: `e1fdf9b docs(math2): verify source recovery`
- Branch: `codex/math2-source-recovery`
- PR: #7, `https://github.com/tiantangyangyang-lang/kaoyan/pull/7`
