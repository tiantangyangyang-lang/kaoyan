# Notes: Public recent Math1 access

## Baseline

- Base commit: `75d8d656e0364e91b51f0eac53f2fa3b0930eefc` (merged PR 20).
- Last confirmed REQ-018 database state: Math1 852, Math2 522, Math3 178;
  total 1,552; 74 published batches; zero staging batches; zero duplicate stable IDs.
- No REQ-019 code path updates approval, publication, question, or provenance data.
- The original REQ-018 worktree and its uncommitted reports remain untouched.

## Access policy

| Request state | Math1 2018-2025 | Math1 1987-2017 | Math2 | Math3 |
| --- | --- | --- | --- | --- |
| Anonymous | Allow | Reject | Reject | Reject |
| Authenticated | Allow | Allow | Allow | Allow |

## Implementation findings

- The prior API required authentication for all content list/detail routes.
- The prior web sync copied all 852 Math1 records and generated 67 Math2 plus 178
  Math3 records into anonymously downloadable JSON. Client-side hiding alone would not
  have fixed this bypass.
- The API now resolves sessions optionally, rejects protected requests before database
  reads, and forces anonymous unfiltered Math1 queries to `2018 <= source_year <= 2025`.
- MySQL year filters remain parameterized.
- The public build contains 179 Math1 questions from 2018-2025 and no Math2/Math3
  question-bank artifact.
- Authenticated frontend loading retrieves list pages at 50 records per page with four
  concurrent page requests. It fetches one detail for single-question practice and at
  most four details concurrently when opening a paper.
- Math2 and Math3 cards route anonymous users to the account screen. Logout from a
  protected subject returns the app to public Math1.
- Math animation requests are limited to Math1, matching the API's stable-ID contract.

## Verification evidence

- `npm.cmd run typecheck:api`: passed.
- `npm.cmd run test:api`: 24/24 passed, including 2017/2018/2025/2026 access edges and
  existing Math2/Math3 authentication checks.
- `npm.cmd run test:smoke:ci --workspace @kaoyan/web`: passed.
  - static access test: 179 questions, 2018-2025, unique stable IDs;
  - no `math2.json` or `math3.json`;
  - anonymous Math2 selection redirects to login;
  - simulated authenticated Math2 list/detail renders;
  - desktop, mobile, practice, paper, persistence, and exports passed;
  - no browser console warning/error or page error.
- `mingw32-make NPM=npm.cmd typecheck test build`: passed.
- Web production build `dist/data` contains only `math1.json` and `subjects.json`.
- `git diff --check`: passed.
- Secret-pattern scan of the diff: no match.
- Read-only Math2 source repository before/after: commit
  `fd42c56eed412cce0cb97d6bd688f314c78e542e`; pre-existing untracked files unchanged.
- REQ-002 inventory and Math2 2020 KaTeX files touched by `make verify` were restored to
  byte-equivalent HEAD hashes and have no content diff.

## Limits and blockers

- A fresh live MySQL verification could not run inside the sandbox (`EACCES`). The
  controlled network retry was rejected because the authorization reviewer had reached
  its usage limit. No database write was attempted.
- `make verify` stops at an unrelated source-inventory assertion: the current read-only
  Math2 repository has 792 files while the test fixes the count at 775. Thirteen other
  tests in that invoked Math2 segment passed before the stop.
- Local runtime is Node 24.15.0 while the repository declares Node 20.x; npm emitted an
  engine warning, but all targeted type checks, tests, and builds passed.

## Production cache follow-up

- PR 21 merged as `5e1609bd76998ae8b7404789d3e4920628887598`.
- Render deployed the new API policy successfully: anonymous recent Math1 returned
  200, while Math1 2017, Math2, and Math3 returned 401.
- Cloudflare deployed the new frontend, but deleted `math2.json` and `math3.json`
  remained readable from an existing edge cache with
  `Cache-Control: public, s-maxage=604800`.
- Cloudflare documents that deleted Pages assets can remain in a data center for up
  to one week. Browser policy prevented dashboard cache purging, and no Cloudflare API
  credential was present.
- The controlled fallback keeps the legacy paths as tiny denial artifacts and adds
  exact `_redirects` rules to the authenticated API. This updates the same cache keys,
  contains no protected question data, and makes the normal final response 401.
