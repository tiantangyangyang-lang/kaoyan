# REQ-002 Math2 Source Audit

## Conclusion

Use 2020 as a blocked staging pilot. It has a deterministic 23-question paper boundary, but neither 2020 Markdown candidate contains explicit answers or explanations. The file under `solutions/2020/` is a second paper transcription and must not be treated as a solution source.

## Repository Baseline

- Path: `D:\work\Kaoyan-Math2-Papers`
- Branch: `main`
- Commit: `fd42c56eed412cce0cb97d6bd688f314c78e542e`
- Files: 775 total; 770 tracked and 5 untracked
- Main formats: 727 JPG, 24 JSON, 12 Markdown, 12 PDF
- Dirty state: five untracked `papers/MinerU_markdown_math2_*.md` files

## Markdown Inventory

| Path | Bytes | Lines | Answer markers | Solution markers | Images | SHA-256 |
|---|---:|---:|---:|---:|---:|---|
| `papers/MinerU_markdown_math2_1987-2019_2065686324641095680.md` | 444494 | 8179 | 0 | 0 | 20 remote | `c8cf81ea4a1b38fd483cbd5bc569a1e7d443792406f075f2fecb61f0156f23d3` |
| `papers/MinerU_markdown_math2_2020_2065687152877731840.md` | 6073 | 161 | 0 | 0 | 0 | `12b4c86d1e5ad865f2354e62d1d64ea6d8472f6d07f2cf457127d77d94b7091d` |
| `papers/MinerU_markdown_math2_2021_2065687851346780160.md` | 29863 | 419 | 16 | 19 | 0 | `6c7c470e3edcafa3a5541365406c10cfcd6322db32cb5e27581cb3e8a34f8f1e` |
| `papers/MinerU_markdown_math2_2022_2065687890395758592.md` | 32659 | 493 | 16 | 19 | 0 | `5ccb6ed1c8d12157bd72d44414dff2616465da113a39295acedceb7675052b70` |
| `papers/MinerU_markdown_math2_2023_2065687933685170176.md` | 6964 | 163 | 0 | 0 | 0 | `eef3ea76c3491b8753230bfc1089493d2b67f1b1a815bc45de6666a70cdcb02f` |
| `solutions/2020/math2_2020/math2_2020.md` | 6826 | 152 | 0 | 0 | 0 | `539e2ecb995ce03ad1c2207c1855321732eec3b7c0211c9011477fcb0cd611e7` |
| `solutions/2021/math2_2021/math2_2021.md` | 29823 | 412 | 16 | 18 | 0 | `effe54ef9285571d75a9b3eff150fcad8276aa180298f242c289b0626992229d` |
| `solutions/2022/math2_2022/math2_2022.md` | 34036 | 464 | 16 | 18 | 0 | `9c6f7ffb8c0780413b6c81e37f3e2d4b1a007ddf0b1f02b4ae681d441bd3de6c` |
| `solutions/2023/math2_2023/math2_2023.md` | 7730 | 149 | 0 | 0 | 0 | `c353e535aa9dcda945bc9d88c3c441f3f4d23060a3408209ac3e90efa202bed8` |
| `solutions/2024/math2_2024.md` | 6703 | 153 | 0 | 0 | 3 relative | `38d3a737c302a4ae79094fbaacb489d33fcb7b15de1330aa6b20888aaea8358b` |
| `solutions/math2_1987-2019/math2_1987-2019.md` | 391659 | 7907 | 0 | 0 | 20 relative | `ef715711e094d2c30af75dee43e777c3870c781b91521da6604579d04e955e01` |

All 23 relative image references resolve. The 20 paper-side combined-file images are remote URLs and therefore are not immutable local evidence.

## Pairing

| Years | Paper candidate | Solution candidate | Audit result |
|---|---|---|---|
| 1987–2019 | combined paper Markdown | combined solution Markdown | Both contain all 33 Chinese-numeral year headings; must split by year before conversion. Headings for 1987–1996 say `试卷三`, so subject mapping requires separate historical review. |
| 2020 | standalone paper Markdown | `solutions/2020/...md` | Both contain Q1–Q23; neither contains answers or explanations. |
| 2021 | standalone combined question/answer Markdown | standalone combined question/answer Markdown | Both title the exam `数学三`; isolate as wrong-subject until verified. |
| 2022 | standalone combined question/answer Markdown | standalone combined question/answer Markdown | Severe OCR; ordinary marker scan misses Q2/Q7 in one version and Q10 in the other. |
| 2023 | standalone paper Markdown | `solutions/2023/...md` | Both contain Q1–Q22; neither contains answers or explanations. |
| 2024 | none under `papers/` | `solutions/2024/math2_2024.md` | Paper-like Q1–Q22 with three image references and no answers; classify as `missing_paper` plus role ambiguity. |

## High-Risk Anomalies

1. Directory names do not reliably indicate content role.
2. 2021 is labeled Math3, not Math2.
3. 2022 contains severe OCR loss, malformed boundaries, fragmented operators, and suspect answers.
4. 2020 comparison Q6 lacks an explicit D option label; the primary paper has A–D.
5. 2020 Q22 describes three-variable quadratic forms but includes `x_4/y_4` in the transformation.
6. The 1987–2019 files contain images and changing historical exam labels; they are not one homogeneous parser batch.
7. The source repository has no confirmed license for publication.

## Pilot Recommendation

Select the 2020 MinerU paper as the primary question transcription and the tracked 2020 Markdown as comparison-only evidence.

Expected output:

- 23 stable IDs, `math2-2020-q01` through `math2-2020-q23`;
- 8/6/9 question-type distribution;
- complete A–D options from the primary paper;
- 23 missing answers and 23 missing explanations;
- source commit, dirty state, tracked state, hashes, and line ranges;
- blocking anomalies for missing solutions and Q22's dimension conflict;
- no frontend publication.
