# 数学一 2004 人工审核清单

> 修复来源: `20260620-162448-cc-math1-md-finalize-year-2004`
> 标准化产物: `content/staging/math1/2004/questions.json`, `content/review/math1/2004/questions-reviewed.json`
> 所有题目状态: `needs_human_review`

## Md-Finalization 结果

| 分类 | 题数 | 含义 |
|------|------|------|
| `ready_for_approval` | 19 | Q01-Q04, Q06-Q11, Q13-Q15, Q17-Q18, Q20-Q23 — 无 active error/warning |
| `ready_with_info` | 3 | Q05 (latex style note), Q12 (formatting note), Q16 (OCR spacing note) |
| `blocked` | 1 | Q19 — explanation 有疑似的 OCR 缺失，需 PDF 确认 |

## 已由 Markdown 证据闭合的修复 (12 项)

1. **Q06**: 题干和解析中去除误入的 `# 二、选择题...` 节标题
2. **Q13**: 修复题干缺失的右括号 `则 $x$ 等于（→ 则 $x$ 等于( )`
3. **Q14**: 从 paper Markdown 重建完整 4 个选项 (A/B/C/D)
4. **Q14**: 清除 stem/options/explanation 中误入的 `# 三、解答题...` 节标题
5. **Q15**: answerStatus 从 missing 更新为 candidate_from_solutions (证明题)
6. **Q16**: 从 explanation 提取 answerCandidate: 1.05 km
7. **Q17**: 从 explanation 提取 answerCandidate: -π
8. **Q18**: answerStatus 从 missing 更新为 candidate_from_solutions (证明题)
9. **Q19**: 从 explanation 提取 answerCandidate: min (9,3)=3, max (-9,-3)=-3
10. **Q20**: 从 explanation 提取 answerCandidate: a 取值与通解
11. **Q21**: 从 explanation 提取 answerCandidate: a=-2 可对角化, a=-2/3 不可
12. **Q22**: 从 explanation 提取 answerCandidate: 联合分布与 ρ=√15/15
13. **Q23**: 从 explanation 提取 answerCandidate: 矩估计量与 MLE

## 仍需人工确认 (4 项)

### P1 — warning (需本轮处理)

- **Q19**: Explanation text run-on — solution Markdown line 334 中从 (9,3) 极小值点直接跳到 (-9,-3) 极大值点，没有明确写出极小值 3。**需对照 solution PDF (2f4ebac7-...origin.pdf) 确认**。

### P2 — info (可顺手)

- **Q05**: Solution Markdown 中 `\dot{\mathbf{BA}}^{*}` 疑似 OCR artifact，应为 `\mathbf{B}\mathbf{A}^{*}`。不影响题干/答案。
- **Q16**: Solution 方法二中 `7 0 0` (数字间空格) 是 OCR 噪声，不影响正确性。
- **Q12**: Paper 使用全角括号 `（12）` 而其他题用半角 `(7)`。来源格式差异。

## 审核要求

- 所有题目保持 `needs_human_review`。
- 19 道 `ready_for_approval` 题经人工确认后可进入 approved。
- Q19 必须在人工确认 explanation 完整性后才能移出 blocked。
- 涉及 PDF 的项在未逐页核对前，继续保持 `pdfEvidence.status = not_run`。
