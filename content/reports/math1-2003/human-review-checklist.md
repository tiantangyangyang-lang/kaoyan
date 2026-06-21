# Math1 2003 — 人工复核检查清单

> 生成时间: 2026-06-20
> 生成代理: ds-math1-year (DeepSeek 语义复核)
> 运行 ID: 20260620-084202-ds-math1-year-2003

## 总体状态

- **题目总数**: 22 (6 填空题 + 6 选择题 + 10 解答题/证明题)
- **综合状态**: `needs_human_review`
- **活跃异常**: 0 (13 个历史异常均已解决，包括 Q8 选项 OCR 语义冲突)
- **PDF 证据**: **本代理未运行 PDF；已采用 Codex 视觉复核证据**（2026-06-18，应用于 Q10/Q17/Q18/Q19/Q22）
- **Codex 证据验证**: staging `validation.json` 中 `codexVisualEvidenceApplied == true`，evidence 文件年份 (2003) 与 staging 一致，PDF SHA-256 匹配

---

## P0 — 必须人工对照 PDF 确认 (无法自动验证)

所有题目的答案解析均来自 solutions Markdown，未经过本代理逐题对照 PDF 验证。请逐题完成：

| 题号  | 题型  | 答案/结论候选                                       | 需要确认的内容                                   |
| --- | --- | --------------------------------------------- | ----------------------------------------- |
| Q1  | 填空  | e^{-1/2}                                      | 极限计算结果                                    |
| Q2  | 填空  | 2x+4y-z-5=0                                   | 切平面方程                                     |
| Q3  | 填空  | 1                                             | 傅里叶系数 a_2                                 |
| Q4  | 填空  | \begin{pmatrix} 2 & 3\\ -1 & -2 \end{pmatrix} | 过渡矩阵                                      |
| Q5  | 填空  | 1/4                                           | 概率计算                                      |
| Q6  | 填空  | (39.51, 40.49)                                | 置信区间                                      |
| Q7  | 选择  | (C)                                           | 极值点判定 + 导函数图像（需对照图片）                      |
| Q8  | 选择  | (D): lim(b_n c_n)=+∞                          | 已由解析证明与极限定理确认；真题 MD 的“不存在”为 OCR 错误 |
| Q9  | 选择  | (A)                                           | 多元函数极值判定                                  |
| Q10 | 选择  | (D)                                           | **Codex 视觉已确认** (PDF p.3) — 确认修正与印刷版一致即可  |
| Q11 | 选择  | (B)                                           | 齐次方程组命题判断                                 |
| Q12 | 选择  | (C)                                           | t 分布到 F 分布变换                              |
| Q13 | 解答  | A=e/2-1, V=π(5e²-12e+3)/6                     | 面积和体积（需对照题图）                              |
| Q14 | 解答  | Σ(-1)^n/(2n+1) = π/4                          | 级数求和                                      |
| Q15 | 证明  | 曲线积分等式 + 下界 2π²                               | 格林公式证明                                    |
| Q16 | 解答  | a√(1+r+r²), a/√(1-r)                          | 物理应用题                                     |
| Q17 | 解答  | y=e^x-e^{-x}-½sin x                           | **Codex 视觉已确认** (PDF p.6) — 确认修正与印刷版一致即可  |
| Q18 | 解答  | F(t) 单调增, F(t)>(2/π)G(t)                      | **Codex 视觉已确认** (PDF p.6) — 确认修正与印刷版一致即可  |
| Q19 | 解答  | 特征值 3,9,9                                     | **Codex 视觉已确认** (PDF p.9) — 确认修正与印刷版一致即可  |
| Q20 | 证明  | a+b+c=0 充要条件                                  | 行列式论证                                     |
| Q21 | 解答  | E(X)=3/2, P(B)=1/4                            | 概率计算                                      |
| Q22 | 解答  | hat_θ 有偏 (E=θ+1/(2n))                         | **Codex 视觉已确认** (PDF p.11) — 确认修正与印刷版一致即可 |

---

## P1 — 建议关注项 (非阻塞)

1. **Q4 答案行格式遗留**: explanationCandidate 的答案行仍保留 `\binom{2}{-1}\binom{3}{-2}` (OCR 原文)，而 answerCandidate 已规范化为 pmatrix。解法推导中已正确使用 pmatrix。建议人工清理 explanationCandidate 中的答案行格式。

2. **Q9 括号风格不一致**: answerCandidate 使用全角 `（A）.`，与其他选择题的半角 `(D).` 不一致。explanationCandidate 中也使用全角 `（9）【答案】 （A）.`。前序 repair 已将 stem 选项统一为半角，answerCandidate 中全角括号为 OCR 残留。

3. **Q7/Q13 图片确认**: Q7 依赖导函数图像 (341a324b...jpg)，Q13 依赖几何图形 (e72fc6fde46f...jpg)。两图均已确认存在于 source-mirror。人工复核时请确认图片与题干描述匹配。

---

## P2 — 低优先级观察

1. **LaTeX 间距不一致** (如 `\mathrm {e}` vs `\mathrm{e}`) — 纯排版，KaTeX 均能正确渲染，不影响内容
2. **Q22 F(x) 推导中积分变量与自变量同名** — 已知 Codex 边界说明，印刷版原风格，非错误
3. **Q15 LaTeX 中间距风格** — 纯排版偏好，不上升为 anomaly

---

## Codex 视觉复核证据状态

| 题号 | 修正内容 | Codex 证据页码 | 本次状态 |
|------|---------|---------------|---------|
| Q10 | stem/options 替换 (A/B 对 II 组, C/D 对 I 组) | PDF p.3 | verified_by_codex_visual_review |
| Q17 | explanationCandidate 补齐截断的方法点评 (反函数导数恒等式) | PDF p.6 | verified_by_codex_visual_review |
| Q18 | stem F(t) 分子 \iint → \iiint | PDF p.6 | verified_by_codex_visual_review |
| Q19 | explanationCandidate α₃ \binom{1}{1} → 3 维列向量 + 补齐方法点评结论 | PDF p.9 | verified_by_codex_visual_review |
| Q22 | explanationCandidate 畸变换元步骤修正 | PDF p.11 | verified_by_codex_visual_review |

以上 5 题（6 项修正）已由 Codex 视觉人工复核确认（2026-06-18），本代理接受其证据。人工审核者应确认修正后的文本与印刷版一致，无需再次从 PDF 第 3/6/9/11 页逐字核对。

---

## 复核后操作

1. 来源 Markdown 与现有 Codex 视觉证据的内容审核已经完成
2. 由批准人决定是否将 22 题的 `reviewStatus` 更新为 `approved`
3. 将确认后的审核人、审核时间和来源 commit 记录到各题目
4. 确认内容使用授权状态（数学一仓库 CC BY-NC-SA 4.0）
