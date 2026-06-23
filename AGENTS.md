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
- Do not merge without review.

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

## Verification Report

Every PR handoff must report:

- requirement path;
- changed files;
- untouched user files;
- exact verification commands and results;
- known limits or untested states.
