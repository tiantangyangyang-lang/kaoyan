# Math1 2015 — Markdown-First Finalization: Conflicts and Uncertainties

批次: `20260620-172102-cc-math1-md-finalize-year-2015`
生成时间: 2026-06-20

## 已解决的异常

### Q04: 选项不完整 → 已恢复
- **原状态**: 仅提取到 ['A', 'B']（warning）
- **原因**: `( C)` 包含空格前缀，D 选项在 paper Markdown 中无显式标签
- **解决方案**: 从 paper Markdown 第 39-45 行逐行提取 A/B/C/D 四个选项
- **新状态**: 4 选项完整（info — 记录恢复过程）

### Q07: 选项不完整 → 已恢复
- **原状态**: 仅提取到 ['B', 'C', 'D']（warning）
- **原因**: 选项 A 使用 `$(\mathrm{A})$` 格式（LaTeX 内），解析器误判
- **解决方案**: 从 paper Markdown 第 69 行提取选项 A: `$P(AB)\leqslant P(A)P(B).$`
- **新状态**: 4 选项完整（info — 记录恢复过程）

### Q08/Q14: 节标题污染 → 已清理
- Q08 选项 D 末尾混入 `# 二、填空题...`
- Q14 题干末尾混入 `# 三、解答题...`
- **解决方案**: 按 paper Markdown 的节标题位置裁剪

## 新增 info 级异常

### Q01: 缺失图形引用
- Stem 中 "如右图所示" 指向 f''(x) 图形，但 paper Markdown 未嵌入图片
- 解析 Markdown 的推理基于特定图形（f'' 在 a、b 处为零，0 处不存在，符号变化在 0 和 b 处）
- **影响**: 无法仅从 Markdown 验证解析推理与图形一致

### Q17: OCR 损坏的 LaTeX
- 解析中 Lagrange 乘数法驻点方程组的解集 LaTeX 被 OCR 损坏
- 后续 g(x,y) 求值可复原正确驻点: (1,1), (2,-1), (-1,2), (-1,-1)
- 最大值 3 在 (2,-1) 和 (-1,2) 处取得

### Q22: OCR 数字拆分
- 解析最后一行 `1 6` 实际上是 `16`
- 数学推导确认: E(Y) = 2p²/(1-x)³|_{x=7/8} = 2(1/64)/(1/8)³ = 16

## 未解决问题

无。所有已识别问题均已通过 Markdown 证据修复或标注为 info 级异常。

## 关于 sourceDirty

来源库 Kaoyan-Math1-Papers 在 commit `3151b4a` 处 dirty，但涉及的是其他年份文件的修改（1987, 1988, 2003, 2020, 2024），不影响 2015 年内容完整性。

## 判定

全部 23 题: `ready_for_approval` (14 题无异常) 或 `ready_with_info` (5 题仅有 info 异常，4 题为解答题结构性 missing answer)。
无 `blocked` 题目。
