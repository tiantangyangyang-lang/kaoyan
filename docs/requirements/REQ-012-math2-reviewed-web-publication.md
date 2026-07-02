# REQ-012 Math2 Reviewed Web Publication Marker

## Problem and User Value

The maintainer wants the already-staged Math2 content to become visible on the
website quickly, while making the review state obvious to learners. The first
safe publication slice is limited to Math2 2020, 2023, and 2024 because these
years already have staging artifacts and are known to be question-only.

## Scope

In scope:

- Publish a static web question bank for Math2 2020, 2023, and 2024 only.
- Show visible under-review markers for Math2 questions and papers.
- Show the public feedback email `tiantangyangyang@gmail.com` near Math2
  under-review content.
- Keep all Math2 records with `reviewStatus: needs_human_review` and
  `finalizationStatus: blocked`.
- Generate frontend static assets through the existing web content sync path.

Out of scope:

- 2021, 2022, and 1987-2019 Math2 content.
- Any answer, explanation, option, formula, or source repair that is not already
  present in validated staging files.
- Live database dry-run/import or API data publication.
- Frontend static launch of unreviewed future Math2 years.
- DNS, Cloudflare, Render, or production secret changes.

## Acceptance Criteria

- `apps/web/public/data/math2.json` is generated from
  `content/staging/math2/{2020,2023,2024}/questions.json`.
- The generated Math2 bank contains exactly 67 questions:
  - 2020: 23
  - 2023: 22
  - 2024: 22
- Every Math2 generated question has:
  - `subjectCode: "math2"`;
  - `reviewStatus: "needs_human_review"`;
  - `finalizationStatus: "blocked"`;
  - `answerStatus: "missing"`;
  - `explanationStatus: "missing"`;
  - no invented answer or explanation content.
- `apps/web/public/data/subjects.json` exposes Math2 as selectable with a
  visible review/pending status and a count of 67 questions.
- The web app lets users enter Math2 from the subject selector, question bank,
  and paper list.
- Math2 practice and paper views visibly state that answers/explanations are
  under review and include `tiantangyangyang@gmail.com` as the feedback path.
- Math1 behavior remains available and covered by existing smoke checks.

## Constraints

Data:

- Do not mutate `D:/work/Kaoyan-Math2-Papers`.
- Do not invent answers, explanations, options, or formulas.
- Keep option objects in `{"label","value"}` shape.
- Missing answers and explanations must stay visibly marked as missing or under
  review.

Authentication:

- No authentication behavior changes are required.

Performance:

- Static JSON loading must remain client-side and build-time compatible with the
  existing Cloudflare Pages deployment.

Compatibility:

- Preserve existing Math1 static question bank behavior.
- Preserve the existing API-backed Math2 path for future requirements; this
  requirement publishes only a bounded static preview.

## Verification Commands

Run from the repository root:

```powershell
npm.cmd run sync:content --workspace @kaoyan/web
npm.cmd run typecheck --workspace @kaoyan/web
npm.cmd run build --workspace @kaoyan/web
npm.cmd run test:smoke:ci --workspace @kaoyan/web
mingw32-make NPM=npm.cmd verify
```

Do not run live database dry-run/import commands for this requirement.
