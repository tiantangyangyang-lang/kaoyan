# Math2 2021-2022 Staging Readiness Audit

- Requirement: `docs/requirements/REQ-011-math2-2021-2022-staging-readiness.md`
- Scope: read-only source audit; no staging, frontend publication, or DB import.
- Source commit: `fd42c56eed412cce0cb97d6bd688f314c78e542e`
- Source dirty: `true`

## Findings

### 2021

- Status: `blocked_wrong_subject`
- Staging ready: `false`
- Decision: do_not_stage_until_true_math2_source_is_supplied_or_approved

| Role | Path | Subject | Hash OK | Boundaries | Choice Options | Answers | Explanations |
|---|---|---|---|---|---|---:|---:|
| paper_candidate | `papers/MinerU_markdown_math2_2021_2065687851346780160.md` | math3 | true | 1-22 | incomplete | 16 | 23 |
| solutions_candidate | `solutions/2021/math2_2021/math2_2021.md` | math3 | true | 1-22 | incomplete | 16 | 22 |

Blockers:

- `subject_identity_mismatch`: Expected Math2 source evidence, but candidate title evidence detects math3.

Next actions:

- Maintainer must supply or approve a true Math2 2021 source before staging.
- Do not reuse Math3 answers/explanations as Math2 evidence.

### 2022

- Status: `blocked_source_role_decision_required`
- Staging ready: `false`
- Decision: do_not_stage_in_req_011; create a focused 2022 source-role or repair requirement before generating blocked staging

| Role | Path | Subject | Hash OK | Boundaries | Choice Options | Answers | Explanations |
|---|---|---|---|---|---|---:|---:|
| paper_candidate | `papers/MinerU_markdown_math2_2022_2065687890395758592.md` | math2 | true | missing [2, 7] | incomplete | 16 | 20 |
| solutions_candidate | `solutions/2022/math2_2022/math2_2022.md` | math2 | true | missing [10] | incomplete | 16 | 19 |

Blockers:

- `paper_candidate_not_mechanically_stageable`: The 2022 paper candidate is not mechanically stageable: missing question boundaries [2, 7]; incomplete choice options for Q[2, 4, 5, 7, 10].
- `solutions_candidate_not_mechanically_stageable_without_repair`: The 2022 solutions candidate is not mechanically stageable as-is: missing question boundaries [10]; incomplete choice options for Q[5, 7, 10].
- `solutions_candidate_requires_source_role_decision`: The 2022 solutions candidate includes explicit answer/explanation markers. Using it as primary question evidence or answer evidence requires a separate source-role decision and cannot be done silently in this audit task.

Next actions:

- Choose whether 2022 may use either candidate as primary or comparison evidence.
- Repair or explicitly account for missing Q2/Q7 paper boundaries and missing Q10 solutions boundary.
- If approved, generate blocked staging in a separate 2022-only PR.
- Do not invent missing boundaries, options, answers, explanations, or formulas.

## Roadmap

- REQ-011 stops at audit artifacts for 2021/2022.
- 2021 needs a true Math2 source before any staging work.
- 2022 needs a separate source-role/repair PR before staging.
- 1987-2019 remains a later aggregate split and historical subject-title review task.
