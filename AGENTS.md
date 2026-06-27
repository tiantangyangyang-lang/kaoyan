# Repository Engineering Rules

## Task Boundary

Every non-trivial task must use one isolated context:

1. Create or identify one requirement document under `docs/requirements/`.
2. Start a new Codex thread for that requirement.
3. Create one `codex/<requirement-slug>` branch.
4. Keep the branch limited to that requirement.
5. Deliver the change through one Pull Request.

Do not continue an unrelated feature in an old thread. A follow-up belongs in the
same thread only when it changes the acceptance criteria of the active requirement.

## Required Artifacts

Before implementation, the requirement document must state:

- problem and user value;
- in-scope and out-of-scope behavior;
- acceptance criteria;
- data, authentication, performance, and compatibility constraints;
- verification commands.

For multi-step work, keep durable progress in the requirement report directory or
the existing `task_plan.md` and `notes.md`.

## Git Workflow

- Never develop directly on `main`.
- Branch names use `codex/<requirement-slug>`.
- Commits follow Conventional Commits.
- Do not mix unrelated user files into a commit.
- Run `make verify` before pushing.
- Open a PR with the repository template and include the requirement path.
- Do not merge without review. No merge by PR title or commit summary alone; review the full `git diff base...HEAD`.

## Command Interface

Use the root `Makefile` as the stable command interface:

- `make install`
- `make dev`
- `make dev-api`
- `make typecheck`
- `make test`
- `make build`
- `make verify`

If Windows PowerShell blocks `npm.ps1`, run Make with `NPM=npm.cmd`, for example:

```powershell
make verify NPM=npm.cmd
```

When adding a recurring project command, add or update a Make target instead of
publishing a one-off shell command as the primary workflow.

## Database

The production database is MySQL, accessed through `mysql2`.

- Keep application tables under the `kaoyan_` prefix.
- Update both `apps/api/schema.sql` and startup schema initialization.
- Use parameterized SQL.
- Do not overwrite manually maintained content during application startup.
- Validate JSON payloads at runtime before returning them through an API.

## Math2 Source & Data Discipline

Math2 sources in `D:\work\Kaoyan-Math2-Papers` (read-only) split by year:

- **1987–2019**: one multi-year aggregate source containing questions AND
  answers/explanations. It must be split by year before any per-year staging; no
  combined all-years import is allowed. Years 1987–1996 need historical
  subject-title review (headings say `试卷三`).
- **2020–2024**: year-by-year question-only sources (no answers/explanations in
  the transcripts). 2020 is the frozen gold pilot.

Data integrity rules:

- Do not invent answers, explanations, options, or formulas. Missing data must be
  `null` with status `missing`.
- Do not relax the `math2-question-staging-v2` schema unless explicitly approved
  by the maintainer.
- Do not run a live database dry-run without a configured `DATABASE_URL` and
  explicit maintainer approval; cite existing transactional unit coverage instead.
- Option shape is exactly `{"label","value"}`; `option.text` is forbidden.
- Every staging record stays `reviewStatus: needs_human_review` and
  `finalizationStatus: blocked` until a separate promotion requirement.
- Treat `D:\work\Kaoyan-Math2-Papers` as strictly read-only; record its commit and
  dirty state before and after any Math2 task.

## Security Guardrails

Before every commit, confirm:

- No hardcoded secrets (API keys, passwords, tokens, `DATABASE_URL`).
- All user inputs and JSON payloads are validated before reaching the API.
- SQL uses parameterized queries; never string-concatenate SQL.
- Error messages do not leak stack traces, SQL, or internal paths.
- Authentication and authorization are enforced on every non-public endpoint.

Secret management:

- NEVER hardcode secrets in source or committed files. Use environment variables
  or `.env` (gitignored). Validate required secrets at application startup.
- Never commit `settings.json`, `.env`, `*.key`, `*.pem`, or credentials.

Security response protocol:

1. STOP immediately when a security issue is found.
2. Fix CRITICAL issues before any other work.
3. Rotate any secret that may have been exposed.
4. Review the codebase for similar issues.
5. Record the issue and the fix in the requirement report.

## Verification Report

Every PR handoff must report:

- requirement path;
- changed files;
- untouched user files;
- exact verification commands and results;
- known limits or untested states.
