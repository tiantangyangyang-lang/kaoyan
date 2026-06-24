# Math2 Human Spot-Check Checklist

Use this checklist for every future Math2 year/version before import dry-run and
again before any publication requirement.

## Batch Identity

- [ ] Year and subject are confirmed from source title and headings.
- [ ] Source paths match the approved queue entry exactly.
- [ ] Source commit and dirty state are recorded.
- [ ] SHA-256 hashes match the queue or are explicitly reapproved.
- [ ] The source repository is still read-only and unchanged.
- [ ] No PDF is used as primary evidence when usable Markdown exists.
- [ ] Duplicate or alternate versions are listed, not silently merged.

## Question Boundaries

- [ ] Expected year section is complete.
- [ ] Every question number appears exactly once unless an anomaly explains it.
- [ ] Multiple-choice, fill-in-the-blank, and solution/proof sections have correct boundaries.
- [ ] No question stem absorbs the next question.
- [ ] No explanation or answer text is misread as a new question.
- [ ] Historical `1987-2019` split boundaries are reviewed before year conversion.

## Options

- [ ] Every multiple-choice question has A, B, C, and D exactly once.
- [ ] Option objects use `label` and `value` only.
- [ ] `option.text` does not appear.
- [ ] Option values preserve source math and text.
- [ ] Missing, duplicated, or malformed labels are anomalies.

## Answers and Explanations

- [ ] No answer is invented.
- [ ] No explanation is invented.
- [ ] Answers come only from explicit source evidence.
- [ ] Explanation text comes only from explicit source evidence.
- [ ] Missing answer uses `answer: null` and `answerStatus: missing`.
- [ ] Missing explanation uses `explanation: null` and `explanationStatus: missing`.
- [ ] Ambiguous answer/explanation markers stop the batch.

## OCR and Math

- [ ] OCR noise is recorded, including split tokens such as malformed `lim`.
- [ ] Formula meaning is preserved; formulas are not algebraically repaired.
- [ ] Inline math remains `$...$`; display math remains `$$...$$`.
- [ ] KaTeX validation is run and failures are blocking anomalies.
- [ ] Known Math2 2020 Q22-style dimension conflicts are recorded, not repaired.

## Images

- [ ] Every image reference is listed with path, kind, and existence.
- [ ] Relative images resolve locally.
- [ ] Remote images are treated as non-immutable evidence.
- [ ] Image-dependent questions are blocked from publication until visual review.
- [ ] No image content is replaced by invented text.

## Schema and API Safety

- [ ] Every record has all frontend-facing fields even while blocked.
- [ ] `stableId`, `sourceYear`, `subjectCode`, `type`, and `questionNumber` are present.
- [ ] `stem` is non-empty.
- [ ] `options`, `knowledgePoints`, and `anomalies` are arrays.
- [ ] `reviewStatus` is `needs_human_review`.
- [ ] `finalizationStatus` is `blocked`.
- [ ] Partial-field records cannot crash list/detail API shape assumptions.

## Database Safety

- [ ] Dry-run validates all records before insert.
- [ ] Dry-run runs in one transaction.
- [ ] Dry-run rolls back after count verification.
- [ ] Failed insert rolls back the whole year.
- [ ] No half-published DB year exists.
- [ ] No `published` batch is created by preparation work.

## Frontend and Publication Boundary

- [ ] No Math2 generated JSON is copied into `apps/web/public/data`.
- [ ] No frontend static bundle includes Math2 question-bank content.
- [ ] No dynamic explanation or animation feature is added.
- [ ] Public content APIs still read only `published` batches.
- [ ] Staged batch remains unavailable in the UI.

## Final Reviewer Sign-Off

- [ ] Changed files match the queue's allowed write paths.
- [ ] Forbidden paths are unchanged.
- [ ] Validation commands and results are recorded.
- [ ] Unresolved anomalies are listed.
- [ ] Source repository commit and dirty state match the pre-work baseline.
