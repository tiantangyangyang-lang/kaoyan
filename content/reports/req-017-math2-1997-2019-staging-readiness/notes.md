# Notes: REQ-017 Math2 1997-2019 Staging Readiness

## Setup

- Current date: 2026-07-04.
- Branch: `codex/req-017-math2-1997-2019-staging-readiness`.
- Base: latest `origin/main` fetched before branch creation.

## Constraints To Preserve

- Do not invent answers, explanations, options, or formulas.
- Do not relax `math2-question-staging-v2`.
- Option shape must be `{"label","value"}`.
- Staging records remain `reviewStatus: needs_human_review` and `finalizationStatus: blocked`.
- `D:\work\Kaoyan-Math2-Papers` is read-only.
- No secrets or `.env` content may be committed or printed.

## Findings

- Prior requirements confirm the active boundary:
  - 1987-2019 aggregate must be split by year before any staging.
  - 1987-1996 headings identify `试卷三` and are excluded from Math2.
  - 1997-2019 is the remaining Math2 aggregate candidate range.
  - 2021/2022 blockers remain separate and are not repaired in this PR.
  - Public APIs remain published-only; staging import must not imply publication.
- Existing REQ-016 script `scripts/transform_math3_1987_1996.py` provides the closest reusable pattern for source inventory, year splitting, question splitting, schema validation, report writing, and Makefile targets.
- Existing import CLI scripts already support repo-root relative staging paths from npm workspace execution.

## Blocker

- Attempted read-only source commands for `D:\work\Kaoyan-Math2-Papers` were rejected by the approval layer because the current Codex usage limit was reached.
- No source content from 1997-2019 was read in this run.
- No staging records should be generated from prior memory or inferred headings.
- Safe next action after usage reset: run read-only source inventory and mechanical aggregate scans, then decide safe years.

## Next Source Commands

Run after read-only access is available:

```powershell
git -C D:\work\Kaoyan-Math2-Papers status --short --branch
git -C D:\work\Kaoyan-Math2-Papers rev-parse HEAD
Get-ChildItem -Recurse -File D:\work\Kaoyan-Math2-Papers | Where-Object { $_.FullName -match '1987-2019|2065686324641095680' } | Select-Object FullName,Length
```
## REQ-017 Findings After Source Scan

- Source inventory:
  - Source repo: `D:\work\Kaoyan-Math2-Papers`
  - Branch: `main`
  - Commit: `fd42c56eed412cce0cb97d6bd688f314c78e542e`
  - Dirty state: unchanged; five untracked MinerU paper Markdown files.
  - Paper aggregate SHA-256: `c8cf81ea4a1b38fd483cbd5bc569a1e7d443792406f075f2fecb61f0156f23d3`
  - Solutions aggregate SHA-256: `ef715711e094d2c30af75dee43e777c3870c781b91521da6604579d04e955e01`
- Year boundary scan:
  - 1997-2019 all have top-level `考研数学试卷二解答` headings in both aggregate sources.
  - 1987-1996 remain excluded from Math2 and handled as Math3 in REQ-016.
- Generated staging:
  - Output: `content/staging/math2/1997` through `content/staging/math2/2019`.
  - Total generated records: 455.
  - Answer fields sourced: 147.
  - Explanation fields sourced: 318.
  - All records are `needs_human_review` and `blocked`.
  - All generated payloads are schema-valid.
  - KaTeX report: 23/23 years, 0 errors.
- Blocking anomalies:
  - Every generated year has blocking review anomalies.
  - Cross-paper references are recorded and not expanded.
  - Incomplete choice options are converted to `unknown` instead of inventing options.
  - Section split mismatches are grouped into blocked review items instead of forcing unsafe question boundaries.

## Validation Result

- `mingw32-make NPM=npm.cmd math2-1997-2019-validate`
  - Passed.
  - Generated 455 staging records.
  - Generated 23 KaTeX reports with 0 errors.
  - Ran 5 focused transform tests.

## Database Boundary

- Safe DB boundary: these 1997-2019 payloads are suitable for staging import only after full verification, because the importer accepts `unknown` and blocked records.
- Publication boundary: none of these years are publishable in this requirement because every year has blocking anomalies.
- Live DB dry-run/commit has not been run for REQ-017 yet.
## Full Verification Result

- `npm.cmd run test --workspace @kaoyan/api`
  - Passed after removing non-schema `sourceQuestionMarker` from generated payloads.
  - API importer validates and dry-runs all Math2 1997-2019 aggregate staging payloads.
- `mingw32-make NPM=npm.cmd verify`
  - Passed.
  - Includes Math2 inventory, 2020 validation, 2021/2022 audit, 1997-2019 validation, 2023/2024 validation, Math3 1987-1996 validation, web/API typecheck, API tests, web smoke, web/API builds, and Python compileall.
