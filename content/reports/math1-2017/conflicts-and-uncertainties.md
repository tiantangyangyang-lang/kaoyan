# Math1 2017 — MD-Finalization Conflicts and Uncertainties

本报告由 MD-finalization 运行生成。已基于真题 Markdown 和解析 Markdown 完成确定性修复。

## 已解决的异常

- **q04 `incomplete_options`**: 已解决。选项 D `$t_{0} > 25$` 在真题 Markdown 中以 `$(\mathrm{D})t_{0} > 25$` 形式存在，因 D 嵌入 LaTeX 导致原切分器漏检。现已拆分为独立选项。

## 新记录的信息项 (info)

- **q08 `section_header_artifact_removed`**: 题干、选项 D 和解析末尾包含 `# 二、填空题(...)` 章节标题。已确认这是相邻章节的 OCR 残余，非题目内容。已移除。
- **q14 `section_header_artifact_removed`**: 题干和解析末尾包含 `# 三、解答题(...)` 章节标题。同上处理，已移除。

## 未解决问题

- 无 active error 或 warning。
- 2 个 info 级别记录项，不影响内容正确性。

## 限制

- 未读取 PDF 页面。
- 未新增数学正确性判断。
- 未自动修复任何公式内容。
- 解答题 (q15-q23) 的 `answerCandidate` 为空属于结构性预期。
