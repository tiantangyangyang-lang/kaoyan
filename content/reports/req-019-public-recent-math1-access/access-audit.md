# REQ-019 Access Audit

Status: local implementation and targeted verification complete; Git delivery and
deployment not started.

## Result

The API and static frontend now enforce one access policy:

- Math1 2018-2025: anonymously visible.
- Math1 1987-2017: login required.
- Math2 and Math3: login required for every year.

No question, answer, option, formula, explanation, stable ID, source record, approval,
or publication status was edited.

## API verification matrix

| Request | Anonymous | Authenticated | Evidence |
| --- | --- | --- | --- |
| Math1 list, no year | 200; only 2018-2025 | 200; all published years | API test |
| Math1 2018/2025 list or detail | 200 | 200 | API test |
| Math1 2017/2026 list or detail | 401 | 200 | API test |
| Math2 list/detail | 401 | 200 | API test |
| Math3 list/detail | 401 | 200 | API test |

All content responses remain `private, no-store` and vary on Cookie. Protected
requests are rejected before question lookup. Anonymous unfiltered Math1 queries use
parameterized minimum and maximum year predicates.

## Static and rendered frontend

- Generated public Math1 artifact: 179 questions, minimum year 2018, maximum year
  2025, 179 unique stable IDs.
- Generated public Math2 artifacts: none.
- Generated public Math3 artifacts: none.
- Production build data files: `math1.json`, `subjects.json` only.
- Anonymous Math2/Math3 cards route to the account screen without requesting content.
- Authenticated subjects load published list pages from the API, then load details on
  demand for one question or one paper.
- Playwright passed at 1440x1000, 1280x900 authenticated, and 390x844 mobile, with no
  console warning/error, page error, blank page, framework overlay, clipping, or broken
  target interaction.

## Promoted data state

The latest successful REQ-018 live verification, immediately before this access-only
change, recorded:

| Subject | Published batches | Published questions |
| --- | ---: | ---: |
| Math1 | 38 | 852 |
| Math2 | 26 | 522 |
| Math3 | 10 | 178 |
| Total | 74 | 1,552 |

It also recorded zero staging batches and zero duplicate stable IDs. REQ-019 contains
no database write operation. A fresh read-only run of the updated verification script
was blocked by sandbox networking, and the approved-network retry was rejected because
the authorization reviewer reached its usage limit.

## Known content risks retained

The REQ-018 audit remains authoritative: 274 publication-blocking anomalies, 661
missing answers, 251 missing explanations, and 95 unknown question types. Math2 2021
and 2022 remain excluded. These risks are not hidden or rewritten by REQ-019.

## Changed files

- Requirement and reports under `docs/requirements/REQ-019-*` and
  `content/reports/req-019-*`.
- API access policy, content-store year bounds, MySQL filters, promoted verification,
  and API tests.
- Web sync, API client, authenticated data loader, app/session behavior, subject cards,
  access wording, Math1-only animation gate, types, and browser/static tests.

## Untouched files and systems

- Original REQ-018 worktree and its uncommitted audit reports.
- Question/provenance source data and the promoted database.
- Read-only `D:\work\Kaoyan-Math2-Papers` content and Git state.
- Git remote, PRs, production API, Cloudflare Pages, and Render deployment.

## Verification summary

- `mingw32-make NPM=npm.cmd typecheck test build`: passed.
- API: 24/24 tests passed.
- Static access test: passed.
- Playwright rendered flows: passed.
- Web and API builds: passed.
- `git diff --check`: passed.
- Full `make verify`: blocked by unrelated fixed inventory count (792 current versus
  775 expected); generated unrelated diffs were removed.
