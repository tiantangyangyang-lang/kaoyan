# Math1 1995 Markdown-Finalization Report

> 批次: `20260620-155019-cc-math1-md-finalize-year-1995`
> 日期: 2026-06-20

## 执行摘要

**结果: completed** — 22题全卷完成 Markdown-first 整理，active error/warning = 0。

## 来源文件

| 文件 | SHA-256 |
|------|---------|
| `papers/1995年考研数学(一)真题.md` | E4276AA33B63E41FBB91CC7A8E10E8085DA6444EC5A1F2738CD6E4DBB2C89A1A |
| `solutions/1995年解析/1995年解析.md` | B1511444A4A60B868B22CD04905E94A901CB73980828CBE455478AEBA35F02E2 |
| Source commit | 3151b4acf26ea19ccd427b869a715e65e1990091 |

## 题目清单

| stableId | 题号 | 题型 | 分类 | 说明 |
|----------|------|------|------|------|
| math1-1995-q01 | 一(1) | fill_in_blank | ready_with_info | 极限计算 |
| math1-1995-q02 | 一(2) | fill_in_blank | ready_with_info | 变限积分求导 |
| math1-1995-q03 | 一(3) | fill_in_blank | ready_with_info | 向量混合积 |
| math1-1995-q04 | 一(4) | fill_in_blank | ready_with_info | 幂级数收敛半径 |
| math1-1995-q05 | 一(5) | fill_in_blank | ready_with_info | 矩阵方程 |
| math1-1995-q06 | 二(1) | multiple_choice | ready_with_info | 空间直线与平面 |
| math1-1995-q07 | 二(2) | multiple_choice | ready_with_info | 导数大小比较 |
| math1-1995-q08 | 二(3) | multiple_choice | ready_with_info | 可导性条件 |
| math1-1995-q09 | 二(4) | multiple_choice | ready_with_info | 级数收敛性 |
| math1-1995-q10 | 二(5) | multiple_choice | ready_with_info | 矩阵初等变换 (stem OCR已修复) |
| math1-1995-q11 | 三(1) | solution | ready_with_info | 复合函数求导 |
| math1-1995-q12 | 三(2) | solution | ready_with_info | 二重积分 |
| math1-1995-q13 | 四(1) | solution | ready_with_info | 曲面积分 |
| math1-1995-q14 | 四(2) | solution | ready_with_info | 余弦级数展开 |
| math1-1995-q15 | 五 | solution | ready_with_info | 微分方程应用题 |
| math1-1995-q16 | 六 | solution | ready_with_info | 曲线积分与路径无关 |
| math1-1995-q17 | 七 | solution | ready_with_info | 证明题 |
| math1-1995-q18 | 八 | solution | ready_with_info | 矩阵特征值 |
| math1-1995-q19 | 九 | solution | ready_with_info | 矩阵行列式 (解析截断已修复) |
| math1-1995-q20 | 十(1) | fill_in_blank | ready_with_info | 二项分布期望 |
| math1-1995-q21 | 十(2) | fill_in_blank | ready_with_info | 概率计算 |
| math1-1995-q22 | 十一 | solution | ready_with_info | 随机变量函数分布 |

## 确定性修复

1. **Q10 stem OCR 修复**: 真题 Markdown 中 B 矩阵和 P1 矩阵 OCR 损坏（B拆分为两段，P1乱码为"0 1 0 1 0 0 1"）。根据解析中"将A第1行加到第3行，再交换1、2行得B"及P1/P2定义确定性恢复。
2. **Q19 解析补全**: 解析提取时遗漏方法一第一行，已从完整解析 Markdown 补回。
3. **解答题答案提取**: Q11-Q22 (除Q17证明题) 从解析最终结果提取 `answerCandidate`。

## 已消除异常

4个原有 warning 均为误报：
- 2x `section_split_mismatch` (三、四): 两节各有2个子题，结构修复已正确拆分
- 2x `missing_solution` (Q12, Q14): 解析合并在前一题容器中，结构修复已拆分

## 验证通过

- [x] Node JSON.parse
- [x] Python json.load
- [x] PowerShell ConvertFrom-Json
- [x] staging/review 题数相等 (22/22)
- [x] stableId 唯一 (22个)
- [x] 所有题目 needs_human_review
- [x] active error = 0, active warning = 0
- [x] candidateResult 不截断
- [x] 所有题目有 explanationCandidate
- [x] 所有题目有 answerCandidate 或标记为 proof

## 下一批建议

可开始 `math1-1996` 或 `math2-1996` 的 Markdown-first 整理。
Q10 的 stem OCR 修复是本卷唯一涉及题干改动的操作，人工审核时建议重点复核该题与原卷的一致性。
