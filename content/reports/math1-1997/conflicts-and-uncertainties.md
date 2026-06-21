# Math1 1997 — Markdown-First Finalization Conflicts and Uncertainties

本报告由 cc-math1-md-finalize-year 任务生成。基于 paper Markdown 与 solution Markdown 的交叉验证。

## 已解决的冲突

### 选择题选项合并（q07, q09）
- **问题**: 选项 D 的 LaTeX 文本与选项 C 在同一行/紧邻，导致解析器只提取到 A/B/C
- **证据**: 真题 Markdown 明确显示 4 个独立选项
- **解决**: 按真题 Markdown 分离选项 D

### 解析文本合并（q06, q14, q18）
- **问题**: 解析 Markdown 中，section 二包含 5 道选择题解析后直接接 section 三解答题解析；section 四、七的 (1)(2) 紧邻
- **证据**: 解析 Markdown 有明确的 (1)(2)(3)(4)(5) 编号和 section headers
- **解决**: 按编号拆分到对应题目

### OCR 错误（q17）
- **问题**: 解析原文 `a_n + \frac{1}{a}` 应为 `a_n + \frac{1}{a_n}`
- **证据**: AM-GM 不等式 `a_n + 1/a_n >= 2` 需要两个相同变量；原文语境明确讨论 `{a_n}` 数列
- **解决**: 修复为 `\frac{1}{a_n}`，记录在 anomalies-reviewed.json

## 当前不确定项

- 无。所有内容均可从 paper + solution Markdown 唯一确定。

## 限制

- 未读取 PDF 页面。
- 未新增数学正确性判断。
- 未自动修复题干含义。
- 题目知识点标签待人工标注。
