# 数学一 1990 人工审核清单

> 生成方式: `cc-math1-md-finalize-year`
> 运行 ID: `20260620-152910-cc-math1-md-finalize-year-1990`
> 所有题目状态: `needs_human_review`

## 优先级

- P0: 0 项
- P1: 0 项（所有之前报告的 missing_solution 异常已通过结构修复解决）
- P2: 10 项（solution 型题目缺少 answerCandidate — 符合规范，非阻塞）

## P0（必须先处理）

- 无

## P1（建议本轮处理）

- 无（之前 8 个 P1 missing_solution 警告均为 OCR 合并块误报，已通过确定性结构拆分解决）

## P2（可顺手处理）

以下 10 道解答题 answerCandidate 为 null（符合 transform 规范，explanationCandidate 包含完整推导和答案）：

- `math1-1990-q11`: 解答题 — answerCandidate null; explanation 含结果 (1/3)ln 2
- `math1-1990-q12`: 解答题 — answerCandidate null; explanation 含完整偏导数推导
- `math1-1990-q13`: 解答题 — answerCandidate null; explanation 含完整通解
- `math1-1990-q14`: 解答题 — answerCandidate null; explanation 含收敛域 (-1,1) 和和函数
- `math1-1990-q15`: 解答题 — answerCandidate null; explanation 含 I=12π
- `math1-1990-q16`: 证明题 — answerCandidate null; explanation 含完整 Lagrange 证明
- `math1-1990-q17`: 解答题 — answerCandidate null; explanation 含矩阵 A 的完整求解
- `math1-1990-q18`: 解答题 — answerCandidate null; explanation 含正交变换和标准形 9y₃²
- `math1-1990-q19`: 解答题 — answerCandidate null; explanation 含 W=2(π-1); 含图片引用
- `math1-1990-q23`: 解答题 — answerCandidate null; explanation 含 D(Z)=2/9; 含图片引用

## 审核要求

- 所有题目已通过 Markdown 证据闭合（真题 Markdown ↔ 解析 Markdown 逐题对应）。
- 13 道 ready_for_approval 题（q01-q10, q20-q22）：仅需对 PDF 抽检确认题干无误即可。
- 10 道 ready_with_info 题（q11-q19, q23）：除抽检外，还需决定是否为解答题补充简短 answerCandidate。
- 图片题（q19, q23）：确认图片引用正确、图片可访问。
- 在未逐页核对 PDF 前，所有题目保持 reviewStatus=needs_human_review。
