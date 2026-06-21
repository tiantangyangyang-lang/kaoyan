Recover Math1 {{YEAR}} staging JSON integrity, apply all Codex visual evidence, and verify it
with real parsers.

This is a text-only deterministic recovery task. The current
`content/staging/math1/{{YEAR}}/questions.json` may be invalid JSON because a prior agent wrote
single LaTeX backslashes into the Q17 JSON string. Do not trust prior “JSON passed” reports.

Read:
- `content/reports/math1-{{YEAR}}/codex-visual-evidence.json`
- `content/review/math1/{{YEAR}}/questions-reviewed.json`
- raw `content/staging/math1/{{YEAR}}/questions.json`
- staging `anomalies.json`, `validation.json`, `summary.md`

Allowed outputs:
- `content/staging/math1/{{YEAR}}/questions.json`
- `content/staging/math1/{{YEAR}}/anomalies.json`
- `content/staging/math1/{{YEAR}}/validation.json`
- `content/staging/math1/{{YEAR}}/summary.md`
- `content/reports/math1-{{YEAR}}/visual-evidence-application.md`
- directly relevant recovery scripts/tests

Required recovery:
0. The user already authorized this `acceptEdits` task. Do not ask for additional approval. If `content/reports/math1-2003/recover_and_verify_v3.js` exists, fix these known defects before running it: (a) append corrections must be idempotent because Q17 already exists in the review recovery source; (b) use `execFileSync` or equivalent argument arrays for Python instead of nested shell quoting; (c) add a real PowerShell `ConvertFrom-Json` check; (d) hard-fail when any structural or evidence check is false. Then execute `node content/reports/math1-2003/recover_and_verify_v3.js` immediately.
1. First prove whether staging `questions.json` parses. For Math1 2003 it is expected to fail
   near Q17 because sequences such as `\neq`, `\frac`, and `\mathrm` were not JSON-escaped.
2. Recover Q17 from the valid
   `content/review/math1/2003/questions-reviewed.json` candidateResult. Use a structured JSON
   serializer (`json.dump`, `JSON.stringify`, or `ConvertTo-Json`) when writing. Do not perform
   manual backslash concatenation.
3. Parse the recovered staging file before applying further evidence.
4. Apply every correction currently listed in `codex-visual-evidence.json`. Existing corrections
   must be idempotent. Append the new Q19 method-review continuation exactly once.
5. Keep all 22 stable IDs, source fields, and `needs_human_review`. Do not create approved or
   published content.
6. Update anomalies, validation, summary, and visual-evidence application report. There must be
   zero active content anomalies after all six evidence corrections are applied.

Mandatory real verification commands:
- Node: `node -e "JSON.parse(require('fs').readFileSync('content/staging/math1/2003/questions.json','utf8')); console.log('node-json-ok')"`
- Bundled Python or available Python: parse the same file with `json.load`.
- PowerShell: `Get-Content -Raw -Encoding utf8 ... | ConvertFrom-Json`.
- Verify Q17 contains both inverse-function identities.
- Verify Q19 contains both method-review conclusions and no longer ends at
  `主要有如下结论：`.
- Verify totalQuestions=22, IDs unique/sequential, all needs_human_review, and zero prohibited
  statuses.

The exact commands and their successful outputs must be recorded in `commandsRun` and checks.
`commandsRun=["(none)"]` is forbidden for this task.

Use `completed` only when all three independent JSON parsers and all evidence checks pass.
Otherwise use `failed`.
