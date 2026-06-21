# 数学一 2010 人工审核清单

> 生成方式: `cc-math1-md-finalize-year (Markdown-first)`
> 标准化产物: `content/review/math1/2010/questions-reviewed.json`
> 所有题目状态: `needs_human_review`

## 优先级

- P0: 0 项
- P1: 0 项
- P2: 0 项

## P0（必须先处理）

- 无

## P1（建议本轮处理）

- 无

## P2（可顺手处理）

- 无

## 已应用的确定性修复（17 项）

所有修复均基于真题 Markdown 或解析 Markdown 中的直接证据，无需 PDF 确认：

1. Q06 选项拆分：恢复 4 个独立选项 A/B/C/D（原合并为 A/B 两项）
2. Q08 选项 D 清理：移除泄露的节标题
3. Q14 题干清理：移除泄露的节标题
4. Q08 解析清理：移除末尾节标题
5. Q14 解析清理：移除末尾节标题
6. Q05 答案括号规范化：全角 → 半角
7. Q08 答案括号规范化：全角 → 半角
8. Q18 解析 OCR 修复："一1" → "-1"
9-17. Q15-Q23 答案提取：从解析中提取简短答案候选

## 审核要求

- 本次由 Markdown-first 流程完成，所有修复均来源于 paper/solution Markdown 的直接证据。
- 0 个 active anomaly，23 题均分类为 `ready_for_approval`。
- 人工审核重点：逐题确认题干、选项、答案候选的数学正确性，标注知识点，以及内容使用授权。
- 在未逐页核对 PDF 前，保持 `pdfEvidence.status = not_run`。
