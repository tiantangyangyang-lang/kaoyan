# 数学一 2002 人工审核清单

> md-finalization: `20260620-185410-cc-math1-md-finalize-year-2002`
> 审核状态: 全部 `needs_human_review`
> active error: 0 | active warning: 0 | info: 1

## 优先级

- P0: 0 项
- P1: 2 项（info 级）
- P2: 0 项

## P1 — 建议审核（info 级，不阻塞）

| # | 问题 | 涉及题目 | 修复操作 |
|---|------|---------|---------|
| 1 | **图片视觉确认**：Q9 选项全为图片，选项标签A/B/C/D已从paper正确映射，答案(B)对应8127aa31...图像 | Q9 | 对照 PDF 确认各图片内容与选项标签对应，验证(B)确为三平面交于一直线 |
| 2 | **OCR恢复措辞确认**：Q6 性质①②从solution证据恢复（①连续, ②一阶偏导数连续），数学逻辑唯一确定 | Q6 | 对照 PDF 确认精确原文措辞 |

## 已由 md-finalization 自动修复（无需人工重复操作）

| # | 修复项 | 状态 |
|---|--------|------|
| 1 | Q6 stem 性质①② OCR 损毁 → 已从 solution 证据恢复 | ✅ |
| 2 | Q11-Q20 answerCandidate 缺失 → 已从 explanationCandidate 提取 | ✅ |
| 3 | Q16 stem 换行断裂 → 已合并 LaTeX | ✅ |
| 4 | Q9 选项图片映射错位 → 已在 2026-06-17 修复并验证 | ✅ |
| 5 | Q10 选项切分失败 → 已在 2026-06-17 修复并验证 | ✅ |
| 6 | Q2-Q5/Q7-Q10 嵌入式答案 → 已在 2026-06-17 拆分 | ✅ |
| 7 | Q6 stem JSON 弯引号 → 已在 2026-06-20 md-finalization 修复为 ASCII 双引号 | ✅ |

## 审核完成后

- 逐题确认答案正确性后，可标记 `approved`
- 18/20 题为 ready_for_approval，2/20 题为 ready_with_info
- 全部答案为 Markdown 证据闭合，不依赖 PDF 逐字比对
