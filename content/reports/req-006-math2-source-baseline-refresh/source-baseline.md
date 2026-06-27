# REQ-006 Math2 Source Baseline Refresh

## Conclusion

The current Math2 source repository is clean at `fd42c56eed412cce0cb97d6bd688f314c78e542e`, but it no longer contains the five untracked MinerU Markdown files that REQ-002 used as paper transcription candidates. This invalidates any future Math2 queue that depends on those `papers/MinerU_markdown_math2_*.md` paths unless the files are intentionally restored and rehashed.

## Source Repository State

- Source path: `D:\work\Kaoyan-Math2-Papers`
- Branch: `main`
- Upstream: `origin/main`
- Commit: `fd42c56eed412cce0cb97d6bd688f314c78e542e`
- Ahead/behind `origin/main`: `0/0`
- Dirty/untracked state: clean; `git status --porcelain=v1 --untracked-files=all` returned no paths.
- Read/write boundary: source repo was inspected read-only; no files were edited.

## Current Source Counts

| Category | Count |
|---|---:|
| Files under `papers/` and `solutions/` | 769 |
| Paper PDFs under `papers/` | 6 |
| Solution Markdown files | 6 |
| Solution origin PDFs | 6 |
| JSON files | 24 |
| Image files | 727 |

The current count is six files lower than the REQ-002 source audit total of 775 because the five untracked paper Markdown files are absent, and `README.md` is outside the `papers/` plus `solutions/` count.

## Previously Recorded MinerU Paper Markdown

| Relative path | REQ-002 state | Current state | Consequence |
|---|---|---|---|
| `papers/MinerU_markdown_math2_1987-2019_2065686324641095680.md` | untracked, SHA-256 `c8cf81ea4a1b38fd483cbd5bc569a1e7d443792406f075f2fecb61f0156f23d3` | missing | Historical split work cannot use the REQ-002 primary paper Markdown until restored and verified. |
| `papers/MinerU_markdown_math2_2020_2065687152877731840.md` | untracked, SHA-256 `12b4c86d1e5ad865f2354e62d1d64ea6d8472f6d07f2cf457127d77d94b7091d` | missing | Existing 2020 staging is reproducible only against the old recorded file hash, not the current source checkout. |
| `papers/MinerU_markdown_math2_2021_2065687851346780160.md` | untracked, SHA-256 `6c7c470e3edcafa3a5541365406c10cfcd6322db32cb5e27581cb3e8a34f8f1e` | missing | 2021 queue assumptions using this candidate are blocked. |
| `papers/MinerU_markdown_math2_2022_2065687890395758592.md` | untracked, SHA-256 `5ccb6ed1c8d12157bd72d44414dff2616465da113a39295acedceb7675052b70` | missing | 2022 queue assumptions using this candidate are blocked. |
| `papers/MinerU_markdown_math2_2023_2065687933685170176.md` | untracked, SHA-256 `eef3ea76c3491b8753230bfc1089493d2b67f1b1a815bc45de6666a70cdcb02f` | missing | 2023 queue assumptions using this candidate are blocked. |

## Available Source Files With Hashes

| Relative path | Bytes | SHA-256 |
|---|---:|---|
| `papers/math2_1987-2019.pdf` | 995159 | `7d9a5bfcad9608e4821d300c4e3d83c6e0136905b418beda3bcffabb6c4a3a7d` |
| `papers/math2_2020.pdf` | 1045118 | `13d15c42540080692e3c6073376aebcf6911b7bc2ac38dbe833a4eac1986e1f6` |
| `papers/math2_2021.pdf` | 1655905 | `725a9d6404e171cb53430c6b57cd91e5785216d73dcd6cf505cb80bafc7cdb8c` |
| `papers/math2_2022.pdf` | 1720052 | `beefa3f7717c26d96e2eb3f26b719068ad491d3ebaee04a4790eea2ed770f0cd` |
| `papers/math2_2023.pdf` | 546156 | `1bb7e2525c367510629352710b3b3c360d685db6ee46345b9d4dd0be69024194` |
| `papers/math2_2023_answer.pdf` | 1663855 | `1f5792e90c02623f94dfd6fe3ba3ad98f94cd015668d2365069f174aa2606e18` |
| `solutions/2020/math2_2020/f920daa5-be59-4493-a6a9-0041a91e6217_origin.pdf` | 1047311 | `dea8acbfd9bcd2c6b4d42b98f2e9d557de3718d225640bf177c93af53ff1fb41` |
| `solutions/2020/math2_2020/math2_2020.md` | 6826 | `539e2ecb995ce03ad1c2207c1855321732eec3b7c0211c9011477fcb0cd611e7` |
| `solutions/2021/math2_2021/9ea77ef4-be0e-467f-82fc-6373a8aedbf0_origin.pdf` | 1592430 | `501aa1b817789870f1d5eeddf65b210af0885447c3b81a5f13d42e7f467ea8aa` |
| `solutions/2021/math2_2021/math2_2021.md` | 29823 | `effe54ef9285571d75a9b3eff150fcad8276aa180298f242c289b0626992229d` |
| `solutions/2022/math2_2022/c71330ea-0983-48c0-99e5-845301cc51b6_origin.pdf` | 1641253 | `177af8e05ce723d56f00e64594dd3be74200f059117b7a86ffa6f4edce2a0e44` |
| `solutions/2022/math2_2022/math2_2022.md` | 34036 | `9c6f7ffb8c0780413b6c81e37f3e2d4b1a007ddf0b1f02b4ae681d441bd3de6c` |
| `solutions/2023/math2_2023/19c2cd89-f143-4efe-bccd-ecdc0eba2da6_origin.pdf` | 508949 | `9f7a5b382b4a12ad35479d98410401acb35279897dcf1cbd6e2cb11cfea8b292` |
| `solutions/2023/math2_2023/math2_2023.md` | 7730 | `c353e535aa9dcda945bc9d88c3c441f3f4d23060a3408209ac3e90efa202bed8` |
| `solutions/2024/d9d94a1c-3357-4eb8-abf6-5101928d2ab2_origin.pdf` | 1705270 | `df86614289bad461f554f4aff94bd976fee35aeae1d731d833ab6982c9fc6ba0` |
| `solutions/2024/math2_2024.md` | 6703 | `38d3a737c302a4ae79094fbaacb489d33fcb7b15de1330aa6b20888aaea8358b` |
| `solutions/math2_1987-2019/7320be4f-cd5d-4f6e-a8a3-2067d7d1066f_origin.pdf` | 1055603 | `e98619e6341615c04e53d755efb8aa1b7971f2b63b4867f018acd59cad79f87b` |
| `solutions/math2_1987-2019/math2_1987-2019.md` | 391659 | `ef715711e094d2c30af75dee43e777c3870c781b91521da6604579d04e955e01` |

## Comparison Against REQ-002

- REQ-002 remains a historical record of the 2020 staging pilot inputs.
- REQ-002's source dirty-state statement is no longer true for the current source checkout.
- The REQ-002 primary paper candidate for 2020 is unavailable in the current source checkout.
- Existing `content/staging/math2/2020/questions.json` still records `sourceRepository.dirty: true` and references the missing 2020 MinerU primary path. That staging artifact should be treated as a frozen candidate from the older baseline, not as reproducible from the current source checkout.
- The tracked comparison file `solutions/2020/math2_2020/math2_2020.md` is still present with the same SHA-256 recorded in REQ-002.

## REQ-003 and Queue Check

- No `REQ-003` requirement or report file is present in this worktree.
- The only Math2 queue file found is `content/queues/math2-markdown-import-template.json`; it has an empty `tasks` list and is already blocked from execution.
- Because all REQ-002 paper Markdown candidates are missing, any future queue task requiring `primaryRelativePath` values under `papers/MinerU_markdown_math2_*.md` must remain blocked until the source files are restored, regenerated, or replaced by a newly accepted baseline.

## Delegation Boundary

Claude Code may later perform only mechanical work:

- list source paths under explicit directories;
- compute byte counts and SHA-256 hashes;
- check whether exact paths exist;
- run per-file audits from a primary-agent-authored checklist.

Claude Code must not:

- decide which file is the canonical source;
- classify ambiguous `solutions/` files as answers or paper transcriptions;
- change queue status from blocked to runnable;
- approve import, publication, frontend delivery, dynamic explanations, or Motion work.

## Verification Commands Used

```powershell
git -C D:\work\Kaoyan-Math2-Papers status --short --branch
git -C D:\work\Kaoyan-Math2-Papers rev-parse HEAD
git -C D:\work\Kaoyan-Math2-Papers rev-parse --abbrev-ref --symbolic-full-name '@{u}'
git -C D:\work\Kaoyan-Math2-Papers status --porcelain=v1 --untracked-files=all
git -C D:\work\Kaoyan-Math2-Papers rev-list --left-right --count origin/main...HEAD
Get-ChildItem -Path papers -Force
Get-ChildItem -Path papers,solutions -Recurse -File -Force
Get-FileHash -Algorithm SHA256
```
