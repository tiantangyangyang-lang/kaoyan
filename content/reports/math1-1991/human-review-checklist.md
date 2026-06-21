# 数学一 1991 人工审核清单（Markdown-First 最终整理后）

> 生成方式: `cc-math1-md-finalize-year`
> 最终整理 Run ID: 20260620-140517-cc-math1-md-finalize-year-1991
> 最终整理产物: `content/review/math1/1991/questions-reviewed.json`
> 所有题目状态: `needs_human_review`

## 整体状态
- 22 题全部已完成题干/选项/答案/解析的结构化匹配
- 0 个 active anomaly（全部确定性修复已应用）
- 所有题目内容可仅凭 Markdown 源文件核验
- 不需要 PDF 逐题复核（除非人工审核者需要额外证据）

## 审核优先级

### P0（必须先处理）
- 无

### P1（建议本轮处理）
- 全部 22 题：确认数学正确性（答案、解析逻辑、公式）
- q16, q18：确认证明逻辑完整性

### P2（可顺手处理）
- 知识点标签标注（全部题目目前无知识点标签）

## 确定性修复记录（无需人工再确认）
1. **math1-1991-q09** — Solution Markdown consistently writes \cos x\sin y as a single LaTeX term. The OCR split the LaTeX block by inserting a premature $. Fixed to `\cos x \sin y` within a single LaTeX block.
2. **math1-1991-q14** — Solution concludes: 故所求曲线为 y = sin x. Added answerCandidate.
3. **math1-1991-q15** — Solution concludes: ∑(1/n²) = π²/6. Added answerCandidate.
4. **math1-1991-q17** — Solution provides explicit conditions and expression. Added answerCandidate.
5. **math1-1991-q19** — Solution concludes: 故所求的曲线为 y = (e^(x-1) + e^(1-x))/2. Added answerCandidate.
6. **math1-1991-q22** — Solution concludes with piecewise distribution function. Added answerCandidate.

## 审核要求
- 逐题确认题干与答案匹配
- 选择题确认选项完整且答案属于合法选项
- 解答题确认解析结论与答案一致
- 确认数学逻辑无错误
