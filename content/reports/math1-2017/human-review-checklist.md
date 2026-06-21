# 数学一 2017 人工审核清单

> 生成方式: `cc-math1-md-finalize-year`
> 运行 ID: `20260620-173408-cc-math1-md-finalize-year-2017`
> 标准化产物: `content/review/math1/2017/questions-reviewed.json`
> 所有题目状态: `needs_human_review`

## MD-Finalization 修复摘要

本批次已完成 Markdown-first 确定性修复：

1. **q04**: 选项 D 从选项 C 中分离（OCR 合并错误）。原 anomaly `incomplete_options` 已消除。
2. **q08**: 从题干、选项 D 和解析中移除尾部章节标题 `# 二、填空题(...)`（OCR 残余）。
3. **q14**: 从题干和解析中移除尾部章节标题 `# 三、解答题(...)`（OCR 残余）。

## 优先级

- P0: 0 项
- P1: 0 项
- P2: 2 项

## P0（必须先处理）

- 无

## P1（建议本轮处理）

- 无

## P2（可顺手处理）

- `math1-2017-q08`: section_header_artifact_removed (info) — 确认移除的章节标题确实不是题目内容。
- `math1-2017-q14`: section_header_artifact_removed (info) — 确认移除的章节标题确实不是题目内容。

## 审核要求

- MD-finalization 已处理所有可由真题 Markdown 和解析 Markdown 唯一确定的 OCR/切分/归属错误。
- q01-q03, q05-q07, q09-q13, q15-q23 无 active error/warning，内容已由 Markdown 闭合，归为 `ready_for_approval`。
- q08, q14 仅有 info 级别异常，归为 `ready_with_info`。
- 0 题 blocked。
- 在未逐页核对 PDF 前，保持 `pdfEvidence.status = not_run` 的解释口径。
