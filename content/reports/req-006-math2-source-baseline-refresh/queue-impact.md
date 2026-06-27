# REQ-006 Queue Impact

## Conclusion

The current source state invalidates the old Math2 queue assumption that the REQ-002 untracked MinerU paper Markdown files are locally available. Future Math2 mechanical batches must remain blocked until a primary agent restores those files, regenerates replacements, or defines a new source contract.

## Existing Queue Artifacts

| Artifact | Current state | REQ-006 decision |
|---|---|---|
| `content/queues/math2-markdown-import-template.json` | Blocked, empty `tasks` list, references the REQ-002 pilot as a template | Keep blocked; add REQ-006 baseline status so no runnable task inherits missing primary paths. |
| `content/staging/math2/2020/questions.json` | Frozen staging candidate; references missing `papers/MinerU_markdown_math2_2020_2065687152877731840.md` | Do not edit in REQ-006; treat as historical output tied to the old dirty source baseline. |
| `content/staging/math2/2020/summary.md` | Names the missing 2020 MinerU primary path | Do not edit in REQ-006; its statement is true for the historical staging artifact but not for current source availability. |
| `content/reports/pilot-math2-2020/plan-review.md` | Records the old untracked 2020 MinerU input | Do not edit in REQ-006; preserve as historical plan evidence. |

## Invalidated Assumptions

- The source repository is no longer dirty.
- The five untracked `papers/MinerU_markdown_math2_*.md` files are no longer present.
- A future queue cannot reuse REQ-002 `primaryRelativePath` values under `papers/MinerU_markdown_math2_*.md` without first restoring or replacing those inputs.
- The 2020 staging file cannot be reproduced from the current clean source checkout alone.

## Still Usable Evidence

- `solutions/2020/math2_2020/math2_2020.md` is still present with SHA-256 `539e2ecb995ce03ad1c2207c1855321732eec3b7c0211c9011477fcb0cd611e7`.
- The current paper PDFs and solution Markdown/origin PDFs are available and hashed in `source-inventory.json`.
- The existing blocked queue template can still define the result contract after its primary source paths are refreshed.

## Claude Code Delegation

Allowed later:

- exact path existence checks;
- SHA-256 and byte-count generation;
- file list diffs from a frozen checklist;
- per-file audit tables where the role labels and acceptance thresholds are already defined.

Forbidden later:

- deciding whether `solutions/*/*.md` is a paper, solution, or canonical source;
- changing a queue from blocked to runnable;
- approving a full import, frontend static bank, dynamic explanations, or Motion work;
- editing `D:\work\Kaoyan-Math2-Papers`.
