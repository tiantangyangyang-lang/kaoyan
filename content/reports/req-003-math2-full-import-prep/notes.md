# Notes: REQ-003 Math2 Full Import Preparation

## Repository State

- Worktree: `C:\Users\60549\.codex\worktrees\04cc\kaoyan`
- Starting commit for this task: `89d9579`
- Base context: `codex/math2-markdown-import`
- Active branch: `codex/math2-full-import-prep`
- `D:\work\kaoyan` was not used for edits because it is a separate worktree on
  `codex/math1-animation-workflow`.

## Required Skills Read

- `expression-skill`
- `planning-with-files`
- `daily-coding`
- `git-workflow`
- `verification-loop`

## Source Repository Baseline Before Work

- Path: `D:\work\Kaoyan-Math2-Papers`
- Branch: `main`
- Commit: `fd42c56eed412cce0cb97d6bd688f314c78e542e`
- Dirty state: dirty
- Untracked files:
  - `papers/MinerU_markdown_math2_1987-2019_2065686324641095680.md`
  - `papers/MinerU_markdown_math2_2020_2065687152877731840.md`
  - `papers/MinerU_markdown_math2_2021_2065687851346780160.md`
  - `papers/MinerU_markdown_math2_2022_2065687890395758592.md`
  - `papers/MinerU_markdown_math2_2023_2065687933685170176.md`

## Source Repository Baseline After Work

- Path: `D:\work\Kaoyan-Math2-Papers`
- Branch: `main`
- Commit: `fd42c56eed412cce0cb97d6bd688f314c78e542e`
- Dirty state: unchanged
- Untracked files: the same five MinerU Markdown paper files listed above

## Current Inventory Findings

Fresh inventory command:

```powershell
python scripts\inventory_math2_markdown.py D:\work\Kaoyan-Math2-Papers content\reports\req-003-math2-full-import-prep\source-inventory.json
```

Current counts:

- 775 total files
- 770 tracked files
- 5 untracked files
- 727 `.jpg`
- 24 `.json`
- 12 `.md`
- 12 `.pdf`
- 11 audited non-README Markdown files
- 20 remote image references
- 0 missing relative image references

The REQ-003 copy is stored at
`content/reports/req-003-math2-full-import-prep/source-inventory.json`.

## REQ-002 Carry-Forward

- REQ-002 freezes `math2-question-staging-v2`.
- 2020 is the reference pilot with exactly 23 questions: 8 multiple choice, 6 fill-in-the-blank, 9 solution/proof.
- 2020 answers and explanations are intentionally `null` with status `missing`.
- `options[].value` is required; `option.text` is forbidden.
- The 2020 comparison transcript under `solutions/2020/` is paper-like evidence, not a verified solution source.
- 2020 Q6 comparison lacks D label; primary paper has complete A-D options.
- 2020 Q22 has a formula-dimension anomaly.
- MySQL dry-run import validates and rolls back in one transaction.
- Public API reads only `published` batches.
- No Math2 static frontend asset exists or should be added.

## Queue-Relevant Source Pairings

| Year(s) | Paper candidate | Solution/comparison candidate | Decision |
|---|---|---|---|
| 1987-2019 | `papers/MinerU_markdown_math2_1987-2019_2065686324641095680.md` | `solutions/math2_1987-2019/math2_1987-2019.md` | Split by year first; no combined import. |
| 2020 | `papers/MinerU_markdown_math2_2020_2065687152877731840.md` | `solutions/2020/math2_2020/math2_2020.md` | Frozen reference only. |
| 2021 | `papers/MinerU_markdown_math2_2021_2065687851346780160.md` | `solutions/2021/math2_2021/math2_2021.md` | Audit only; wrong-subject title risk. |
| 2022 | `papers/MinerU_markdown_math2_2022_2065687890395758592.md` | `solutions/2022/math2_2022/math2_2022.md` | Audit only; severe OCR/boundary risk. |
| 2023 | `papers/MinerU_markdown_math2_2023_2065687933685170176.md` | `solutions/2023/math2_2023/math2_2023.md` | Paper-only staging candidate; answers missing. |
| 2024 | none | `solutions/2024/math2_2024.md` | Role-ambiguous candidate; missing paper path and image review required. |

## Risks

- The source repository has no confirmed license for publication.
- The five MinerU paper files are untracked, so commit hash alone is insufficient.
- `mingw32-make NPM=npm.cmd install` reported an engine warning: the repository
  declares Node `20.x`, while this environment uses Node `24.15.0`.
- `solutions/` path names do not prove solution content.
- 2021 may be Math3 content, not Math2.
- 2022 marker recovery is incomplete in ordinary scans.
- 1987-1996 historical headings require subject mapping review.
- Remote image references in the combined paper file are not immutable local evidence.
- A live MySQL dry-run depends on `DATABASE_URL`.

## Not Worth Doing In REQ-003

- Writing year-specific converters before the queue and checklist are reviewed.
- Running a full import.
- Adding frontend UI for unreviewed staging content.
- Adding explanations or animation features.

## Verification

- Initial `mingw32-make NPM=npm.cmd verify`: failed because `node_modules` was absent and `katex` could not be resolved by `scripts/validate_math2_katex.mjs`.
- `mingw32-make NPM=npm.cmd install`: passed; installed 234 packages; reported Node engine warning described above.
- Final `mingw32-make NPM=npm.cmd verify`: passed.
- Final gate details:
  - Math2 inventory: 775 files, 11 Markdown sources.
  - Math2 2020 pilot: 23 questions, schema valid.
  - KaTeX: 96 expressions, 0 errors.
  - Focused Math2 Python tests: 14 passed.
  - API tests: 10 passed.
  - Web smoke: passed.
  - Web build: passed.
  - API build: passed.
  - Python compileall: passed.
