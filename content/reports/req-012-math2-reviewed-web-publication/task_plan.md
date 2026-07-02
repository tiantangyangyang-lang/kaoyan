# REQ-012 Task Plan

## Objective

Publish the already-staged Math2 2020, 2023, and 2024 questions to the web app
as a clearly marked under-review static preview.

## Plan

- [x] P0: Confirm branch boundary from `origin/main`.
- [x] P0: Create requirement and report artifacts.
- [x] P0: Extend web content sync to generate `math2.json` from only
  `content/staging/math2/2020`, `2023`, and `2024`.
- [x] P0: Validate generated Math2 counts, status fields, missing answers, and
  option shape.
- [x] P0: Enable Math2 subject selection in the web app.
- [x] P0: Add visible under-review/feedback markers in Math2 question and paper
  views.
- [x] P1: Update smoke coverage for Math2 selection and marker visibility.
- [x] P1: Run web verification and root `make verify`.
- [x] P1: Commit, push, and open a focused PR.

## Boundaries

- No 2021, 2022, or 1987-2019 content.
- No DB import or dry-run.
- No source-repo edits.
- No invented Math2 answers, explanations, options, or formulas.
- No production DNS, Cloudflare, Render, or secret changes.

## Verification Log

- `npm.cmd run sync:content --workspace @kaoyan/web` passed.
  - Generated Math1: 852 questions.
  - Generated Math2: 67 questions.
- Math2 generated data spot check passed:
  - years: 2020, 2023, 2024;
  - counts: 2020=23, 2023=22, 2024=22;
  - invalid status/option/missing-answer records: 0.
- `npm.cmd run typecheck --workspace @kaoyan/web` passed.
- `npm.cmd run build --workspace @kaoyan/web` passed outside the sandbox after
  sandboxed Vite config loading was denied.
- `npm.cmd run test:smoke:ci --workspace @kaoyan/web` passed outside the sandbox
  after sandboxed Vite config loading was denied.
- `mingw32-make NPM=npm.cmd verify` passed.
- Final `mingw32-make NPM=npm.cmd verify` passed again after removing the
  obsolete Math2 unavailable component/style.
- Code-review subagent attempt failed with a stream disconnect before producing
  findings. Local boundary scans found no 2021/2022/1987-2019 publication path,
  no stale Math2 unavailable UI, and no `git diff --check` errors.

## PR Handoff

- PR: https://github.com/tiantangyangyang-lang/kaoyan/pull/13
