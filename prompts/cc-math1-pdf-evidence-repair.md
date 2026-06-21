Execute an evidence-backed Math1 {{YEAR}} PDF and image repair.

This task follows a successful structural repair. It must resolve only defects that can be
verified from the supplied source mirror. Do not repeat the legacy structure repair.

Read first:
- `真题内容解析与代理处理规范.md`
- current `content/staging/math1/{{YEAR}}/questions.json`
- current `content/staging/math1/{{YEAR}}/anomalies.json`
- current `content/staging/math1/{{YEAR}}/validation.json`
- `content/review/math1/{{YEAR}}/anomalies-reviewed.json`
- `content/reports/math1-{{YEAR}}/human-review-checklist.md`

Allowed outputs:
- `content/staging/math1/{{YEAR}}/questions.json`
- `content/staging/math1/{{YEAR}}/anomalies.json`
- `content/staging/math1/{{YEAR}}/validation.json`
- `content/staging/math1/{{YEAR}}/summary.md`
- `content/reports/math1-{{YEAR}}/pdf-evidence-repair.md`
- directly relevant `scripts/` and `tests/` only when needed for deterministic verification

Required behavior:
1. Use only the source mirror supplied in the run directory for source evidence.
2. Actually inspect the relevant PDF pages and image files. Record the exact PDF filename,
   one-based page number, image filename, byte size, and SHA-256 used for every correction.
3. Do not claim PDF evidence from Markdown, JSON extraction, or solution reasoning alone.
4. Do not stop because `pdftoppm` is unavailable. This Windows workspace provides:
   - Python: `C:\Users\60549\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe`
   - extractor: `scripts\extract_pdf_page_images.py`
   Run the extractor against the mirrored PDF and write PNGs under
   `{{RUN_DIR}}\pdf-pages\`. Open and visually inspect the generated PNG files.
   Example:
   `C:\Users\60549\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe scripts\extract_pdf_page_images.py --pdf "<mirrored-pdf>" --output-dir "{{RUN_DIR}}\pdf-pages"`
   For Math1 2003, start with `--pages 3,6,9,11`:
   - page 3: Q10 solution and option-label elimination evidence;
   - page 6: Q18 formula;
   - page 9: Q19 method-2 alpha_3 vector;
   - page 11: Q22 substitution and integral.
   If this command fails, diagnose it. Do not substitute Markdown/OCR evidence for visual review.
5. Preserve stable IDs, source tracking, source hashes, source year, source commit, dirty flag,
   and `needs_human_review`.
6. Do not mark any question `approved` or `published`.
7. Apply only corrections directly supported by visual PDF/image evidence. Leave unresolved
   items as anomalies with precise human actions.
8. Update all staging metadata and reports so resolved anomalies are no longer reported as
   unresolved errors.

For Math1 2003, verify and handle these items:
- Q7: verify that
  `papers/images/2003年考研数学(一)真题/341a324b59e43d9ab00862c2b1bb32802af9d1393c521c0602bb888bbeac2b38.jpg`
  exists in the source mirror and matches the graph referenced by the paper. The Markdown
  reference may remain `images/<hash>.jpg`. Remove the false `missing_image` error only after
  opening the image and recording its evidence.
- Q10: inspect the PDF and restore the exact four option texts. The current A/C and B/D pairs
  are near-duplicates and must not be guessed. If the PDF solution page does not reprint the
  options, a deterministic reconstruction is allowed only when all of these agree:
  (a) the visually inspected page explicitly eliminates A and C using the `r < s` example,
  (b) it eliminates B using the `r > s` example and selects D,
  (c) the paper OCR consistently distinguishes the group-II glyph in A/B from the group-I glyph
  in C/D. Under that evidence, restore:
  A `r < s` -> group II must be linearly dependent;
  B `r > s` -> group II must be linearly dependent;
  C `r < s` -> group I must be linearly dependent;
  D `r > s` -> group I must be linearly dependent.
  Record this as triangulated source evidence, not direct option-page transcription.
- Q18: inspect the PDF and restore the exact numerator integral symbol and region in `F(t)`.
- Q4 and Q6: verify the matrix notation and sample-mean symbol before normalizing them.
- Q19 and Q22: inspect the cited suspicious fragments if they are visible in the PDF; correct
  only what the page proves.

Verification required:
- Parse every changed JSON file.
- Confirm `totalQuestions == len(questions)`.
- Confirm stable IDs remain unique and sequential.
- Confirm all questions remain `needs_human_review`.
- Confirm no `approved` or `published` status appears in changed JSON.
- Confirm every referenced 2003 image in the changed questions exists in the source mirror.
- Confirm source mirror and original source repository are unmodified.

Completion rules:
- Use `completed` if every listed 2003 item is resolved with recorded visual evidence.
- Use `completed_with_warnings` only if Q10, Q18, Q19, and Q22 were all visually inspected and
  corrected or conclusively preserved, with only low-priority formatting issues remaining.
- Use `blocked` if any of Q10, Q18, Q19, or Q22 remains unverified after the attempt. This stops
  the combined queue before semantic review.
- Use `blocked` if the PDF or generated PNG pages cannot be opened.
- A run that reports `pdfRendered=false`, `pdfEvidence=not_run`, or no visually inspected page
  numbers must use `blocked`; it must not use a completed status.
- `changedFiles` must be non-empty for a completed status.

Return a concise report listing:
- exact staging files changed;
- each correction with PDF page/image evidence;
- unresolved anomalies;
- verification commands;
- whether a new `ds-math1-year` review is ready.
