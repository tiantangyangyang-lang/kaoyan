# REQ-019: Public Recent Math1 Access

## Problem and user value

The promoted question bank currently requires authentication for every content API,
while the static web bundle can still expose generated subject JSON directly. The
product needs one explicit access policy that permits recent Math1 papers to be used
without an account and keeps all older or other-subject content behind login, without
changing any question, answer, option, formula, explanation, or provenance record.

## In scope

- Allow anonymous access to published Math1 questions from 2018 through 2025,
  inclusive.
- Require a valid login for Math1 questions from 1987 through 2017.
- Require a valid login for every Math2 and Math3 question.
- Apply the same rule to list and detail APIs.
- Ensure an unfiltered anonymous Math1 list returns only 2018-2025 content.
- Remove protected content from anonymously downloadable static web assets.
- Keep the web application hybrid: recent Math1 may remain static, while protected
  content is loaded through authenticated APIs.

## Out of scope

- Editing or revalidating question content or provenance.
- Changing approval, publication, or promotion status.
- Republishing the 1,552 records.
- Making Math2, Math3, or pre-2018 Math1 content public.
- Converting the entire frontend to API-only delivery.

## Acceptance criteria

1. Anonymous Math1 list requests for 2018-2025 return `200` and published content.
2. Anonymous unfiltered Math1 lists contain no year earlier than 2018.
3. Anonymous Math1 list/detail requests for years before 2018 return `401` or an
   equivalent authentication rejection.
4. Anonymous Math2 and Math3 list/detail requests return `401` or equivalent.
5. Authenticated users can list and open all promoted Math1, Math2, and Math3 content.
6. Public static assets contain only Math1 2018-2025 content and contain no protected
   Math1, Math2, or Math3 question records.
7. The frontend does not offer protected content until authentication succeeds and
   then loads it through credentialed API requests.
8. Stable IDs and the promoted counts remain Math1 852, Math2 522, Math3 178, total
   1,552, with no duplicate stable IDs.
9. Existing known-risk audit records remain unchanged.

## Constraints

### Data

- Do not mutate question text, answers, options, formulas, explanations, source
  evidence, stable IDs, approval state, or publication state.
- Treat the promoted database as read-only for this requirement.

### Authentication and security

- Missing or invalid sessions must never reveal protected content.
- API filters must be enforced server-side; client-side hiding is not sufficient.
- Protected question payloads must not be emitted into public build artifacts.
- CORS, cookie, input validation, parameterized SQL, and non-leaking errors remain
  mandatory.

### Performance

- Anonymous recent-Math1 access must not require one detail request per question.
- Authenticated loading may use pagination, but must avoid an unbounded request burst.

### Compatibility

- Preserve current web routes and the existing static recent-Math1 experience.
- Preserve current authenticated API response shapes unless an additive field is
  required.
- Do not require a database schema migration.

## Verification commands

```powershell
mingw32-make NPM=npm.cmd typecheck
mingw32-make NPM=npm.cmd test
mingw32-make NPM=npm.cmd build
mingw32-make NPM=npm.cmd verify
git diff --check
```

Targeted tests must additionally prove the complete anonymous/authenticated access
matrix, inspect generated static JSON for protected records, and exercise the rendered
anonymous and authenticated web flows.
