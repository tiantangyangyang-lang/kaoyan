# 数学一 1996 人工审核清单

> 生成方式: `cc-math1-md-finalize-year`
> 标准化产物: `content/staging/math1/1996/questions.json`, `content/review/math1/1996/questions-reviewed.json`
> 所有题目状态: `needs_human_review`

## 优先级

- P0: 0 项
- P1: 0 项
- P2: 0 项

## 已通过 Markdown 确定性修复解决的问题

| 原异常 | 状态 |
|--------|------|
| `section_split_mismatch` 三 | 已修复 — Q11/Q12 从合并容器中拆分 |
| `section_split_mismatch` 四 | 已修复 — Q13/Q14 从合并容器中拆分 |
| `missing_solution` Q12 | 已修复 — 从 solutions.md 三(2) 填充 |
| `missing_solution` Q14 | 已修复 — 从 solutions.md 四(2) 填充 |
| Q03 LaTeX 边界 OCR 错误 | 已修复 — (C₁,C₂为任意常数) 移出数学模式 |
| 解答题 answerCandidate 为空 | 已修复 — Q11-Q19, Q22 从解析结果填充简答 |

## 审核要求

- 所有题目题干、选项均来自真题 Markdown（已核对）。
- 所有答案、解析均来自解析 Markdown（已拆分配对）。
- 解答题的简短 answerCandidate 仅从解析末尾提取——需人工确认是否符合常见参考答案格式。
- 知识点标签待人工标注。
- 在未逐页核对 PDF 前，数学正确性未经验证。

## 逐题审核建议

| 题号 | 稳定 ID | 题型 | 需确认 |
|------|---------|------|--------|
| 1 | math1-1996-q01 | fill_in_blank | 答案 ln 2 |
| 2 | math1-1996-q02 | fill_in_blank | 平面方程 2x+2y-3z=0 |
| 3 | math1-1996-q03 | fill_in_blank | 通解（已修复 LaTeX 边界） |
| 4 | math1-1996-q04 | fill_in_blank | 方向导数 1/2 |
| 5 | math1-1996-q05 | fill_in_blank | 秩 r(AB)=2 |
| 6 | math1-1996-q06 | multiple_choice | 全微分 a=2 (D) |
| 7 | math1-1996-q07 | multiple_choice | 极值判断 f(0)极小值 (B) |
| 8 | math1-1996-q08 | multiple_choice | 级数绝对收敛 (A) |
| 9 | math1-1996-q09 | multiple_choice | 同阶无穷小 k=3 (C) |
| 10 | math1-1996-q10 | multiple_choice | 行列式值 (D) |
| 11 | math1-1996-q11 | solution | 心形线全长 8a（已补全推导） |
| 12 | math1-1996-q12 | solution | 数列极限=3（已从合并容器拆分） |
| 13 | math1-1996-q13 | solution | 曲面积分 -π/2（已补全推导） |
| 14 | math1-1996-q14 | solution | 偏微分方程 a=3（已从合并容器拆分） |
| 15 | math1-1996-q15 | solution | 级数和 5/8 - 3/4 ln 2 |
| 16 | math1-1996-q16 | solution | f(x)=C₁ ln x + C₂ |
| 17 | math1-1996-q17 | solution | 泰勒公式+不等式证明 |
| 18 | math1-1996-q18 | solution | 矩阵 A²=A ↔ ξᵀξ=1, 不可逆证明 |
| 19 | math1-1996-q19 | solution | c=3, 特征值 (0,4,9), 椭圆柱面 |
| 20 | math1-1996-q20 | fill_in_blank | 贝叶斯 3/7 |
| 21 | math1-1996-q21 | fill_in_blank | E(|ξ-η|)=2/√(2π) |
| 22 | math1-1996-q22 | solution | 联合分布律, E(X)=22/9 |
