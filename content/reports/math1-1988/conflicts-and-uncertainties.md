# Math1 1988 — Conflicts and Uncertainties (MD-First Finalization)

生成方式: `cc-math1-md-finalize-year`
运行 ID: `20260620-151606-cc-math1-md-finalize-year-1988`

## 已解决的冲突

### 1. Q1-Q3 解答块合并 (section_split_mismatch) — 已解决
- **原始问题**: 解析 Markdown 中一、的 3 个子问题解答被合并为一个文本块，旧版切分器无法正确拆分。
- **解决方式**: 按解析 Markdown 中的 `(1)【解】`, `(2)【解】`, `（3）【解】` 标记拆分，每个子问题获得独立 explanationCandidate。
- **证据**: `solutions/1988年解析/1988年解析.md` 第 5-21 行明确写有三个独立解答。

### 2. Q16, Q17, Q18, Q22 解答截断 — 已解决
- **原始问题**: 旧版提取器丢失了解答的首行内容：
  - Q16: 缺少 `P^{-1}` 和 `A = PBP^{-1}` 计算行
  - Q17: 缺少 `trA = trB` 迹等式行
  - Q18: 缺少 `S1(x)` 和 `S2(x)` 定义行
  - Q22: 缺少 `F_Y(y)` 分布函数定义行
- **解决方式**: 从解析 Markdown 原文补全。
- **证据**: 解析 MD 第 145, 151, 171, 223 行。

### 3. OCR 产物修复 — 已解决
- `\iiint_{a}` → `\iiint_{\Omega}`: 解析中积分区域 `a` 是 `Ω` 的 OCR 误识别（Q1, Q3）。
- `\lceil...\rceil` → `[...]`: 解析中 `φ'(x) = f'(x)⌈(x-a)+3(b-x)⌉` 的 ceil 符号是方括号 `[ ]` 的 OCR 误识别（Q18）。

## 活跃的不确定项

无。所有题目内容已由 paper MD + solution MD 闭合。

## 限制

- 未读取 PDF 页面进行视觉比对。
- 未对数学正确性做独立判断（解析内容来自 solution MD，未经人工验证）。
- solution-type 题目的 answerCandidate 保持为 null（按结构修复规范，不从解析中提取简短答案）。
- 所有题目仍为 `needs_human_review`，未标记为 `approved` 或 `published`。
