# REQ-008 Notes

## Starting Point

- Branch: `codex/math2-2023-comparison-primary-staging`
- Base: `origin/main` at `17c8e098dff1ca41ee8e4c230d827fc231ff71e0`
- Pre-change working tree: clean.

## Decision Carried Forward

REQ-004 stopped because one 2023 transcript was not mechanically stageable as
the primary source. The maintainer selected the path that uses the complete
transcript as primary for Math2 2023.

This task records and executes that decision. It does not make source-role
decisions for other years.

## Evidence To Reconfirm

- `papers/MinerU_markdown_math2_2023_2065687933685170176.md`
  - expected SHA-256:
    `eef3ea76c3491b8753230bfc1089493d2b67f1b1a815bc45de6666a70cdcb02f`
  - expected role in REQ-008: primary transcript after live verification
- `solutions/2023/math2_2023/math2_2023.md`
  - expected SHA-256:
    `c353e535aa9dcda945bc9d88c3c441f3f4d23060a3408209ac3e90efa202bed8`
  - expected role in REQ-008: comparison transcript with known option defects

## Live Source Verification

- Source repo: `D:\work\Kaoyan-Math2-Papers`
- Commit: `fd42c56eed412cce0cb97d6bd688f314c78e542e`
- Branch: `main`
- Dirty state: five untracked restored MinerU Markdown files under `papers/`.
- `papers/MinerU_markdown_math2_2023_2065687933685170176.md`
  - bytes: 6964
  - SHA-256: `eef3ea76c3491b8753230bfc1089493d2b67f1b1a815bc45de6666a70cdcb02f`
  - content finding: complete Q1-Q22 and complete A-D options for Q1-Q10.
- `solutions/2023/math2_2023/math2_2023.md`
  - bytes: 7730
  - SHA-256: `c353e535aa9dcda945bc9d88c3c441f3f4d23060a3408209ac3e90efa202bed8`
  - content finding: known Q2/Q4/Q6/Q7/Q9/Q10 option defects.

REQ-004 labels these paths in the opposite direction of the current file
contents. REQ-008 therefore treats the verified complete file as primary and
records the correction in generated metadata.

## Verification Log

- `python -m unittest tests.test_transform_math2_2023 -v`
  - Result: passed unit-only tests; real-source tests skipped because
    `MATH2_SOURCE_DIR` was not set.
- `python scripts/transform_math2_2023.py D:/work/Kaoyan-Math2-Papers content/staging/math2/2023`
  - First result before source-role correction: generated 22 records but failed
    internal contract validation because the attempted primary path had
    incomplete options.
  - Follow-up result after correction: `Math2 2023: 22 questions,
    schemaValid=True`.
- `mingw32-make NPM=npm.cmd math2-2023-validate`
  - Result: passed.
  - Generated 22 questions.
  - KaTeX: 118 expressions, 0 errors.
  - `tests.test_transform_math2_2023`: 11 tests passed.
- `python -m json.tool` on queue and generated 2023 JSON files
  - Result: passed.
- `mingw32-make NPM=npm.cmd verify`
  - Result: passed.
  - Math2 inventory: 775 files, 11 Markdown sources.
  - Math2 2020: 23 questions, schema valid; KaTeX 96 expressions, 0 errors.
  - Math2 2023: 22 questions, schema valid; KaTeX 118 expressions, 0 errors.
  - Python source tests: 2020 inventory/transform tests passed; 2023 transform
    tests passed.
  - API tests: 10 passed.
  - Web smoke test: passed.
  - Web build and API build: passed.
  - Compileall: passed.

Dependency note: this isolated worktree initially had no `node_modules`, so
`math2-2023-validate` first failed at `ERR_MODULE_NOT_FOUND: katex`. Running
`mingw32-make NPM=npm.cmd install` installed local dependencies. npm warned that
the project declares Node `20.x` while the current runtime is Node `v24.15.0`;
verification still passed under the current runtime.

## Final Source Contract

- REQ-008 does not edit `D:\work\Kaoyan-Math2-Papers`.
- `papers/MinerU_markdown_math2_2023_2065687933685170176.md` is the
  live-verified complete primary transcript for this batch.
- `solutions/2023/math2_2023/math2_2023.md` is retained as comparison evidence
  with option defects for Q2/Q4/Q6/Q7/Q9/Q10.
- All generated records remain `needs_human_review` and `blocked`.
- The committed JSON schema file remains the existing 2020-pilot schema. REQ-008
  does not relax it. The 2023 `schemaValid` field means the year-specific
  transformer contract passed: 22 records, 10/6/6 type counts, complete A-D
  options for all primary multiple-choice questions, no answers/explanations
  invented, and all records blocked.

## Boundary Checks

- Changed paths are limited to REQ-008 docs/reports, Math2 2023 staging, Math2
  queue metadata, Makefile targets, and 2023 transformer/tests.
- No `apps/web`, `apps/api`, auth, database, deployment, `content/final`,
  `content/approved`, or Math1 source changes were made.
- `D:\work\Kaoyan-Math2-Papers` remains read-only from this task. Final observed
  status still shows only the five restored MinerU Markdown files as untracked.
