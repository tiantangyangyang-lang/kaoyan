# 数学一 2018 人工审核清单

> 最后更新: 2026-06-20 (MD finalization)
> 标准化产物: `content/review/math1/2018/questions-reviewed.json`
> 所有题目状态: `needs_human_review`

## 优先级

- P0: 0 项
- P1: 0 项（Q6 选项拆分已在 MD finalization 中修复）
- P2: 1 项

## P0（必须先处理）

- 无

## P1（建议本轮处理）

- 无

## P2（可顺手处理）

- `math1-2018-q06`: 选项 D 已从 C 中拆分（来源：paper Markdown line 63 `$(\mathrm{D})r(\mathbf{A},\mathbf{B})...`），人工确认拆分。

## 审核要求

- 所有 23 题已通过 Markdown-first 逐题核对：题号、题型、题干、选项、答案均与真题 Markdown 及解析 Markdown 匹配。
- 0 active errors, 0 active warnings, 1 info（Q6 历史解析 artifact，已修复）。
- 所有解答题 (Q15-Q23) 的 answerCandidate 为空属于结构性预期（解答题无需简短答案字段）。
- 无需 PDF 逐页复核（所有内容已由 Markdown 证据闭合）。

## 分类统计

| 分类 | 数量 | 说明 |
|------|------|------|
| `ready_for_approval` | 22 | 无 active error/warning，内容由 Markdown 证据闭合 |
| `ready_with_info` | 1 | Q6 — info 级别的历史 anomaly，选项已修复 |
| `blocked` | 0 | 无无法唯一恢复的问题 |
