# Motion sample review

## Recommended three-sample set

These three cover different visual reasoning patterns and are sufficient to decide
whether the current style should be frozen for batch generation.

| Stable ID | Visual pattern | What to judge |
| --- | --- | --- |
| `math1-2023-q01` | Curve approaching an oblique asymptote | Whether the three steps make slope and intercept intuitive |
| `math1-2025-q04` | Integral region and order conversion | Whether the animation prevents choosing the wrong middle region |
| `math1-2023-q22` | Radial probability density | Whether reducing a two-dimensional density to `Z=r²` is visually clear |

## How to inspect

1. Open `https://gongren.xyz` and log in.
2. Enter **真题库 → 数学一**.
3. Search the stable ID shown above.
4. Open the question and expand **查看答案解析**.
5. Play all three animation steps.

Animation payloads are login-only. The public endpoint reveals only whether an animation
exists.

## Review rubric

For each sample, record one of `通过`, `需修改`, or `不适合批量化` and comment on:

- mathematical correctness;
- whether the visual adds value beyond the text explanation;
- whether each step is short and understandable;
- whether the pace, color, and emphasis are comfortable;
- whether the same template can safely be reused for similar questions.

## Approval gate

DeepSeek batch generation starts only after the maintainer explicitly approves the style
or provides concrete revisions. No external-model request has been made in this phase.

## Earlier feedback recorded on 2026-08-09

| Stable ID | Decision | Reason |
| --- | --- | --- |
| `math1-2025-q04` | `需修改` | Public/canonical options C and D are OCR-damaged placeholders, so this question cannot be approved as a batch baseline yet. |

The user-provided source image recovers the displayed options as:

- C: `$\int_0^4\left[\int_{-2}^{-\sqrt{4-y}} f(x,y)\,dx+\int_2^{\sqrt{4-y}} f(x,y)\,dx\right]dy$`
- D: `$2\int_0^4dy\int_{\sqrt{4-y}}^2 f(x,y)\,dx$`

These formulas were recorded as review evidence. REQ-022 and REQ-023 subsequently
corrected Q04's options and explanation on main, so that earlier content blocker no
longer applies to the redesigned sample.

## Redesigned samples ready for review on 2026-08-11

| Stable ID | New three-step visual progression | Local result |
| --- | --- | --- |
| `math1-2023-q01` | `y/x -> 1` direction, `y-x -> 1/e` offset, answer B | All three states rendered and switched correctly |
| `math1-2025-q04` | Vertical source slices, disjoint horizontal slice, two labeled intervals and answer A | Excluded middle and two valid intervals rendered clearly |
| `math1-2023-q22` | Radial density, cumulative disk with `F_Z(z)=z^2`, triangular graph `f_Z(z)=2z` | Disk-to-one-dimensional-density transition rendered correctly |

At this review checkpoint, the local browser preview used an authenticated test response
and did not contact the production database. The later authorized release and production
replacement steps are tracked separately in `task_plan.md`.
