# Math2 2024 Source-Role and Image-Evidence Audit

## Conclusion

Math2 2024 is cleared for a follow-up Markdown staging task using
`solutions/2024/math2_2024.md` as the source. REQ-009 remains audit-only: it does
not generate 2024 staging files, run a live DB dry-run, publish content, or edit
the source repository.

## Inputs Checked

- Source root: `D:\work\Kaoyan-Math2-Papers`
- Source branch: `main`
- Source commit: `fd42c56eed412cce0cb97d6bd688f314c78e542e`
- Source dirty state: unchanged five untracked restored MinerU Markdown files
  under `papers/`, none for 2024.
- Queue batch: `math2-2024-role-ambiguous-paper-like`
- Requirement: `docs/requirements/REQ-009-math2-2024-source-role-image-audit.md`

## Candidate Files

| Role | Relative path | Bytes | SHA-256 |
|---|---|---:|---|
| Markdown candidate | `solutions/2024/math2_2024.md` | 6703 | `38d3a737c302a4ae79094fbaacb489d33fcb7b15de1330aa6b20888aaea8358b` |
| Image artifact | `solutions/2024/images/7884391bcaec6d4b3b606a079c578a4913ccb65a0f43986faeb8ca2af3e7e68e.jpg` | 18984 | `143fbb6e676f2d2c9d81665184043e8c7b44dd0730008d37a99c4e177b557c54` |
| Image artifact | `solutions/2024/images/d98314f433fa3074d0317cf7d9672b1e6b185e8a8e5a3e2a22ab1853b1498ae1.jpg` | 3180 | `ddef685f158502f8b177dd0d3c36ef61a58e8b0b1cc897bfccae1a0f3fdff128` |
| Image artifact | `solutions/2024/images/ccde6b36e7a52892b052d64b0476872615cb2aba24502e52d014c6603b5e2c11.jpg` | 3167 | `390bb4fd531eb7723b9ca56744b3ef38079eb98566fb7f7250634355302cfd69` |

Absent primary-paper paths:

- `papers/math2_2024.pdf`
- `papers/MinerU_markdown_math2_2024_2065687933685170176.md`

## Image Evidence

| Relative path | Bytes | Dimensions | SHA-256 | Finding |
|---|---:|---:|---|---|
| `solutions/2024/images/7884391bcaec6d4b3b606a079c578a4913ccb65a0f43986faeb8ca2af3e7e68e.jpg` | 18984 | 1073 x 633 | `143fbb6e676f2d2c9d81665184043e8c7b44dd0730008d37a99c4e177b557c54` | GaoLian watermark/logo only |
| `solutions/2024/images/d98314f433fa3074d0317cf7d9672b1e6b185e8a8e5a3e2a22ab1853b1498ae1.jpg` | 3180 | 270 x 161 | `ddef685f158502f8b177dd0d3c36ef61a58e8b0b1cc897bfccae1a0f3fdff128` | GaoLian watermark/logo only |
| `solutions/2024/images/ccde6b36e7a52892b052d64b0476872615cb2aba24502e52d014c6603b5e2c11.jpg` | 3167 | 270 x 161 | `390bb4fd531eb7723b9ca56744b3ef38079eb98566fb7f7250634355302cfd69` | GaoLian watermark/logo only |

These references resolve locally but do not contain formulas, options, or
question text. They should be ignored as mathematical evidence and recorded as
source artifacts if a future 2024 staging task proceeds.

## Superseded PDF Inspection

The origin PDF was inspected during the first audit pass. That inspection is now
superseded by the maintainer correction that the Markdown file is sufficient.
The PDF should not be treated as required evidence for the next task.

The rendered PDF inspection found:

- Header: `2024年全国硕士研究生招生考试（数学二）真题`
- Content type: question-only paper scan, not answer/explanation source.
- Brand artifacts: GaoLian Education header, watermarks, QR/footer.
- Q22 source text in the PDF explains the Markdown artifact: the Markdown line
  includes `高联` because OCR picked up a watermark between wrapped lines.

## Decision

- Source role: `solutions/2024/math2_2024.md` is sufficient as the 2024 Markdown
  source for a follow-up staging task.
- Current queue state: audit completed; ready for a follow-up Markdown staging
  requirement.
- Image decision: three queued JPGs are watermark-only, non-blocking source
  artifacts.
- Dry-run import: forbidden.
- Publication: forbidden.

## Required Follow-Up Before Staging

Create a new requirement for Math2 2024 Markdown staging. That task should:

- read `solutions/2024/math2_2024.md` as the approved source;
- record image references as non-blocking source artifacts unless future source
  evidence shows mathematical content;
- preserve answer and explanation fields as missing unless explicit source
  markers are found;
- produce blocked staging only after schema, KaTeX, deterministic rerun, and
  human spot-check gates pass.

## Verification

Commands run after edits:

```powershell
python -m json.tool content/queues/math2-full-import-prep.json
git diff --check
git status --short --branch
```

Results:

- Queue JSON parse passed.
- `git diff --check` passed with exit code 0. Git emitted CRLF normalization
  warnings for the edited queue JSON and queue Markdown files only.
- Final source repo check remained `main` at
  `fd42c56eed412cce0cb97d6bd688f314c78e542e` with the same five untracked
  restored MinerU Markdown files under `papers/`.
- Initial full `mingw32-make NPM=npm.cmd verify` failed because `katex` was not
  installed in this isolated worktree.
- `mingw32-make NPM=npm.cmd install` installed local dependencies. npm warned
  that the repo requires Node `20.x` while the current runtime is Node
  `v24.15.0`.
- Final `mingw32-make NPM=npm.cmd verify` passed: Math2 2020 and 2023 KaTeX
  validation passed, Python Math2 tests passed, API tests passed, web smoke
  passed, web/API builds passed, and compileall passed.
- After the maintainer clarified that `solutions/2024/math2_2024.md` is
  sufficient and the PDF should not be required, queue JSON parsing,
  `git diff --check`, and full `mingw32-make NPM=npm.cmd verify` all passed
  again.
