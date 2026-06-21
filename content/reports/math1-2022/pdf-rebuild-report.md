# Math1 2022 PDF Rebuild Report

## Result

- Output: `content/review/math1/2022/questions-pdf-rebuilt.json`
- Structured source: `solutions/2022年解析/content_list_v2.json`
- PDF evidence: `solutions/2022年解析/db938df1-9376-4a28-b484-c7514390ead3_origin.pdf`
- PDF pages represented: 26
- Output SHA-256: `263d524300ded52c01b1abda94142017fb269d280e21ae011879fb9c942ea93e`
- Publication status: all questions remain `needs_human_review`

## Validation

- Questions: 22
- Multiple choice / fill-in / solution: 10 / 6 / 6
- Questions with candidate answers: 22
- Questions with candidate explanations: 22
- Multiple-choice questions with A-D options: 10 / 10
- Automatic anomalies: 0
- Q3-Q5 were recovered from audited content anchors because their explicit numeric starts were
  absent from the structured extraction.

## Deterministic Correction

- The first generated artifact mistook page-number text for the answers to Q2, Q5, Q6, and Q7.
- The rebuild now accepts a question-block answer for a multiple-choice question only when it
  begins with A-D; otherwise it retains the answer from the explicit answer-lookup extraction.
- Confirmed Q1-Q10 answer sequence: B, B, D, A, A, C, C, C, A, D.
- Regression coverage:
  `tests/test_rebuild_math1_2022_from_pdf_structure.py::test_multiple_choice_answers_ignore_page_number_noise`.

## Boundary

- This is a separate PDF-structure rebuild; the OCR-heavy staging and canonical local fallback
  review artifacts were not overwritten.
- Passing structural checks does not approve mathematical correctness or publication.
- The source repository was read only and was not committed or pushed.
