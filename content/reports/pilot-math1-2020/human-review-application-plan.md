# Math1 2020 Human Review Application Plan

## Goal

Apply the user's confirmed corrections without modifying source repositories, staging
candidates, or the DeepSeek semantic review artifact.

## Steps

- [x] Record confirmed decisions and define the output boundary.
- [x] Add a deterministic human-review application script and focused tests.
- [x] Generate `questions-human-reviewed.json` and update review reports.
- [x] Validate corrected fields, unresolved status, and source integrity.

## Confirmed Decisions

- Q3: split C and D; add the confirmed D label and expression.
- Q8: normalize `Phi(0,2)` to `Phi(0.2)`.
- Q12: replace the candidate explanation with the user-provided derivation.
- Q23: remove the trailing content accidentally copied from Q22.
- Q22: marker-fusion issue is resolved by the existing split.
- Q4-Q8: numbering format has been normalized by the user.
- Q8/Q14: section headings are valid paper structure, but must be removed when embedded
  inside a single question or explanation.

## Safety Boundary

- Do not modify `D:\work\Kaoyan-Math1-Papers` or `D:\work\Kaoyan-Math2-Papers`.
- Do not modify `content/staging/math1/2020/questions.json`.
- Do not overwrite `content/review/math1/2020/questions-reviewed.json`.
- Keep all questions at `needs_human_review` until the full paper is reviewed.

## Errors Encountered

- An initial PowerShell `git diff` command did not quote the Chinese path containing
  parentheses; it was rerun with quoted path arguments.
- Final verification found user changes in the Math1 source repository. They were inspected
  and preserved without modification or rollback.

## Status

Complete with warnings. The corrected artifact is ready for continued human review. The
Math1 source repository is not owned by the user, so no commit or push was created. A dirty
working-tree source snapshot was recorded for future extraction.
