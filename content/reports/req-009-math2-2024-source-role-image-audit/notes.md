# Notes: REQ-009 Math2 2024 Source-Role and Image-Evidence Audit

## Instruction and Repo Baseline

- Required skills read:
  - `C:\Users\60549\.agents\skills\expression-skill\SKILL.md`
  - `C:\Users\60549\.agents\skills\planning-with-files\SKILL.md`
  - `C:\Users\60549\.codex\plugins\cache\openai-primary-runtime\pdf\26.623.12021\skills\pdf\SKILL.md`
- Repo start state:
  - `git rev-parse HEAD`:
    `1f110c05d20fd0f8a70f71b29363b291a8a82a9e`
  - `git log --oneline -5` starts with:
    `1f110c0 Merge pull request #8 from tiantangyangyang-lang/codex/math2-2023-comparison-primary-staging`
  - Initial state was detached at the PR #8 merge commit.
- Branch created:
  - `codex/math2-2024-source-role-image-audit`

## Prior Queue Evidence

- REQ-003 classifies 2024 as role-ambiguous because it has a paper-like Markdown
  candidate under `solutions/` and no recorded `papers/` candidate.
- Queue batch:
  - `math2-2024-role-ambiguous-paper-like`
  - prior status: `blocked_missing_paper_and_image_review`
  - known Markdown hash:
    `38d3a737c302a4ae79094fbaacb489d33fcb7b15de1330aa6b20888aaea8358b`
- REQ-008 intentionally resolved only 2023 and made no 2024 source-role
  decision.

## Live Source Repository State

- Source root: `D:\work\Kaoyan-Math2-Papers`
- Branch: `main`
- Commit: `fd42c56eed412cce0cb97d6bd688f314c78e542e`
- Dirty state:
  - `?? papers/MinerU_markdown_math2_1987-2019_2065686324641095680.md`
  - `?? papers/MinerU_markdown_math2_2020_2065687152877731840.md`
  - `?? papers/MinerU_markdown_math2_2021_2065687851346780160.md`
  - `?? papers/MinerU_markdown_math2_2022_2065687890395758592.md`
  - `?? papers/MinerU_markdown_math2_2023_2065687933685170176.md`
- No 2024 untracked `papers/` Markdown file appears in the dirty state.

## 2024 Candidate Discovery

Live 2024 files found under `solutions/2024/`:

| Relative path | Bytes |
|---|---:|
| `solutions/2024/content_list_v2.json` | 80994 |
| `solutions/2024/d9d94a1c-3357-4eb8-abf6-5101928d2ab2_content_list.json` | 24635 |
| `solutions/2024/d9d94a1c-3357-4eb8-abf6-5101928d2ab2_model.json` | 33798 |
| `solutions/2024/d9d94a1c-3357-4eb8-abf6-5101928d2ab2_origin.pdf` | 1705270 |
| `solutions/2024/images/7884391bcaec6d4b3b606a079c578a4913ccb65a0f43986faeb8ca2af3e7e68e.jpg` | 18984 |
| `solutions/2024/images/ccde6b36e7a52892b052d64b0476872615cb2aba24502e52d014c6603b5e2c11.jpg` | 3167 |
| `solutions/2024/images/d98314f433fa3074d0317cf7d9672b1e6b185e8a8e5a3e2a22ab1853b1498ae1.jpg` | 3180 |
| `solutions/2024/layout.json` | 241970 |
| `solutions/2024/math2_2024.md` | 6703 |

Checked absent paths:

- `papers/math2_2024.pdf`: absent.
- `papers/MinerU_markdown_math2_2024_2065687933685170176.md`: absent.

## Exact Hashes

| Relative path | Bytes | SHA-256 |
|---|---:|---|
| `solutions/2024/math2_2024.md` | 6703 | `38d3a737c302a4ae79094fbaacb489d33fcb7b15de1330aa6b20888aaea8358b` |
| `solutions/2024/content_list_v2.json` | 80994 | `35d8889289dfbc82a44c247c3dd6c2e67da55e12152f4d5ee3e37e3da00bfb79` |
| `solutions/2024/layout.json` | 241970 | `fb70ceee60bcf63d6f8663780e0c17d363ddcf71a4d04497f6a88a3d2cb4f2de` |
| `solutions/2024/d9d94a1c-3357-4eb8-abf6-5101928d2ab2_origin.pdf` | 1705270 | `df86614289bad461f554f4aff94bd976fee35aeae1d731d833ab6982c9fc6ba0` |
| `solutions/2024/images/7884391bcaec6d4b3b606a079c578a4913ccb65a0f43986faeb8ca2af3e7e68e.jpg` | 18984 | `143fbb6e676f2d2c9d81665184043e8c7b44dd0730008d37a99c4e177b557c54` |
| `solutions/2024/images/d98314f433fa3074d0317cf7d9672b1e6b185e8a8e5a3e2a22ab1853b1498ae1.jpg` | 3180 | `ddef685f158502f8b177dd0d3c36ef61a58e8b0b1cc897bfccae1a0f3fdff128` |
| `solutions/2024/images/ccde6b36e7a52892b052d64b0476872615cb2aba24502e52d014c6603b5e2c11.jpg` | 3167 | `390bb4fd531eb7723b9ca56744b3ef38079eb98566fb7f7250634355302cfd69` |

## Markdown Structure and Image References

- `solutions/2024/math2_2024.md` has 153 lines.
- Detected candidate boundaries:
  - Q1-Q10 multiple choice.
  - Q11-Q16 fill-in-the-blank.
  - Q17-Q22 solution questions.
- Image references:
  - line 149:
    `![](images/7884391bcaec6d4b3b606a079c578a4913ccb65a0f43986faeb8ca2af3e7e68e.jpg)`
  - line 151:
    `![](images/d98314f433fa3074d0317cf7d9672b1e6b185e8a8e5a3e2a22ab1853b1498ae1.jpg)`
  - line 153:
    `![](images/ccde6b36e7a52892b052d64b0476872615cb2aba24502e52d014c6603b5e2c11.jpg)`
- All three references resolve locally.
- All three image files are watermark/logo crops, not math content.

Image dimensions:

| Relative path | Dimensions |
|---|---:|
| `solutions/2024/images/7884391bcaec6d4b3b606a079c578a4913ccb65a0f43986faeb8ca2af3e7e68e.jpg` | 1073 x 633 |
| `solutions/2024/images/d98314f433fa3074d0317cf7d9672b1e6b185e8a8e5a3e2a22ab1853b1498ae1.jpg` | 270 x 161 |
| `solutions/2024/images/ccde6b36e7a52892b052d64b0476872615cb2aba24502e52d014c6603b5e2c11.jpg` | 270 x 161 |

## Superseded PDF Inspection

- PDF: `solutions/2024/d9d94a1c-3357-4eb8-abf6-5101928d2ab2_origin.pdf`
- Metadata:
  - Creator: PDFium
  - Producer: PDFium
  - Creation date: 2026-02-14 23:49:08 China Standard Time
  - Pages: 4
  - Page size: A4
  - Encrypted: no
  - PDF version: 1.7
- Rendered pages were created temporarily under `tmp/pdfs/` for visual audit.
- Page 1 title reads `2024年全国硕士研究生招生考试（数学二）真题`.
- Pages show a GaoLian Education branded paper scan, not answer/explanation
  content.
- Page 3 confirms the Markdown Q22 phrase `高联` is an OCR artifact from the
  watermark. The PDF line is `已知方程组 Ax = 0` followed by the next line
  `的解是 B^T x = 0 的解，但两个方程组不同解。`
- Page 4 contains the continuation of Q22 and watermark/QR/footer content.
- Maintainer correction after the first audit: the PDF should not be treated as
  required evidence; `solutions/2024/math2_2024.md` is sufficient as the 2024
  Markdown source.

## Decision

The 2024 Markdown source is sufficient for a follow-up staging task. REQ-009
records that decision but does not generate staging files.

Reasons:

- Maintainer clarified that `solutions/2024/math2_2024.md` is enough for 2024.
- The `solutions/` path no longer blocks source-role acceptance.
- The three queued image references are watermark artifacts, so they are
  non-blocking source artifacts and should not be treated as mathematical
  evidence.
- Answers and explanations must still remain missing unless explicit markers are
  found in the Markdown source.

Allowed follow-up:

- Create a separate requirement for Math2 2024 Markdown staging from
  `solutions/2024/math2_2024.md`, retaining all records as blocked for human
  review.

Forbidden in this task:

- No 2024 staging JSON.
- No live DB dry-run.
- No frontend/API/database/auth/deployment edits.
- No source repository writes.

## Verification Log

- `python -m json.tool content\queues\math2-full-import-prep.json`
  - Result: passed; queue JSON parses.
- `git diff --check`
  - Result: passed with exit code 0.
  - Warning only: Git reported future CRLF normalization for
    `content/queues/math2-full-import-prep.json` and
    `content/reports/req-003-math2-full-import-prep/import-queue.md`.
- `git status --short --branch`
  - Result: branch is `codex/math2-2024-source-role-image-audit`.
  - Tracked changes are limited to REQ-009 docs/reports and Math2 queue
    metadata.
- Final source repo check:
  - Branch: `main`
  - Commit: `fd42c56eed412cce0cb97d6bd688f314c78e542e`
  - Dirty state: same five untracked restored MinerU Markdown files under
    `papers/`; no 2024 source writes observed.
- First `mingw32-make NPM=npm.cmd verify`:
  - Failed at `math2-katex` because this isolated worktree had no local
    `node_modules/katex`.
  - No tracked generated content changed from that failed run.
- `mingw32-make NPM=npm.cmd install`:
  - Result: installed 234 packages.
  - Warning: repo declares Node `20.x`; current runtime is Node `v24.15.0` with
    npm `11.12.1`.
- Final `mingw32-make NPM=npm.cmd verify`:
  - Result: passed.
  - Math2 inventory: 775 files, 11 Markdown sources.
  - Math2 2020: 23 questions; KaTeX 96 expressions, 0 errors.
  - Math2 2023: 22 questions; KaTeX 118 expressions, 0 errors.
  - Python Math2 tests: 14 tests passed for 2020 inventory/transform and 11
    tests passed for 2023 transform.
  - API tests: 10 passed.
  - Web smoke test: passed.
  - Web build and API build: passed.
  - Compileall: passed.
  - `verify` touched `content/staging/math2/2020/katex-validation.json` and
    `content/staging/math2/2023/katex-validation.json`, but `git diff --quiet`
    returned 0 for both files, confirming no content diff.
- Follow-up maintainer correction:
  - User clarified that `solutions/2024/math2_2024.md` is sufficient and the
    PDF should not be required.
  - REQ-009 docs and queue metadata were updated to mark the Markdown source as
    approved for a follow-up staging requirement.
  - `python -m json.tool content\queues\math2-full-import-prep.json`: passed.
  - `git diff --check`: passed.
  - `mingw32-make NPM=npm.cmd verify`: passed again after the correction.
