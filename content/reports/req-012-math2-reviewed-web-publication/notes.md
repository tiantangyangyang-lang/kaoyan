# REQ-012 Notes

## Current State

- Branch: `codex/req-012-math2-reviewed-web-publication`
- Base: `origin/main`
- PR #12 (`codex/req-011-math2-2021-2022-staging-readiness`) remains open and
  is not part of this branch.
- Existing web smoke test still treats Math2 as unavailable; this requirement
  will update that expectation.

## Publication Slice

Use only existing staging artifacts:

- `content/staging/math2/2020/questions.json`
- `content/staging/math2/2023/questions.json`
- `content/staging/math2/2024/questions.json`

Expected generated web count: 67 questions.

Generated static assets under `apps/web/public/data/*.json` are ignored by Git
and are produced by `npm run sync:content` / web build.

## User-Facing Marker

Public wording should communicate:

- Math2 is available as an under-review preview.
- Answers and explanations are still being organized.
- Learners can report issues through `tiantangyangyang@gmail.com`.

## Deployment Boundary

The repository documents Cloudflare Pages as the web host. This task will prepare
the reviewed PR path and static build output; it will not change production DNS,
Cloudflare settings, Render settings, or secrets.

PR handoff: https://github.com/tiantangyangyang-lang/kaoyan/pull/13

## Source Repository State

This task did not manually inspect or edit files in `D:/work/Kaoyan-Math2-Papers`.
The root `make verify` command read the source repository through existing
Makefile targets.

Observed after verification:

- Branch: `main...origin/main`
- Commit: `fd42c56eed412cce0cb97d6bd688f314c78e542e`
- Dirty state: existing untracked files under `papers/`:
  - `MinerU_markdown_math2_1987-2019_2065686324641095680.md`
  - `MinerU_markdown_math2_2020_2065687152877731840.md`
  - `MinerU_markdown_math2_2021_2065687851346780160.md`
  - `MinerU_markdown_math2_2022_2065687890395758592.md`
  - `MinerU_markdown_math2_2023_2065687933685170176.md`

No source repository writes were performed by this task.

## Verification Results

- `npm.cmd run sync:content --workspace @kaoyan/web`: passed, generated 67
  Math2 preview questions.
- Generated Math2 check: years 2020/2023/2024, counts 23/22/22, invalid records
  0.
- `npm.cmd run typecheck --workspace @kaoyan/web`: passed.
- `npm.cmd run build --workspace @kaoyan/web`: passed outside sandbox.
- `npm.cmd run test:smoke:ci --workspace @kaoyan/web`: passed outside sandbox.
- `mingw32-make NPM=npm.cmd verify`: passed.
- Final `mingw32-make NPM=npm.cmd verify`: passed after the obsolete
  unavailable-component cleanup.

## Review Notes

- A `code-reviewer` subagent was requested for the diff, but the agent errored
  with a stream disconnect before returning findings.
- Local review checks completed:
  - no stale Math2 unavailable component or "建设中/尚未完成" route remains;
  - no 2021, 2022, or 1987-2019 Math2 data is read by `sync-content.mjs`;
  - `sync-content.mjs` rejects non-missing Math2 answers/explanations and
    rejects option objects containing `text`;
  - `git diff --check` passed.
