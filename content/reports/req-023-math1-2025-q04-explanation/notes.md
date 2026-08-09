# REQ-023 Notes

## Confirmed findings

- Production Q04 explanation status: `candidate_from_solutions`.
- Production explanation length before correction: 2595 characters.
- It contains an unresolved `![](images/...)` reference and 35 OCR-rendered `f ~ o ~ r` tokens.
- The same damaged text exists in review, canonical, and generated public JSON.
- `MathContent` renders paragraphs and LaTeX only; it does not parse Markdown images.
- The existing REQ-022 correction is hard-coded from v1 to v2 and updates only `stem`, `options_json`, and `anomalies`.
- The final change-of-order integral and answer A are mathematically consistent with the region.

## Intended correction

Express the region directly, derive the two valid x-intervals for fixed y, show the resulting iterated integral, and conclude A without depending on an unpublished image.
