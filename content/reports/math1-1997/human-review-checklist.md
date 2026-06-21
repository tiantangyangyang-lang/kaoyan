# 数学一 1997 人工审核清单

> 生成方式: Markdown-first finalization (cc-math1-md-finalize-year)
> 标准化产物: `content/review/math1/1997/questions-reviewed.json`
> 所有题目状态: `needs_human_review`

## 优先级

- P0: 0 项
- P1: 0 项 (所有 14 个旧 warning 已由 Markdown 证据修复)
- P2: 4 项 (info 级别：证明/推导题的 answerCandidate 为空是结构性预期)

## P0（必须先处理）

- 无

## P1（建议本轮处理）

- 无（所有已知问题已修复）

## P2（可顺手处理）

- `math1-1997-q16`: 解答题 answerCandidate 为空（求 φ'(x) 并讨论连续性 → 答案在推导中）
- `math1-1997-q17`: 解答题 answerCandidate 为空（证明题 → 无单一数值答案）
- `math1-1997-q21`: 解答题 answerCandidate 为空（求分布律、分布函数和期望 → 多部分答案）
- `math1-1997-q22`: 解答题 answerCandidate 为空（矩估计+极大似然估计 → 两个公式）

## 已修复的旧异常（14项全部通过Markdown证据闭合）

1. section_split_mismatch (二): 解析中选择题(2)-(5)和大题三(1)-(3)被合并到q06 → 已拆分
2. section_split_mismatch (四): 解析中(2)被合并到q14 → 已拆分到q15
3. section_split_mismatch (七): 解析中(2)被合并到q18 → 已拆分到q19
4. incomplete_options (q07): 选项D文本与C合并 → 已按真题Markdown分离
5. incomplete_options (q09): 选项D文本与C合并 → 已按真题Markdown分离
6-14. missing_solution (q07-q13, q15, q19): 解析文本存在但归属错误 → 已全部重新归属

## 已知 OCR 修复

- q17: 解析原文 `\frac{1}{a}` → 修复为 `\frac{1}{a_n}` （由 AM-GM 不等式 `a_n + 1/a_n >= 2` 唯一确定）

## 审核要求

- 逐题对照原始 Markdown 确认题干、选项、答案、解析和知识点。
- 在未逐页核对 PDF 前，所有题目保持 `needs_human_review`。
- 本题年份所有内容可以从 paper+solution Markdown 完全恢复，无需强制 PDF 复核。
