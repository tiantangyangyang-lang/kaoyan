# Engineering Workflow

## One Task, One Context

The unit of work is a requirement, not a chat session that accumulates unrelated requests.

```text
requirement document
        ↓
new Codex thread
        ↓
codex/* branch
        ↓
implementation + make verify
        ↓
commit + Pull Request + review
```

Use a new Codex thread when:

- a new feature, bug, refactor, or research objective begins;
- the target files or acceptance criteria differ from the current requirement;
- the current task has already reached a PR.

Continue the current thread only for fixes required to satisfy the same requirement or PR review.

## Requirement Lifecycle

1. Create `docs/requirements/REQ-NNN-short-name.md`.
2. Define scope, exclusions, acceptance criteria, risks, and verification.
3. Create `codex/short-name`.
4. Implement the smallest change that satisfies the requirement.
5. Run `make verify`.
6. Commit with Conventional Commits.
7. Push and open a PR referencing the requirement.
8. Review before merge.

## Pull Request Size

Prefer one user-visible feature or one cohesive fix per PR. Split a task when:

- it changes unrelated subsystems;
- reviewers need different domain expertise;
- rollout or rollback should be independent;
- the diff cannot be explained by one requirement document.

## Agent Delegation

Delegate repetitive work only after the schema, examples, and validation rules are stable.

Each delegated task must state:

- exact allowed write paths;
- exact forbidden paths;
- input IDs or records;
- deterministic validation commands;
- expected output format.

Agents must not choose mathematical claims, infer missing answers, introduce new animation types, or change authentication boundaries without primary review.

## Pull Request Gate

The required local gate is:

```bash
make verify
```

It runs:

- Web and API type checking;
- API tests;
- Web smoke tests;
- Web and API production builds.

The smoke target starts and stops its own Vite server. PR verification must not
depend on a developer already running `make dev`.

The PR description records the command and result. If a check cannot run, the PR must name the blocker instead of marking it passed.
