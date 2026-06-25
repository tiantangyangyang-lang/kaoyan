# REQ-004: Math2 2023 Paper-Only Staging (Audit-Gated)

## Status

Drafted on branch `codex/math2-2023-audit`. The 2023 mechanical staging batch is
**blocked** pending a primary-Codex decision on OCR recovery / source-role. This
requirement records the audit findings and the decision required; it does not
approve a 2023 staging import.

## Problem and User Value

REQ-003 queued `math2-2023-paper-only-staging` as the first candidate mechanical
batch after the 2020 pilot. Before building the 2023 converter, Claude Code
performed a read-only source audit and found OCR corruption in the primary
(MinerU) paper transcript that blocks a schema-valid mechanical staging. This
requirement captures that finding and the non-delegable decision now required
from primary Codex.

## Source Baseline (read-only)

- Source root: `D:\work\Kaoyan-Math2-Papers`
- Commit: `fd42c56eed412cce0cb97d6bd688f314c78e542e`
- Dirty state: five untracked MinerU Markdown files (unchanged before/after audit)
- Allowed read paths (per REQ-003 queue):
  - `papers/MinerU_markdown_math2_2023_2065687933685170176.md` (primary paper transcript)
  - `solutions/2023/math2_2023/math2_2023.md` (comparison transcript)
- Hash verification: both files match the frozen REQ-003 queue hashes exactly.
  - paper: `eef3ea76c3491b8753230bfc1089493d2b67f1b1a815bc45de6666a70cdcb02f`
  - comparison: `c353e535aa9dcda945bc9d88c3c441f3f4d23060a3408209ac3e90efa202bed8`

## Audit Findings

Subject identity: Math2 (both files titled "2023年数学二试题"). Not subject-blocked.

Structure (from explicit section headers in both files):
- 选择题: Q1–Q10 (10 multiple choice, 5 pts each, 50 pts)
- 填空题: Q11–Q16 (6 fill-in-the-blank, 5 pts each, 30 pts)
- 解答题: Q17–Q22 (6 solution, 70 pts)
- Total: 22 questions. (2020 had 23: 8/6/9. The type thresholds differ.)

Boundaries: all Q1–Q22 markers detectable via the 2020 `QUESTION_MARKER` pattern.

Answers/explanations: no `【答案】`/`【解】` markers in either file. Both files are
question-only transcriptions; the comparison file is NOT an answer key. Answers
and explanations are missing, as expected.

OCR corruption in the primary paper file (MinerU) — missing/empty MC options for
5 of 10 multiple-choice questions:

| Q | Paper file lines | Defect |
|---|---|---|
| Q2 | 15 | options A–D entirely absent |
| Q4 | 27–29 | only option (D) present; A–C absent |
| Q6 | 41–49 | (A)/(C) present; (B)/(D) empty |
| Q7 | 51–56 | all four options empty |
| Q9 | 84–86 | no options present |

The comparison file (`solutions/2023/math2_2023/math2_2023.md`) is complete and
clean for all Q1–Q22, including full A–D options for every MC question. Full
detail in `content/reports/math2-2023/source-role-audit.md`.

## Why Staging Is Blocked

The `math2-question-staging-v2` schema requires multiple-choice questions to
carry exactly options A–D (`{"label","value"}`; `option.text` forbidden). The
2020 reference converter enforces this and exits non-zero on schema violation.
The primary paper file cannot supply complete options for Q2, Q4, Q6, Q7, Q9.
Producing a schema-valid 2023 staging therefore requires one of:

- (a) re-OCR the 2023 paper file to recover the missing options;
- (b) promote the comparison file to the primary transcript for 2023 (it is
  complete and clean), demoting the MinerU paper to comparison; or
- (c) relax the schema/validation gate to allow incomplete-option MC questions,
  recording missing options as anomalies.

Each of (a), (b), (c) is a non-delegable decision under the REQ-003 Claude Code
batch contract: (a) is OCR-recoverability; (b) is source-role; (c) is a
schema/validation-gate change. Claude Code must not make these decisions. The
batch-contract stop conditions ("OCR corruption that changes math meaning",
"option shape drift", "schema error") are triggered. Claude Code stops and
returns this audit.

## In Scope

- Read-only source audit of the two 2023 Markdown files.
- Hash verification against the REQ-003 frozen queue.
- Structural and OCR finding report with exact line references.
- Non-delegable decision statement for primary Codex.

## Out of Scope

- Building `scripts/transform_math2_2023.py` or `tests/test_transform_math2_2023.py`
  before the OCR/source-role decision.
- Producing `content/staging/math2/2023/` outputs before the decision.
- Deciding OCR recoverability, source role, or schema relaxation.
- Running a live-DB dry-run import.
- Publishing, frontend bundle, dynamic explanations, Motion animations, or any
  API/source-repo change.
- Editing `D:\work\Kaoyan-Math2-Papers`.

## Acceptance Criteria

- [x] 2023 source hashes verified against the REQ-003 frozen queue.
- [x] Source repo commit and dirty state recorded before and after; unchanged.
- [x] Subject identity, structure (10/6/6 = 22), boundary detectability, and
      answer/explanation absence recorded.
- [x] OCR corruption documented with exact question numbers and line ranges.
- [x] Non-delegable decision (OCR recovery / source-role / schema) stated for
      primary Codex with the three options.
- [x] No 2023 staging output produced; no converter/test created.
- [x] No frontend/API/final/published/source-repo change.
- [ ] Primary Codex records a decision on (a)/(b)/(c); a follow-up requirement
      will scope the mechanical execution.

## Verification

Documentation-only change. `mingw32-make NPM=npm.cmd verify` run to confirm no
regression. No 2023 converter or staging exists to validate.

## References

- REQ-003: `docs/requirements/REQ-003-math2-full-import-prep.md` (PR #3)
- REQ-003 queue: `content/reports/req-003-math2-full-import-prep/import-queue.md`
- Batch contract: `content/reports/req-003-math2-full-import-prep/claude-code-batch-contract.md`
- Schema: `content/schema/math2-question-staging-v2.schema.json`
- Reference converter: `scripts/transform_math2_2020.py`
- Audit report: `content/reports/math2-2023/source-role-audit.md`
