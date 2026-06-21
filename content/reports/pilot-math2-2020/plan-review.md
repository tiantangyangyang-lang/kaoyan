# PILOT-CC-M2-2020 Plan Review

## Conclusion

The Math2 2020 conversion may proceed as a candidate-only batch, but it must not treat the
Markdown under `solutions/2020/` as a verified solution source. Its content appears to be a
second transcription of the exam paper and contains no explicit standard answers or detailed
solutions.

## Confirmed Inputs

| Role candidate | Relative path | SHA-256 |
|---|---|---|
| PDF visual evidence | `papers/math2_2020.pdf` | `13d15c42540080692e3c6073376aebcf6911b7bc2ac38dbe833a4eac1986e1f6` |
| MinerU paper Markdown | `papers/MinerU_markdown_math2_2020_2065687152877731840.md` | `12b4c86d1e5ad865f2354e62d1d64ea6d8472f6d07f2cf457127d77d94b7091d` |
| Paper-like Markdown in solutions directory | `solutions/2020/math2_2020/math2_2020.md` | `539e2ecb995ce03ad1c2207c1855321732eec3b7c0211c9011477fcb0cd611e7` |

Source HEAD is `fd42c56eed412cce0cb97d6bd688f314c78e542e`. The MinerU Markdown files are
untracked, so file hashes and dirty status are required provenance.

## Expected Output

- Exactly 23 questions: 8 multiple choice, 6 fill-in-blank, 9 solution.
- Stable IDs `math2-2020-q01` through `math2-2020-q23`.
- Missing answer/explanation fields explicitly marked missing.
- Every question remains `needs_human_review`.
- Source role candidates, hashes, tracking states, and conflict evidence retained.

## Known High-Risk Items

1. Q6 in the Markdown under `solutions/2020/` lacks an explicit D option label.
2. Q22 describes a three-variable quadratic form but contains an apparent four-dimensional
   transformation matrix using `x_4/y_4`.
3. The two Markdown transcriptions use inconsistent punctuation and option-label formats.
4. PDF evidence must not be claimed unless the corresponding pages were actually inspected.
5. No standard answers or detailed solutions have been confirmed in the available Markdown.

## Required Verification

- Question count and stable-ID uniqueness.
- Four explicit options for each multiple-choice question, or a blocking anomaly.
- No fabricated answers or explanations.
- Deterministic output across two separate runs.
- JSON schema and basic LaTeX structure checks.
- Source and project write-boundary checks.
- Actual changed-file list matches `agent-result.json`.

## Execution Status

PlanOnly could not be launched from the Codex environment because its PATH does not expose the
`claude` executable. The user's existing Claude Code CMD session can run the approved command.
