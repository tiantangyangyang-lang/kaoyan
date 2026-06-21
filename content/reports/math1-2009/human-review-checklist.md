# 数学一 2009 人工审核清单

> 生成方式: `cc-math1-md-finalize-year`
> 运行 ID: `20260620-165621-cc-math1-md-finalize-year-2009`
> 标准化产物: `content/review/math1/2009/questions-reviewed.json`
> 所有题目状态: `needs_human_review`

## 优先级

- P0: 0 项
- P1: 0 项
- P2: 23 项（全卷逐题审核）

## P0（必须先处理）

- 无

## P1（建议本轮处理）

- 无（所有确定性异常已在 md-finalization 中修复）

## P2（可顺手处理）

All 23 questions need human review for:
- 逐题确认题干、选项、答案与解析的数学正确性
- 确认知识点标签
- 确认 LaTeX 格式一致性

## 已修复的历史异常

| 异常 | 修复方式 | 证据 |
|------|---------|------|
| q05 incomplete_options (C, D missing) | 从 paper MD display-math 块提取选项 C/D | Paper MD lines 63-69 明确包含 (C) 和 (D) |
| q20 missing_solution | 从 solution MD 提取解析 | Solution MD lines 379-429; OCR header 修复 |
| q08 section header in option D | 移除 "# 二、填空题..." artifact | Paper MD line 101 的 section break |
| q14 section header in stem | 移除 "# 三、解答题..." artifact | Paper MD line 110 的 section break |
| q19 explanation contains q20 content | 切分恢复 | Solution MD 中 q20 header 未正确识别 |

## 审核要求

- 逐题对照 source-mirror 中的真题 Markdown 和解析 Markdown 确认题干、选项、答案、解析和知识点。
- 所有确定性修复均基于 Markdown 源码证据，记录在 `md-finalization.md`。
- 不需要 PDF 逐页复核（但人工可选择 PDF 作为额外参考）。
