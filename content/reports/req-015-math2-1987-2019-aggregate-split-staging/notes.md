# Notes: REQ-015 Math2 1987-2019 Aggregate Split Staging

## Current Main and PR State

- Branch was created from updated `origin/main`.
- PR #15 was checked with `gh pr view 15`.
- PR #15 state: `OPEN`.
- PR #15 title: `feat(math2): add 2022 source-role blocker gate`.
- PR #15 URL: `https://github.com/tiantangyangyang-lang/kaoyan/pull/15`.
- PR #15 branch: `codex/req-014-math2-2022-source-role-staging`.
- PR #15 conclusion used as evidence only: 2022 remains blocked because Q5,
  Q7, and Q10 cannot be represented as complete A-D options without invention.

## Prior Requirement Boundaries

- REQ-003: 1987-2019 must be split by year before staging; no combined all-years
  import is allowed; 1987-1996 require historical title review because headings
  may say `试卷三`.
- REQ-011: 2021 is blocked as wrong subject; 2022 needs a focused source-role
  decision before staging.
- REQ-013: current DB preview import boundary covers already staged Math2
  2020/2023/2024 only.
- REQ-014: open PR evidence says 2022 is still not safe for staging or DB import.

## Known Safe Import Boundary Before REQ-015

- Existing Math2 staging years: 2020, 2023, 2024.
- Existing staged question count: 67.
- Blocked years: 2021 wrong subject, 2022 incomplete options, 1987-2019 pending
  aggregate split and historical title review.

## Source Repo Before-State

- Source root: `D:\work\Kaoyan-Math2-Papers`
- Source branch: `main`
- Source commit: `fd42c56eed412cce0cb97d6bd688f314c78e542e`
- Dirty state:
  - `?? papers/MinerU_markdown_math2_1987-2019_2065686324641095680.md`
  - `?? papers/MinerU_markdown_math2_2020_2065687152877731840.md`
  - `?? papers/MinerU_markdown_math2_2021_2065687851346780160.md`
  - `?? papers/MinerU_markdown_math2_2022_2065687890395758592.md`
  - `?? papers/MinerU_markdown_math2_2023_2065687933685170176.md`

## REQ-015 Audit Findings

- Audit command: `mingw32-make NPM=npm.cmd math2-1987-2019-audit`.
- Result: passed; 7 focused tests passed.
- Output directory:
  `content/reports/req-015-math2-1987-2019-aggregate-split-staging/`.
- Source inventory:
  - `papers/MinerU_markdown_math2_1987-2019_2065686324641095680.md`
    - role: `aggregate_paper_path_contains_solutions`
    - lines: 8197
    - bytes: 444494
    - sha256: `c8cf81ea4a1b38fd483cbd5bc569a1e7d443792406f075f2fecb61f0156f23d3`
  - `solutions/math2_1987-2019/math2_1987-2019.md`
    - role: `aggregate_solutions_path`
    - lines: 7907
    - bytes: 391659
    - sha256: `ef715711e094d2c30af75dee43e777c3870c781b91521da6604579d04e955e01`
- Year boundary scan:
  - both aggregate sources contain the complete 1987-2019 expected year set;
  - missing years: none.
- 1987-1996 decision:
  - status: `blocked_historical_subject_title_review`;
  - reason: headings say `试卷三`.
- 1997-2019 decision:
  - status: `split_ready_staging_blocked`;
  - reason: stable Math2 year headings exist, but each year still needs
    per-year extraction/review before staging.
- Future per-year staging candidates:
  - 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006,
    2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015,
    2016, 2017, 2018, 2019.
- No `content/staging/math2/<year>/` files were generated in REQ-015.
- No live DB dry-run or import was run.
- DeepSeek was not used because deterministic local scans were sufficient and
  avoiding the secret file reduced unnecessary credential exposure risk.

## Security Note

- `C:\Users\60549\Downloads\deepseek-api.txt` may contain a secret.
- The key must remain local-only and read-only.
- Do not print, store, commit, or include the key in any report or PR text.
- This task only checked that the file exists; it did not read the file content.

## Verification

- First `mingw32-make NPM=npm.cmd verify`: failed because `katex` was missing
  from this worktree.
- First `mingw32-make NPM=npm.cmd install`: failed in the sandbox because npm
  could not access `C:\Users\60549\AppData\Local\npm-cache`.
- Escalated `mingw32-make NPM=npm.cmd install`: passed; npm warned that the
  project expects Node `20.x` and the current runtime is `v24.15.0`.
- Second `mingw32-make NPM=npm.cmd verify`: passed.
  - Math2 inventory: 775 files, 11 Markdown sources.
  - Math2 2020: 23 questions; KaTeX 96 expressions, 0 errors; 14 Python tests
    passed.
  - Math2 2021/2022 audit: 2021 `blocked_wrong_subject`, 2022
    `blocked_source_role_decision_required`; 6 Python tests passed.
  - Math2 1987-2019 aggregate audit: 33 years; future candidates 1997-2019;
    7 Python tests passed.
  - Math2 2023: 22 questions; KaTeX 118 expressions, 0 errors; 11 Python tests
    passed.
  - Math2 2024: 22 questions; KaTeX 117 expressions, 0 errors; 12 Python tests
    passed.
  - API tests passed: 10.
  - Web smoke test passed.
  - Web/API builds and Python compileall passed.

## Source Repo After-State

- Source branch: `main`
- Source commit: `fd42c56eed412cce0cb97d6bd688f314c78e542e`
- Dirty state unchanged:
  - `?? papers/MinerU_markdown_math2_1987-2019_2065686324641095680.md`
  - `?? papers/MinerU_markdown_math2_2020_2065687152877731840.md`
  - `?? papers/MinerU_markdown_math2_2021_2065687851346780160.md`
  - `?? papers/MinerU_markdown_math2_2022_2065687890395758592.md`
  - `?? papers/MinerU_markdown_math2_2023_2065687933685170176.md`
