# Math1 2003 — 冲突与不确定性汇总

> 运行 ID: 20260620-084202-ds-math1-year-2003
> 生成时间: 2026-06-20
> 生成代理: ds-math1-year (DeepSeek 语义复核)

---

## 1. Paper / Solution 冲突

**冲突总数: 1** (均为 info 级别，不影响答案正确性)

| 题号 | 冲突字段 | 描述 | 严重度 |
|------|---------|------|--------|
| Q4 | explanationCandidate 内答案行 vs answerCandidate | explanationCandidate 中答案行保留 OCR 原文 `\binom{2}{-1}\binom{3}{-2}`（两个分立的 2×1 向量），而 answerCandidate 已规范化为 `\begin{pmatrix} 2 & 3\\ -1 & -2 \end{pmatrix}`（2×2 矩阵）。解法推导中已正确使用 pmatrix 形式。属于排版残余。 | info |

---

## 2. OCR 噪声类型汇总

本次语义复核中未发现新的 OCR 噪声。所有已知 OCR 问题已在前序修复运行中解决：

| 历史 OCR 问题 | 影响题号 | 修复状态 |
|-------------|---------|---------|
| `\frac{-}{x}` → `\overline{X}` | Q6 | 已修复 (pdf-evidence-repair v1) |
| `其 他` → `其他` | Q5 | 已修复 (pdf-evidence-repair v1) |
| `（B）` → `(B)` | Q9 | 已修复 (pdf-evidence-repair v1) |
| `则（` → `则( )` | Q12 | 已修复 (pdf-evidence-repair v1) |
| `\binom{1}{1}` → 3 维向量 | Q19 | 已修复 (Codex 视觉复核, 2026-06-18) |
| OCR 畸变的换元分式 | Q22 | 已修复 (Codex 视觉复核, 2026-06-18) |
| `\iint_{D(t)}` → `\iiint_{\Omega(t)}` | Q18 | 已修复 (Codex 视觉复核, 2026-06-18) |
| Q10 选项 A/B/C/D 标注不唯一 | Q10 | 已修复 (Codex 视觉复核, 2026-06-18) |
| Q17 方法点评截断 | Q17 | 已修复 (Codex 视觉复核, 2026-06-18) |
| Q19 方法点评截断 | Q19 | 已修复 (Codex 视觉复核, 2026-06-18) |

---

## 3. 缺失答案

10 道解答题/证明题 (Q13-Q22) 的 `answerCandidate` 为 `null`，`answerStatus` 为 `"missing"`。

**说明**: 按处理规范第 10 条——解答题/证明题已有完整 `explanationCandidate` 时，`answerCandidate=null` 不自动视为 anomaly。这 10 题均有完整的解析/证明过程。

---

## 4. 图片依赖

| 题号 | 图片路径 | 用途 | 状态 |
|------|---------|------|------|
| Q7 | papers/images/2003年考研数学(一)真题/341a324b...jpg | 选择题配图 (导函数图像) | 已确认存在于 source-mirror |
| Q13 | solutions/2003年解析/images/e72fc6fde46f...jpg | 解答题配图 (平面图形) | 已确认存在于 source-mirror |

两图均为题目必要资产，路径有效，不是 anomaly。

---

## 5. 格式归一化问题

| 问题 | 影响范围 | 说明 |
|------|---------|------|
| `\mathrm {e}` vs `\mathrm{e}` 间距不一致 | Q1, Q15, Q18 等多题 | OCR 来源的 LaTeX 间距变化，KaTeX 均能正确渲染 |
| `\binom` vs `\begin{pmatrix}` | Q4 explanationCandidate | answerCandidate 已规范化，explanationCandidate 解法中已正确使用 pmatrix |
| 全角 `（` `）` vs 半角 `(` `)` | Q9 answerCandidate | 前序 repair 已将 stem 选项统一为半角，answerCandidate 中的全角为 OCR 残留 |

以上均为排版偏好级别，不上升为 anomaly。

---

## 6. 需要人工从 PDF 最终确认的项

**高优先级 (P0)**:
- 全部 22 题的答案/解析内容与原始 PDF 的一致性（Q10/Q17/Q18/Q19/Q22 已有 Codex 视觉复核，人工确认修正文本与印刷版一致即可，无需再次逐字比对）

**中优先级 (P1)**:
- Q4 explanationCandidate 答案行格式残余是否需要清理
- Q9 answerCandidate 全角括号是否需要统一为半角

**低优先级 (P2)**:
- LaTeX 间距风格是否需要在入库前统一规范化
- Q22 积分变量命名风格 (x 作为哑变量) 是否需要调整

---

## 7. Codex 视觉复核证据摘要

| 选项 | 值 |
|------|-----|
| evidence 文件 | content/reports/math1-2003/codex-visual-evidence.json |
| 审核日期 | 2026-06-18 |
| 审核方式 | Codex 人工视觉复核 (直接阅读 PDF) |
| 应用的修正数 | 6 (Q10 stem/options, Q17 explanation, Q18 stem, Q19 explanation ×2, Q22 explanation) |
| affected questions | 5 (Q10, Q17, Q18, Q19, Q22) |
| 验证条件 | evidence 年份 (2003) 与 staging 一致 ✓, PDF SHA-256 匹配 ✓, codexVisualEvidenceApplied=true ✓ |

本代理未运行 PDF 渲染 (pdftoppm 不可用)。Codex 人工视觉复核证据已采纳为可信证据。人工审核者应确认 6 项 Codex 修正与印刷版一致，但无需重复逐字比对 Codex 已确认页码。
