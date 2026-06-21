# 数学一 2022 人工审核清单

> 生成方式: `cc-math1-2022-md-finalize` (run `20260620-141019`)
> 标准化产物: `content/staging/math1/2022/questions.json` + `content/review/math1/2022/questions-reviewed.json`
> 所有题目状态: `needs_human_review`

## Key Change from Previous Run

Previous run (`20260620-134226`) used PDF-structure rebuild as primary source. This run cross-verified all content directly against solution Markdown (`solutions/2022年解析/2022年解析.md`), which contains complete stems, options, answers, and explanations.

All 22 answers verified against solution MD "答案速查" section — no mismatches found.

## Fixes Applied in This Run

| # | Fix | File(s) Affected |
|---|-----|-----------------|
| 1 | Q4 Option D: added missing opening `$` for LaTeX | staging/questions.json, review/questions-reviewed.json |
| 2 | Q9 Option C: added missing opening `$` for LaTeX | staging/questions.json, review/questions-reviewed.json |
| 3 | Q14 answerCandidate: `"- 1."` → `"-1."` (extra space removed) | staging/questions.json, review/questions-reviewed.json |

## 异常优先级

- P0: 0 项
- P1: 1 项（warning 级别）
- P2: 22 项（info 级别）

## P1（建议本轮处理）


## P2（可顺手处理）

- `math1-2022-q01` ~ `math1-2022-q05`, `math1-2022-q07` ~ `math1-2022-q22`（22题）: 内容已从 solution Markdown 恢复，需人工逐题确认题干、选项、答案和解析的数学正确性。

## 审核要求

- Markdown-first finalization: stems/options/answers/explanations from solution Markdown (`solutions/2022年解析/2022年解析.md`)
- 所有内容数学正确性未经 AI 验证
- 所有答案已与 solution MD "答案速查" section 交叉验证（22/22 匹配）
- 逐题对照原始 PDF 或可信来源确认题干、选项、答案、解析和知识点
- 在未逐页核对 PDF 前，保持 pdfVerification = not_run
- Q6 的 ABx/BAx OCR 冲突已确定性修复
