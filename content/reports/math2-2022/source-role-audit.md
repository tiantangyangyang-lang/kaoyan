# Math2 2022 Source-Role Audit

- Status: `blocked_source_role_decision_required`
- Staging ready: `false`
- Decision: do_not_stage_in_req_011; create a focused 2022 source-role or repair requirement before generating blocked staging

## Source Candidates

| Role | Path | Subject | Hash OK | Boundaries | Choice Options | Answers | Explanations |
|---|---|---|---|---|---|---:|---:|
| paper_candidate | `papers/MinerU_markdown_math2_2022_2065687890395758592.md` | math2 | true | missing [2, 7] | incomplete | 16 | 20 |
| solutions_candidate | `solutions/2022/math2_2022/math2_2022.md` | math2 | true | missing [10] | incomplete | 16 | 19 |

## Blockers

- `paper_candidate_not_mechanically_stageable`: The 2022 paper candidate is not mechanically stageable: missing question boundaries [2, 7]; incomplete choice options for Q[2, 4, 5, 7, 10].
- `solutions_candidate_not_mechanically_stageable_without_repair`: The 2022 solutions candidate is not mechanically stageable as-is: missing question boundaries [10]; incomplete choice options for Q[5, 7, 10].
- `solutions_candidate_requires_source_role_decision`: The 2022 solutions candidate includes explicit answer/explanation markers. Using it as primary question evidence or answer evidence requires a separate source-role decision and cannot be done silently in this audit task.

## Next Actions

- Choose whether 2022 may use either candidate as primary or comparison evidence.
- Repair or explicitly account for missing Q2/Q7 paper boundaries and missing Q10 solutions boundary.
- If approved, generate blocked staging in a separate 2022-only PR.
- Do not invent missing boundaries, options, answers, explanations, or formulas.
