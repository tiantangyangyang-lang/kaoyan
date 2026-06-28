# Math2 Full Import Preparation Queue

## Queue Rules

- Source root is `D:\work\Kaoyan-Math2-Papers` and is read-only.
- Markdown is primary evidence when usable Markdown exists. PDF may not become the
  primary input for a mechanical batch without a new primary-agent decision.
- Every batch writes only to `content/staging/math2/<year>/` and
  `content/reports/math2-<year>/`.
- Every batch keeps `reviewStatus: needs_human_review` and
  `finalizationStatus: blocked`.
- Every batch records source commit, dirty state, relative source paths, SHA-256
  hashes, line ranges, validation results, anomaly counts, changed files, and
  unresolved blockers.
- Every batch must stop on anomalies that change source role, year identity,
  question boundary, answer evidence, image evidence, or schema shape.
- No batch may publish, write to `apps/web`, write to `apps/api`, write to
  `content/final`, write to `content/approved`, commit, push, or edit source files.

## Shared Forbidden Paths

- `D:/work/Kaoyan-Math2-Papers/**` for writes
- `apps/web/**`
- `apps/api/**`
- `content/final/**`
- `content/approved/**`
- `content/review/**`
- `content/staging/math1/**`
- `content/review/math1/**`
- `content/final/math1/**`

## Shared Validation Commands

Run the source inventory before and after any future batch:

```powershell
python scripts/inventory_math2_markdown.py D:\work\Kaoyan-Math2-Papers content/reports/req-003-math2-full-import-prep/source-inventory.json
```

Run the 2020 reference gate:

```powershell
mingw32-make NPM=npm.cmd math2-validate
```

Run a future year-specific validation after that converter exists:

```powershell
python scripts/transform_math2_<year>.py D:\work\Kaoyan-Math2-Papers content/staging/math2/<year>
node scripts/validate_math2_katex.mjs content/staging/math2/<year>/questions.json content/staging/math2/<year>/katex-validation.json
python -m unittest tests.test_transform_math2_<year> -v
```

Run import dry-run only after the staged year passes schema, KaTeX, deterministic
rerun, and human spot-check gates:

```powershell
mingw32-make NPM=npm.cmd math2-import-dry-run
```

The dry-run must roll back. A batch result is invalid if any row is visible as
`published` or if a partial year remains after failure.

## Batch Queue

### Batch `math2-2020-reference-gate`

- Status: reference-only
- Input year: 2020
- Allowed read paths:
  - `papers/MinerU_markdown_math2_2020_2065687152877731840.md`
  - `solutions/2020/math2_2020/math2_2020.md`
- Expected outputs:
  - `content/staging/math2/2020/questions.json`
  - `content/staging/math2/2020/anomalies.json`
  - `content/staging/math2/2020/validation.json`
  - `content/staging/math2/2020/katex-validation.json`
  - `content/staging/math2/2020/summary.md`
- Expected result:
  - 23 questions
  - 8 multiple choice, 6 fill-in-the-blank, 9 solution/proof
  - answers/explanations missing
  - Q6 comparison-option anomaly preserved
  - Q22 formula-dimension anomaly preserved
- Validation:
  - `mingw32-make NPM=npm.cmd math2-validate`
  - `mingw32-make NPM=npm.cmd test-math2`
- Dry-run import:
  - `mingw32-make NPM=npm.cmd math2-import-dry-run`
- Rollback requirement: dry-run inserts all validated rows, verifies count, then rolls back.
- Delegation: do not delegate except as a reference comparison.

### Batch `math2-2023-paper-only-staging`

- Status: staged, blocked for human review
- Input year: 2023
- Allowed read paths:
  - `papers/MinerU_markdown_math2_2023_2065687933685170176.md`
  - `solutions/2023/math2_2023/math2_2023.md`
- Known hashes:
  - paper: `eef3ea76c3491b8753230bfc1089493d2b67f1b1a815bc45de6666a70cdcb02f`
  - comparison: `c353e535aa9dcda945bc9d88c3c441f3f4d23060a3408209ac3e90efa202bed8`
- Source-role decision:
  - Requirement: `docs/requirements/REQ-008-math2-2023-comparison-primary-staging.md`
  - Prior audit: `docs/requirements/REQ-004-math2-2023-staging.md`
  - Decision: use the live-verified complete transcript as primary.
  - Primary: `papers/MinerU_markdown_math2_2023_2065687933685170176.md`
  - Comparison: `solutions/2023/math2_2023/math2_2023.md`
  - Correction: REQ-004 path labels are inverted relative to current file
    contents; the `papers/` file is complete, while the `solutions/` file has
    option defects.
- Expected outputs:
  - `content/staging/math2/2023/questions.json`
  - `content/staging/math2/2023/anomalies.json`
  - `content/staging/math2/2023/validation.json`
  - `content/staging/math2/2023/katex-validation.json`
  - `content/staging/math2/2023/summary.md`
  - `content/reports/math2-2023/human-review-checklist.md`
- Expected result:
  - 22 questions
  - 10 multiple choice, 6 fill-in-the-blank, 6 solution/proof
  - primary transcript complete for Q1-Q10 options A-D
  - answers/explanations missing
  - all records blocked for human review and publication
  - comparison transcript option defects preserved for Q2/Q4/Q6/Q7/Q9/Q10
- Validation:
  - `mingw32-make NPM=npm.cmd math2-2023-validate`
- Dry-run import:
  - `mingw32-make NPM=npm.cmd math2-import-dry-run` after staging path is parameterized or explicitly pointed at 2023
- Rollback requirement: dry-run must leave no staging-to-published side effect.
- Stop conditions: missing question boundary, unexpected answer evidence, primary
  option shape drift, duplicate Q number, schema error, KaTeX error, image
  reference, source hash mismatch, or any new source-role ambiguity.

### Batch `math2-2024-role-ambiguous-paper-like`

- Status: audit completed by REQ-009; Markdown source approved for a follow-up
  staging requirement
- Input year: 2024
- Allowed read paths:
  - `solutions/2024/math2_2024.md`
  - `solutions/2024/images/7884391bcaec6d4b3b606a079c578a4913ccb65a0f43986faeb8ca2af3e7e68e.jpg`
  - `solutions/2024/images/d98314f433fa3074d0317cf7d9672b1e6b185e8a8e5a3e2a22ab1853b1498ae1.jpg`
  - `solutions/2024/images/ccde6b36e7a52892b052d64b0476872615cb2aba24502e52d014c6603b5e2c11.jpg`
- Known hashes:
  - `solutions/2024/math2_2024.md`: `38d3a737c302a4ae79094fbaacb489d33fcb7b15de1330aa6b20888aaea8358b`
  - `solutions/2024/images/7884391bcaec6d4b3b606a079c578a4913ccb65a0f43986faeb8ca2af3e7e68e.jpg`: `143fbb6e676f2d2c9d81665184043e8c7b44dd0730008d37a99c4e177b557c54`
  - `solutions/2024/images/d98314f433fa3074d0317cf7d9672b1e6b185e8a8e5a3e2a22ab1853b1498ae1.jpg`: `ddef685f158502f8b177dd0d3c36ef61a58e8b0b1cc897bfccae1a0f3fdff128`
  - `solutions/2024/images/ccde6b36e7a52892b052d64b0476872615cb2aba24502e52d014c6603b5e2c11.jpg`: `390bb4fd531eb7723b9ca56744b3ef38079eb98566fb7f7250634355302cfd69`
- Expected outputs:
  - `content/staging/math2/2024/questions.json`
  - `content/staging/math2/2024/anomalies.json`
  - `content/staging/math2/2024/validation.json`
  - `content/staging/math2/2024/katex-validation.json`
  - `content/staging/math2/2024/summary.md`
  - `content/reports/math2-2024/human-review-checklist.md`
- Expected result:
  - `solutions/2024/math2_2024.md` is the approved Markdown source for the next
    2024 staging task
  - three queued JPG references resolved but classified as non-blocking
    watermark/logo artifacts
  - answers/explanations missing unless source markers are explicit
  - all records remain blocked for human review and publication
- Validation:
  - `python scripts/transform_math2_2024.py D:\work\Kaoyan-Math2-Papers content/staging/math2/2024`
  - `node scripts/validate_math2_katex.mjs content/staging/math2/2024/questions.json content/staging/math2/2024/katex-validation.json`
  - `python -m unittest tests.test_transform_math2_2024 -v`
- Dry-run import:
  - forbidden until the follow-up Markdown staging task passes schema, KaTeX,
    deterministic rerun, and human spot-check gates
- Rollback requirement: not applicable until dry-run is approved; any accidental DB write fails acceptance.
- Stop conditions: image cannot be resolved, source role ambiguity expands,
  answer invention pressure, schema error, or KaTeX error.

### Batch `math2-2021-wrong-subject-audit`

- Status: audit-only, blocked
- Input year: 2021
- Allowed read paths:
  - `papers/MinerU_markdown_math2_2021_2065687851346780160.md`
  - `solutions/2021/math2_2021/math2_2021.md`
- Known hashes:
  - paper: `6c7c470e3edcafa3a5541365406c10cfcd6322db32cb5e27581cb3e8a34f8f1e`
  - comparison: `effe54ef9285571d75a9b3eff150fcad8276aa180298f242c289b0626992229d`
- Expected outputs:
  - `content/reports/math2-2021/source-role-audit.md`
  - optional blocked staging only if primary Codex clears subject identity
- Expected result:
  - explicit wrong-subject title finding if `数学三` remains present
  - no importable staging unless subject identity is resolved
- Validation:
  - source hash check
  - title/heading scan
  - boundary scan
  - answer/explanation marker scan
- Dry-run import:
  - forbidden
- Rollback requirement: no DB command may run.
- Stop conditions: any wrong-subject evidence, conflicting title, or unresolved source identity.

### Batch `math2-2022-ocr-boundary-audit`

- Status: audit-only, blocked
- Input year: 2022
- Allowed read paths:
  - `papers/MinerU_markdown_math2_2022_2065687890395758592.md`
  - `solutions/2022/math2_2022/math2_2022.md`
- Known hashes:
  - paper: `5ccb6ed1c8d12157bd72d44414dff2616465da113a39295acedceb7675052b70`
  - comparison: `9c6f7ffb8c0780413b6c81e37f3e2d4b1a007ddf0b1f02b4ae681d441bd3de6c`
- Expected outputs:
  - `content/reports/math2-2022/source-role-audit.md`
  - `content/reports/math2-2022/boundary-risk-map.md`
  - optional blocked staging only if primary Codex clears boundary rules
- Expected result:
  - explicit OCR and malformed-boundary findings
  - no importable staging until all expected boundaries have source evidence
- Validation:
  - source hash check
  - ordinary and fallback boundary scans
  - answer/explanation marker scan
  - OCR noise scan
- Dry-run import:
  - forbidden
- Rollback requirement: no DB command may run.
- Stop conditions: missing Q2/Q7/Q10 evidence, malformed answer boundary, OCR corruption that changes math meaning, schema guesswork.

## Historical Per-Year Split Queue

Shared historical allowed read paths for each year 1987-2019:

- `papers/MinerU_markdown_math2_1987-2019_2065686324641095680.md`
- `solutions/math2_1987-2019/math2_1987-2019.md`
- `solutions/math2_1987-2019/images/**` only for image references present in the selected year section

Shared historical known hashes:

- paper: `c8cf81ea4a1b38fd483cbd5bc569a1e7d443792406f075f2fecb61f0156f23d3`
- solution/comparison: `ef715711e094d2c30af75dee43e777c3870c781b91521da6604579d04e955e01`

Shared historical validation:

```powershell
python scripts/split_math2_1987_2019.py D:\work\Kaoyan-Math2-Papers content/intermediate/math2-split
python scripts/transform_math2_<year>.py D:\work\Kaoyan-Math2-Papers content/staging/math2/<year>
node scripts/validate_math2_katex.mjs content/staging/math2/<year>/questions.json content/staging/math2/<year>/katex-validation.json
python -m unittest tests.test_transform_math2_<year> -v
```

The split script and tests do not exist yet. Creating them is a future implementation
task and must be reviewed before any mechanical per-year conversion.

| Batch | Year | Expected outputs | Dry-run import |
|---|---:|---|---|
| `math2-1987-split-prep` | 1987 | `content/staging/math2/1987/*`, `content/reports/math2-1987/*` | Forbidden until split and subject mapping pass. |
| `math2-1988-split-prep` | 1988 | `content/staging/math2/1988/*`, `content/reports/math2-1988/*` | Forbidden until split and subject mapping pass. |
| `math2-1989-split-prep` | 1989 | `content/staging/math2/1989/*`, `content/reports/math2-1989/*` | Forbidden until split and subject mapping pass. |
| `math2-1990-split-prep` | 1990 | `content/staging/math2/1990/*`, `content/reports/math2-1990/*` | Forbidden until split and subject mapping pass. |
| `math2-1991-split-prep` | 1991 | `content/staging/math2/1991/*`, `content/reports/math2-1991/*` | Forbidden until split and subject mapping pass. |
| `math2-1992-split-prep` | 1992 | `content/staging/math2/1992/*`, `content/reports/math2-1992/*` | Forbidden until split and subject mapping pass. |
| `math2-1993-split-prep` | 1993 | `content/staging/math2/1993/*`, `content/reports/math2-1993/*` | Forbidden until split and subject mapping pass. |
| `math2-1994-split-prep` | 1994 | `content/staging/math2/1994/*`, `content/reports/math2-1994/*` | Forbidden until split and subject mapping pass. |
| `math2-1995-split-prep` | 1995 | `content/staging/math2/1995/*`, `content/reports/math2-1995/*` | Forbidden until split and subject mapping pass. |
| `math2-1996-split-prep` | 1996 | `content/staging/math2/1996/*`, `content/reports/math2-1996/*` | Forbidden until split and subject mapping pass. |
| `math2-1997-split-prep` | 1997 | `content/staging/math2/1997/*`, `content/reports/math2-1997/*` | Forbidden until split pass. |
| `math2-1998-split-prep` | 1998 | `content/staging/math2/1998/*`, `content/reports/math2-1998/*` | Forbidden until split pass. |
| `math2-1999-split-prep` | 1999 | `content/staging/math2/1999/*`, `content/reports/math2-1999/*` | Forbidden until split pass. |
| `math2-2000-split-prep` | 2000 | `content/staging/math2/2000/*`, `content/reports/math2-2000/*` | Forbidden until split pass. |
| `math2-2001-split-prep` | 2001 | `content/staging/math2/2001/*`, `content/reports/math2-2001/*` | Forbidden until split pass. |
| `math2-2002-split-prep` | 2002 | `content/staging/math2/2002/*`, `content/reports/math2-2002/*` | Forbidden until split pass. |
| `math2-2003-split-prep` | 2003 | `content/staging/math2/2003/*`, `content/reports/math2-2003/*` | Forbidden until split pass. |
| `math2-2004-split-prep` | 2004 | `content/staging/math2/2004/*`, `content/reports/math2-2004/*` | Forbidden until split pass. |
| `math2-2005-split-prep` | 2005 | `content/staging/math2/2005/*`, `content/reports/math2-2005/*` | Forbidden until split pass. |
| `math2-2006-split-prep` | 2006 | `content/staging/math2/2006/*`, `content/reports/math2-2006/*` | Forbidden until split pass. |
| `math2-2007-split-prep` | 2007 | `content/staging/math2/2007/*`, `content/reports/math2-2007/*` | Forbidden until split pass. |
| `math2-2008-split-prep` | 2008 | `content/staging/math2/2008/*`, `content/reports/math2-2008/*` | Forbidden until split pass. |
| `math2-2009-split-prep` | 2009 | `content/staging/math2/2009/*`, `content/reports/math2-2009/*` | Forbidden until split pass. |
| `math2-2010-split-prep` | 2010 | `content/staging/math2/2010/*`, `content/reports/math2-2010/*` | Forbidden until split pass. |
| `math2-2011-split-prep` | 2011 | `content/staging/math2/2011/*`, `content/reports/math2-2011/*` | Forbidden until split pass. |
| `math2-2012-split-prep` | 2012 | `content/staging/math2/2012/*`, `content/reports/math2-2012/*` | Forbidden until split pass. |
| `math2-2013-split-prep` | 2013 | `content/staging/math2/2013/*`, `content/reports/math2-2013/*` | Forbidden until split pass. |
| `math2-2014-split-prep` | 2014 | `content/staging/math2/2014/*`, `content/reports/math2-2014/*` | Forbidden until split pass. |
| `math2-2015-split-prep` | 2015 | `content/staging/math2/2015/*`, `content/reports/math2-2015/*` | Forbidden until split pass. |
| `math2-2016-split-prep` | 2016 | `content/staging/math2/2016/*`, `content/reports/math2-2016/*` | Forbidden until split pass. |
| `math2-2017-split-prep` | 2017 | `content/staging/math2/2017/*`, `content/reports/math2-2017/*` | Forbidden until split pass. |
| `math2-2018-split-prep` | 2018 | `content/staging/math2/2018/*`, `content/reports/math2-2018/*` | Forbidden until split pass. |
| `math2-2019-split-prep` | 2019 | `content/staging/math2/2019/*`, `content/reports/math2-2019/*` | Forbidden until split pass. |

## Result Contract

Each batch result must report:

- exact input paths and hashes;
- source commit and dirty state;
- files read;
- files changed;
- question counts by type;
- questions generated and skipped;
- anomaly counts by type and severity;
- image references and resolution state;
- KaTeX expression count and failures;
- schema validation result;
- deterministic rerun result;
- dry-run import command and rollback result when approved;
- unresolved blockers;
- confirmation that frontend/API/final/published paths were not changed.
