# Math2 2023 Source-Role & OCR Audit

## Audit Scope

Read-only audit of the two 2023 Math2 Markdown sources, performed before any
mechanical staging. Purpose: confirm whether the 2023 batch is mechanically
convertible under the `math2-question-staging-v2` schema using the 2020
reference converter pattern, or whether a non-delegable decision is required.

## Inputs

- Source root: `D:\work\Kaoyan-Math2-Papers` (read-only; commit `fd42c56`)
- Primary paper transcript: `papers/MinerU_markdown_math2_2023_2065687933685170176.md`
  - SHA-256: `eef3ea76c3491b8753230bfc1089493d2b67f1b1a815bc45de6666a70cdcb02f`
  - Matches REQ-003 frozen queue: yes
- Comparison transcript: `solutions/2023/math2_2023/math2_2023.md`
  - SHA-256: `c353e535aa9dcda945bc9d88c3c441f3f4d23060a3408209ac3e90efa202bed8`
  - Matches REQ-003 frozen queue: yes

## Subject Identity

Both files are titled "2023年数学二试题" (2023 Math2 exam). Subject identity is
Math2. 2023 is NOT subject-blocked (contrast with 2021, whose Markdown identifies
the exam as Math3).

## Structure (from explicit section headers)

Both files contain identical structural headers:

- `一、选择题（1~10 小题，每小题 5 分，共 50 分）` — Q1–Q10, multiple choice
- `二、填空题（11~16 小题，每小题 5 分，共 30 分）` — Q11–Q16, fill-in-the-blank
- `三、解答题（17~22 小题，共 70 分）` — Q17–Q22, solution/proof

Total: 22 questions = 10 multiple_choice + 6 fill_in_blank + 6 solution.

This differs from 2020 (8/6/9 = 23). A 2023 converter must use type thresholds
1–10 MC, 11–16 fill, 17–22 solution, transcribed from the source headers (not
inferred). This threshold change is mechanical transcription of explicit source
structure, not interpretation.

## Boundary Detectability

All 22 question boundaries are detectable via the 2020 `QUESTION_MARKER` pattern
`^\s*[（(]\s*(\d{1,2})\s*[）)]\s*`. No duplicate or missing boundaries. The
candidate-boundary detection step is mechanically sound.

## Answer / Explanation Evidence

Neither file contains `【答案】`, `答案:`, `参考答案`, `【解】`, `【解析】`, or
`解答:` markers. Both files are question-only transcriptions. The comparison
file is a second transcription of the questions, NOT an answer key. Answers and
explanations are missing, as expected. No answer-invention pressure exists.

## OCR Corruption in the Primary Paper File (Blocker)

The MinerU paper transcript has severe OCR data loss in the multiple-choice
options. 5 of 10 MC questions have missing or empty options:

| Q | Paper file lines | Defect | Comparison file |
|---|---|---|---|
| Q2 | 15 | Stem present; options A–D entirely absent (next line is Q3 at 17) | Complete A–D (lines 15–23) |
| Q4 | 27–29 | Only `(D) a=0, b<0` present; A–C absent | Complete A–D (lines 35–43) |
| Q6 | 41–49 | `(A)`/`(C)` present; `(B)` (line 45) and `(D)` (line 49) empty | Complete A–D (lines 55–63) |
| Q7 | 51–56 | All four options empty (lines 53–56) | Complete A–D (lines 65–73) |
| Q9 | 84–86 | Stem present; no options (Q10 begins line 86) | Complete A–D (lines 85–93) |

Additional minor OCR noise in the paper file: Q10 followed by stray `5`/`1`
tokens (lines 88, 90); Q8 options rendered as display-math blocks (lines 62–82)
rather than inline, which the 2020 `OPTION_MARKER` would still match but with
multi-line values.

The comparison file has minor noise of its own (e.g., stray `√1+x²` at Q2 line
15, stray `x²`/`3x²+y²dedy` fragments at Q18/Q20), but its MC options are
complete for all 10 questions.

## Schema Impact

`math2-question-staging-v2` (enforced by `scripts/transform_math2_2020.py`
`validate_payload`) requires each multiple-choice question to carry exactly
options A–D with shape `{"label","value"}`; `option.text` is forbidden. The 2020
converter exits non-zero (`SystemExit(3)`) on schema violation.

With the primary paper file as the option source, Q2, Q4, Q6, Q7, Q9 cannot
satisfy the A–D requirement. A schema-valid 2023 staging is therefore impossible
from the primary file alone.

## Non-Delegable Decision Required (Primary Codex)

Producing a valid 2023 staging requires exactly one of:

- **(a) Re-OCR the 2023 paper file** to recover the missing MC options for
  Q2/Q4/Q6/Q7/Q9, then re-freeze hashes and re-queue.
- **(b) Promote the comparison file to primary** for 2023 (it is complete and
  clean), demoting the MinerU paper to comparison. This is a source-role change
  and must be recorded in the queue with updated roles/hashes.
- **(c) Relax the schema/validation gate** to allow incomplete-option MC
  questions, emitting the missing options as `missing_options_ocr` anomalies with
  `reviewStatus: needs_human_review` and `finalizationStatus: blocked`. This is a
  schema/validation-gate change.

Under the REQ-003 Claude Code batch contract, (a) is OCR-recoverability, (b) is
source-role, and (c) is schema/gate — all non-delegable. Claude Code does not
choose among them and does not invent, repair, or silently swap roles.

## Stop Conditions Triggered

- OCR corruption that changes math meaning (missing MC options).
- Option shape drift (empty/absent options for MC questions).
- Schema error (MC questions cannot satisfy the A–D requirement).

## Recommendation

Option (b) appears lowest-cost if the comparison transcript is trusted: it is
complete, clean, and already hashed. But the trust/source-role call belongs to
primary Codex. Once Codex records a decision, a follow-up requirement (REQ-005)
can scope the mechanical 2023 execution against the chosen source.

## Boundary Confirmation

- Source repo `D:\work\Kaoyan-Math2-Papers` unchanged at `fd42c56` (5 untracked
  MinerU files, same as before audit).
- No file under `apps/web`, `apps/api`, `content/final`, `content/approved`,
  `content/review`, or Math1 paths was touched.
- No 2023 staging output, converter, or test was created.
- No live-database command was run.
