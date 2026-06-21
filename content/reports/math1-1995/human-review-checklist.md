# 数学一 1995 人工审核清单

> 生成方式: `cc-math1-md-finalize-year`
> 标准化产物: `content/review/math1/1995/questions-reviewed.json`
> 所有题目状态: `needs_human_review`

## 审核状态总览

| 分类 | 题数 | 说明 |
|------|------|------|
| `ready_for_approval` | 0 | 无题目被标记为可直接通过 |
| `ready_with_info` | 22 | 所有题目已闭合，仅有 info 级修复记录 |
| `blocked` | 0 | 无阻塞问题 |
| Active errors/warnings | 0 | 全卷无活跃 error 或 warning |

## 优先级

- **P0**: 0 项（无阻塞项）
- **P1**: 0 项（无建议本轮处理项）
- **P2**: 22 项（全卷 ready_with_info，可整体审核）

## 确定性修复记录（供审核参考）

1. **Q10 (选择题第5题) stem OCR 修复**：真题 Markdown 中 B 矩阵被 OCR 拆分为列向量片段 + 行数组 + 乱码 `0 1 0 1 0 0 1`，P1 矩阵丢失。已根据解析 Markdown 中的解答（将 A 第1行加到第3行，再交换第1行与第2行得 B，P1 为交换矩阵、P2 为行加矩阵）确定性恢复。审核时确认 B 矩阵和 P1 矩阵定义是否与原卷一��。

2. **Q19 (第九题) 解析截断修复**：解析提取时遗漏了方法一的第一行。已从完整解析 Markdown 补回。

3. **Q11-Q22 (解答题) 答案提取**：从完整解析中提取了简短答案候选（Q17 为证明题，标记为 `not_applicable_proof`）。审核时确认提取的答案字段是否正确。

## 已消除的异常

| 异常 | 原严重级别 | 处理 |
|------|-----------|------|
| section_split_mismatch (三) | warning | 误报：第(三)部分含2个子题，结构修复已正确拆分 |
| section_split_mismatch (四) | warning | 误报：第(四)部分含2个子题，结构修复已正确拆分 |
| missing_solution (Q12) | warning | 误报：Q12解析合并在Q11容器中，结构修复已拆分 |
| missing_solution (Q14) | warning | 误报：Q14解析合并在Q13容器中，结构修复已拆分 |

## 审核要求

- 本批次为 Markdown-first 最终整理，所有修复均有 Markdown 来源证据支持。
- 审核时逐题确认：题号、题型、题干、选项、答案、解析及修复记录。
- Q10 stem OCR 修复是本卷唯一涉及题干改动的修复，建议重点复核。
