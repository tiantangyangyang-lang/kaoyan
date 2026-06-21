# Math1 2015 Markdown-First Finalization Report

批次: `20260620-172102-cc-math1-md-finalize-year-2015`
任务: `cc-math1-md-finalize-year`
时间: 2026-06-20

## 总览

- 总题数: 23 (8 选择题 + 6 填空题 + 9 解答题)
- 来源: `papers/2015年考研数学(一)真题.md` + `solutions/2015年解析/2015年解析.md`
- 来源 commit: `3151b4acf26ea19ccd427b869a715e65e1990091` (dirty — 其他年份有修改，2015 文件 clean)
- 最终状态: 0 errors, 0 warnings, 6 info

## 逐题分类

### ready_for_approval (无 active anomaly, 14 题)

| ID | 类型 | 答案 | 备注 |
|----|------|------|------|
| math1-2015-q02 | mc | A | 选项完整，答案与解析一致 |
| math1-2015-q03 | mc | B | 级数收敛域，解析严谨 |
| math1-2015-q05 | mc | D | 矩阵方程组，解析严谨 |
| math1-2015-q06 | mc | A | 二次型正交变换，解析严谨 |
| math1-2015-q08 | mc | D | 修复: D 选项节标题已清理 |
| math1-2015-q09 | fib | -1/2 | 极限计算，两种方法验证 |
| math1-2015-q10 | fib | π²/4 | 定积分奇偶性，解析严谨 |
| math1-2015-q11 | fib | -dx | 隐函数全微分，两种方法验证 |
| math1-2015-q12 | fib | 1/4 | 三重积分对称性，解析严谨 |
| math1-2015-q13 | fib | 2^(n+1)-2 | n 阶行列式递推 |
| math1-2015-q14 | fib | 1/2 | 修复: 题干节标题已清理 |
| math1-2015-q15 | sol | (missing) | 等价无穷小，a=-1,b=-1/2,k=-1/3 |
| math1-2015-q16 | sol | (missing) | 微分方程应用，y=8/(4-x) |
| math1-2015-q18 | sol | (missing) | 乘积法则证明，无答案字段需要 |
| math1-2015-q19 | sol | (missing) | 曲线积分，I=(√2/2)π |
| math1-2015-q20 | sol | (missing) | 向量空间基，k=0 |
| math1-2015-q21 | sol | (missing) | 矩阵对角化，a=4,b=5 |
| math1-2015-q23 | sol | (missing) | 参数估计，矩估计 2X̄-1, MLE min{Xi} |

### ready_with_info (仅有 info 异常, 5 题)

| ID | 类型 | Info 类型 | 说明 |
|----|------|-----------|------|
| math1-2015-q01 | mc | missing_figure | f''(x) 图形未在 Markdown 中，需对照 PDF |
| math1-2015-q04 | mc | options_recovered | C/D 从 paper Markdown 恢复，D 无显式标签 |
| math1-2015-q07 | mc | option_a_recovered | A 从 paper Markdown 恢复（\mathrm 格式） |
| math1-2015-q17 | sol | ocr_garbled_latex | 驻点 LaTeX 损坏，g(x,y) 求值可复原 |
| math1-2015-q22 | sol | ocr_number_split | "1 6" = 16, 推导确认 |

### blocked (无法唯一恢复, 0 题)

无。

## 修复详情

1. **Q04 选项恢复**: Paper Markdown 第 39-45 行明确列出 4 个选项。`( C)` 含空格和 `D` 无括号标签导致原始解析器失败。手动提取 4 个选项值。

2. **Q07 选项 A 恢复**: Paper Markdown 第 69 行 `$(\mathrm{A})P(AB)\leqslant P(A)P(B).$` — \mathrm{A} 在数学模式内，解析器未识别为选项标签。手动提取 A 值并去除 \mathrm 包装。

3. **Q08/Q14 节标题清理**: Q08 D 选项值和 Q14 题干分别混入了 `# 二、填空题` 和 `# 三、解答题`。按 paper Markdown 节边界裁剪。

4. **新增 info 标注**: Q01(缺图), Q17(LaTeX 损坏), Q22(数字拆分), source_repo_dirty。

## 建议

- 下一批: Math1 2016 年（如按顺序），或 Math2 2020 年（首次试运行）。
- Q01 和 Q17 在人工审核时建议对照原始 PDF 确认。
- 解答题 answerCandidate 为空属于结构性预期，不构成异常。
