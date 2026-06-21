# Math1 2008 — Markdown-First Conflicts and Uncertainties

> 本报告由 cc-math1-md-finalize-year-2008 生成。
> 证据来源：真题 Markdown (`papers/2008年考研数学(一)真题.md`) + 解析 Markdown (`solutions/2008年解析/2008年解析.md`)

## 确定性修复（已记录在 anomalies）

| # | 题目 | 修复 | 证据 |
|---|------|------|------|
| 1 | q08 | 节标题污染从 stem/option D 移除 | Paper MD 结构：q08 后接 "# 二、填空题" |
| 2 | q14 | 节标题污染从 stem 移除 | Paper MD 结构：q14 后接 "# 三、解答题" |
| 3 | q03 | 解析 y″→y‴ (首项) | 解析中推导 λ³-λ²+4λ-4=0 → y‴-y″+4y′-4y=0 |
| 4 | q03 | 选项B y″+y″ → y‴+y″ | 三阶方程（3个任意常数）→需三阶导数项 |
| 5 | q15-q23 | 解答题答案从解析提取 | 解析末尾均明确给出最终结果 |

## 保留未修复

| 题目 | 内容 | 原因 |
|------|------|------|
| q17 | Lagrange 求解过程 OCR 混杂 | 无法唯一恢复精确措辞；结果坐标清晰 |

## 未发现冲突

- Paper Markdown 与 Solution Markdown 在所有题目上答案一致。
- 无题号缺失或重复。
- 无断链图片引用。
- 无错科目标记。

## 限制

- 未读取 PDF 页面（Markdown-first 策略，不要求 PDF）。
- 未新增数学正确性判断（所有答案来自解析 Markdown 的声明）。
- q06 图片引用 `images/a6b0d31b...jpg` 存在于 source-mirror，确认路径有效。
