# 数学一 2015 人工审核清单

> 批次: `20260620-172102-cc-math1-md-finalize-year-2015`
> 任务: `cc-math1-md-finalize-year`
> 所有题目状态: `needs_human_review`
> Active errors: 0 | Active warnings: 0 | Info anomalies: 6

## 优先级

- P0: 0 项
- P1: 0 项
- P2: 6 项 (全部为 info)

## P0（必须先处理）

- 无

## P1（建议本轮处理）

- 无

## P2（可顺手处理 / info 级别）

- `math1-2015-q01` [info]: 题干引用 f''(x) 图形但 Markdown 未包含图片。需对照原始 PDF 确认图形与解析推理一致。
- `math1-2015-q04` [info]: 选项 C 和 D 从 paper Markdown 恢复。D 选项在原文无显式标签，需人工确认分配正确。
- `math1-2015-q07` [info]: 选项 A 从 paper Markdown 恢复。原选项用 $(\mathrm{A})$ 格式。需确认 A 选项值无误。
- `math1-2015-q17` [info]: 解析中驻点方程组的 LaTeX 被 OCR 损坏。后续 g(x,y) 求值可复原正确驻点。需对照原始 PDF。
- `math1-2015-q22` [info]: 解析最终结果 "1 6" 是 OCR 对 "16" 的拆分。数学推导确认 E(Y)=16。
- `source_repo_dirty` [info]: 来源库工作区有未提交修改（其他年份文件），2015 文件本身 clean。

## Fixes Applied (本次最终整理)

| Fix | Questions | Method |
|-----|-----------|--------|
| 恢复缺失选项 | Q04 (C,D), Q07 (A) | Paper Markdown 逐行提取 |
| 清理节标题混入 | Q08, Q14 | 按 paper Markdown 节边界裁剪 |
| 新增 info 标注 | Q01, Q17, Q22 | 基于 paper/solution Markdown 对比分析 |

## 审核要求

- 所有异常均为 info 级别，不阻塞内容入库流程。
- 建议人工对照原始 PDF 确认 Q01 图形和 Q17 驻点 LaTeX。
- Q04/Q07 选项恢复基于 paper Markdown 直接文本匹配，置信度高。
- 在未逐页核对 PDF 前，`pdfVerification` 状态保持 `not_run`。
