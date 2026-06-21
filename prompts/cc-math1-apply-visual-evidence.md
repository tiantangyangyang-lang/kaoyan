Apply the already-completed Codex visual review for Math1 {{YEAR}}.

This is a text-only implementation task. The model running this task has no visual capability.
Do not inspect, interpret, or make claims about images or PDF pages. Treat the following file as
the authoritative human/Codex visual-review decision:

- `content/reports/math1-{{YEAR}}/codex-visual-evidence.json`

Read first:
- `content/reports/math1-{{YEAR}}/codex-visual-evidence.json`
- current `content/staging/math1/{{YEAR}}/questions.json`
- current `content/staging/math1/{{YEAR}}/anomalies.json`
- current `content/staging/math1/{{YEAR}}/validation.json`
- current `content/staging/math1/{{YEAR}}/summary.md`

Allowed outputs:
- `content/staging/math1/{{YEAR}}/questions.json`
- `content/staging/math1/{{YEAR}}/anomalies.json`
- `content/staging/math1/{{YEAR}}/validation.json`
- `content/staging/math1/{{YEAR}}/summary.md`
- `content/reports/math1-{{YEAR}}/visual-evidence-application.md`
- directly relevant deterministic scripts/tests if needed

Required behavior:
1. Apply every correction in `codex-visual-evidence.json` exactly.
2. Do not invent or expand corrections beyond that file.
3. Preserve stable IDs, source tracking, source hashes, source year, source commit, dirty flag,
   and `needs_human_review`.
4. Remove or mark resolved the staging anomalies corresponding to Q10, Q18, Q19, and Q22.
5. Update validation and summary metadata to describe the applied visual evidence.
6. Do not mark any question `approved` or `published`.
7. Do not access the original source repository. Use the supplied source mirror only for
   integrity context; no visual interpretation is required.

Verification required:
- Parse every changed JSON file.
- Confirm `totalQuestions == len(questions) == 22`.
- Confirm stable IDs are unique and sequential.
- Confirm all questions remain `needs_human_review`.
- Confirm no `approved` or `published` status appears.
- Confirm Q10 has four distinct options matching the evidence file.
- Confirm Q18 contains `\\iiint_{\\Omega(t)}` in the numerator.
- Confirm Q19 contains the three-entry `alpha_3` vector.
- Confirm Q22 no longer contains `\\frac {2 n (x - \\theta) = t}{\\theta}`.
- Confirm Q17 no longer ends at `有如下两点：` and contains both numbered identities,
  including `-\\frac{f''(x)}{[f'(x)]^3}`.
- Confirm source files remain unmodified.

Use `completed` only when all evidence corrections and checks pass. Otherwise use `failed`.
State whether `ds-math1-year` is ready to run.
