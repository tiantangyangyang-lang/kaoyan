# Math1 1990 — Conflicts and Uncertainties (Markdown-First Finalization)

> 运行: `20260620-152910-cc-math1-md-finalize-year-1990`
> 生成时间: 2026-06-20

## 已解决异常（8 项）

所有 8 个之前报告的 `missing_solution` 和 `section_split_mismatch` 异常已通过确定性结构拆分解决：

1. **section_split_mismatch**: 解析 Markdown 中 Section 二（选择题 5 小题）和 Section 三（解答题 3 小题）的解答被 OCR 合并为一个段落。Solution markers `(1)【答案】`~`(5)【答案】`和 `(1)【解】`~`(3)【解】` 明确嵌在合并块中，通过确定性拆分恢复。
2. **Q7-Q13 missing_solution**: 均为上述合并块的子问题。拆分后每题均有完整的 answer 和/或 explanation。

## 当前活跃异常

**无**。All 23 questions have:
- Verified paper stem from source paper Markdown
- Verified answer/explanation from source solution Markdown
- Consistent question numbering (1-23)
- 5 multiple-choice all have A-D options and answer

## 不确定项

### 解答题 answerCandidate 为空（10 题，非错误）
q11-q19 和 q23 为解答题/证明题，answerCandidate 为 null 符合 transform 规范（解答题的解释即为答案）。人工审核时可决定是否从 explanation 中提取简短 answerCandidate。

### 图片引用（2 题）
- q19: `images/b389597...630d2.jpg` — 九题图，半圆路径示意图
- q23: `images/ae201c81...73b5.jpg` — 十二题图，区域 D 示意图
两个图片文件在 source-mirror 中均存在。

### OCR 格式瑕疵（仅 cosmetic，不影响内容）
- Section 二 (2) 的题号在 paper MD 中使用半角 `(2)` 而非全角 `（2）`
- Solution MD 中部分 `【解】` 前空格不统一
这些不影响题干和答案的确定性。

## 限制

- 未逐页核对 PDF 页面。
- 未新增数学正确性判断（答案来自 solution markdown 原文）。
- 未自动标注知识点标签。
- 所有题目仍需人工确认后进入 approved 状态。
