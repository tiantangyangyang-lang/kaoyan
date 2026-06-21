# 数学一 1987 人工审核清单

> 生成方式: `cc-math1-md-finalize-year`
> 标准化产物: `content/review/math1/1987/questions-reviewed.json`
> 所有题目状态: `needs_human_review`
> 生成时间: 2026-06-20

## 全局状态

- **ready_for_approval**: 16 题（无 active error/warning，内容已由 Markdown 证据闭合）
- **ready_with_info**: 4 题（仅有 info 级标注，无阻塞问题）
- **blocked**: 0 题
- **active errors**: 0
- **active warnings**: 0

## 优先级

- **P0**: 0 项
- **P1**: 4 项（info 级标注需要人工确认）
- **P2**: 0 项

## P1（建议本轮确认 — info 级标注）

### Q02 (math1-1987-q02) — `ready_with_info`
- 解析源Markdown结论部分写 $x^{2^x}$，但推导 $y' = 2^x(1+x\ln 2)$ 对应 $x \cdot 2^x$
- 已修正解释中的转录笔误
- **需要人工确认**: 题干 $y = x2^{x}$ 的乘法符号是否需要加 $\cdot$

### Q08 (math1-1987-q08) — `ready_with_info`
- 题干 $y'' + 6y'' + ...$ 第一个 $y''$ 应为 $y'''$（三阶ODE）
- 解析方法二特征方程 $\lambda^3$ 确认无误
- **需要人工确认**: 题干是否保留 OCR 原文还是修正为 $y'''$

### Q10 (math1-1987-q10) — `ready_with_info`
- 题干 "f(x) 为连续数" → 应为 "连续函数"
- **需要人工确认**: 是否修正为 "连续函数"

### Q15 (math1-1987-q15) — `ready_with_info`
- 证明题类型已从 solution 修正为 proof
- **需要人工确认**: 类型标签和 answerStatus 设置是否合适

## 审核要求

- 所有题目 status 仍为 `needs_human_review`
- 本次运行未读取 PDF，所有证据来自真题/解析 Markdown 比对
- 4 个 info 级 anomaly 均非阻塞性问题
- 18/20 题已有 answerCandidate（Q15 证明题无独立答案，Q08 answerCandidate 已提取）
