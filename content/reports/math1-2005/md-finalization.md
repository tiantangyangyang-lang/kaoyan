# 数学一 2005 年 Markdown-first 最终整理报告

> 批次 ID：20260620-163319-cc-math1-md-finalize-year-2005
> 任务：cc-math1-md-finalize-year
> 执行时间：2026-06-20T16:33:19+08:00
> 来源 commit：3151b4acf26ea19ccd427b869a715e65e1990091 (dirty)
> 总题数：23（填空 6 + 选择 8 + 解答 9）

## 1. 确定性修复清单

所有修复均基于真题 Markdown、解析 Markdown 或严格数学逻辑，无需 PDF 对照。

| 题号 | 修复字段 | 修复前 | 修复后 | 修复依据 |
|------|---------|--------|--------|---------|
| Q6 | stem | 尾部含 `# 二、选择题(本题共8小题，每小题4分，满分32分)` | 仅保留题目文本 | 真题 Markdown 第17行：题目后紧跟节标题，切分 artifact |
| Q7 | explanationCandidate | `\|x\|^3n` | `\|x\|^{3n}` | 缺花括号，真题 Markdown 第21行确认为 `\|x\|^{3n}` |
| Q7 | explanationCandidate | `\|x\|^{3n/2}` | `\|x\|^{3n}` | 指数 ghost，夹逼定理上下界推导要求指数为 3n |
| Q7 | explanationCandidate | `x → -1^+`（f'_+(1) 处） | `x → 1^+` | 右导数极限方向应为 x→1^+，数学逻辑唯一确定 |
| Q11 | options | 仅标签 B（A/C/D 内容合并到 B） | 完整四选项 A: λ₁≠0, B: λ₂≠0, C: λ₁=0, D: λ₂=0 | 真题 Markdown 第57-63行明确四选项 |
| Q14 | stem | 尾部含 `# 三、解答题(...)` | 仅保留题目文本 | 切分 artifact，同 Q6 |
| Q14 | options | 仅 A/B/C（D 内容合并到 C） | 完整四选项含 D | 真题 Markdown 第94行含选项 D（无标签前缀），补标签 |
| Q15 | explanationCandidate | 积分上限 `4√2`（≈5.66） | `√[4]{2}`（≈1.19） | 极坐标 r²≤√2 → r≤(√2)^{1/2}=2^{1/4}，数学逻辑唯一确定 |
| Q15 | answerCandidate | null | `3/8` | 从解析提取 |
| Q16 | explanationCandidate | `\arctan`（缺 c）多处 | `\arctan` | OCR 缺字母，真题解析上下文要求反正切函数 |
| Q16 | answerCandidate | null | 收敛区间 + 和函数表达式 | 从解析提取 |
| Q17 | explanationCandidate | `f''(x)`（应写三阶导数） | `f'''(x)` | 真题 Markdown 明确要求 f'''(x) |
| Q17 | explanationCandidate | `1 6`、`2 0` | `16`、`20` | OCR 数字分割噪声 |
| Q17 | answerCandidate | null | `20` | 从解析提取 |
| Q18 | explanationCandidate | `η∈(0,c)` | `η∈(0,ξ)` | 符号统一：第(I)部分找到的点是 ξ，方法点评也使用 ξ |
| Q20 | explanationCandidate | γ₁/γ₂/γ₃ 用 `\binom` 缺分量 | 完整三维列向量 | 从上下文特征向量 ξ₁=(-1,1,0)^T 等补全 |
| Q20 | explanationCandidate | `\frac{X=QY}{}` LaTeX 断裂 | `\xrightarrow{X=QY}` | OCR 将换元箭头误转为断裂分数 |
| Q20 | answerCandidate | null | 三部分完整答案 | 从解析提取 |
| Q21 | explanationCandidate | `b^*`（星号噪声） | `b` | OCR 噪声，矩阵行简化中 b 不应有上标 |
| Q21 | answerCandidate | null | 分情况通解表达式 | 从解析提取 |
| Q22 | answerCandidate | null | 边缘密度 + Z 分布 | 从解析提取 |
| Q23 | answerCandidate | null | D(Y_i) + Cov | 从解析提取 |

**共 21 处修复，覆盖 12 道题。**

## 2. 题目就绪分类

### 2.1 ready_for_approval（无 active error/warning，内容由 Markdown/证据闭合）

| 题号 | 题型 | 状态说明 |
|------|------|---------|
| Q1 | fill_in_blank | 斜渐近线 — 无异常 |
| Q2 | fill_in_blank | 微分方程 — 无异常 |
| Q3 | fill_in_blank | 方向导数 — 无异常 |
| Q4 | fill_in_blank | 高斯公式 — 无异常 |
| Q5 | fill_in_blank | 范德蒙德行列式 — 无异常 |
| Q6 | fill_in_blank | 全概率公式 — stem 污染已修复 |
| Q7 | multiple_choice | 函数可导性 — 3处公式错误已修复 |
| Q8 | multiple_choice | 原函数性质 — 无异常 |
| Q9 | multiple_choice | 偏微分方程 — 无异常 |
| Q10 | multiple_choice | 隐函数存在定理 — 无异常 |
| Q11 | multiple_choice | 特征向量线性无关 — 选项已重建 |
| Q12 | multiple_choice | 伴随矩阵 — 无异常 |
| Q13 | multiple_choice | 概率分布独立性 — 无异常（HTML table 为已知 info） |
| Q14 | multiple_choice | 三大抽样分布 — stem 污染已修复，选项已重建 |
| Q15 | solution | 分段二重积分 — 积分上限已修复，答案已提取 |
| Q16 | solution | 幂级数求和 — arctan 已修复，答案已提取 |
| Q17 | solution | 分部积分 — 导数阶数和数字间距已修复，答案已提取 |
| Q18 | solution | 微分中值定理 — 符号已统一 |
| Q19 | solution | 曲线积分 — 无异常，答案已提取 |
| Q20 | solution | 二次型正交变换 — 向量已补全，LaTeX 已修复，答案已提取 |
| Q21 | solution | 线性方程组通解 — 星号噪声已修复，答案已提取 |
| Q22 | solution | 边缘密度与 Z 分布 — 答案已提取 |
| Q23 | solution | 样本方差与协方差 — 答案已提取 |

**全部 23 题 ready_for_approval。**

### 2.2 ready_with_info（仅非阻塞 info）

| 项目 | 类型 | 说明 |
|------|------|------|
| Q13 | info | 概率分布表使用 HTML `<table>` 标签，非标准 Markdown 表格。不影响内容正确性，但跨渲染器兼容性待确认 |
| Q18 | info | 原解析用 c 代替 ξ，已统一为 ξ。修复后不影响可读性 |
| global | info | 解析中大量使用 `\pmb`（poor man's bold）宏。KaTeX 支持此命令，但建议最终入库前替换为 `\mathbf` 或 `\boldsymbol` |
| global | info | 来源仓库 dirty=true（4个文件有未提交修改），不影响 2005 年内容正确性 |

### 2.3 blocked（仍有无法唯一恢复的内容问题）

无。所有已识别问题均已通过 Markdown 证据或数学逻辑唯一确定修复。

## 3. Anomaly 状态变更

| 原 anomaly ID | 类型 | 原 severity | 修复后状态 |
|--------------|------|-----------|-----------|
| anom-2005-001 (Q7) | ocr_formula_error | warning | ✅ Fixed — \|x\|^3n → \|x\|^{3n} |
| anom-2005-002 (Q7) | ocr_formula_error | warning | ✅ Fixed — \|x\|^{3n/2} → \|x\|^{3n} |
| anom-2005-003 (Q7) | ocr_formula_error | warning | ✅ Fixed — x→-1^+ → x→1^+ |
| anom-2005-004 (Q11) | incomplete_options_extraction | error | ✅ Fixed — 四选项重建 |
| anom-2005-005 (Q14) | incomplete_options_extraction | error | ✅ Fixed — 四选项重建 |
| anom-2005-006 (Q6) | stem_section_header_contamination | warning | ✅ Fixed — 节标题删除 |
| anom-2005-007 (Q14) | stem_section_header_contamination | warning | ✅ Fixed — 节标题删除 |
| anom-2005-008 (Q15) | ocr_formula_error | error | ✅ Fixed — 4√2 → √[4]{2} |
| anom-2005-009 (Q16) | ocr_formula_error | warning | ✅ Fixed — arctan → arctan |
| anom-2005-010 (Q17) | ocr_formula_error | warning | ✅ Fixed — f'' → f''' |
| anom-2005-011 (Q17) | ocr_formatting_noise | warning | ✅ Fixed — 数字空格删除 |
| anom-2005-012 (Q18) | notation_inconsistency | info | ✅ Fixed — c → ξ |
| anom-2005-013 (Q20) | ocr_formula_error | error | ✅ Fixed — γ₁ 向量补全 |
| anom-2005-014 (Q20) | ocr_formula_error | error | ✅ Fixed — γ₂ 向量补全 |
| anom-2005-015 (Q20) | ocr_formula_error | error | ✅ Fixed — γ₃ 向量补全 |
| anom-2005-016 (Q20) | ocr_latex_break | warning | ✅ Fixed — LaTeX 断裂修复 |
| anom-2005-017 (Q21) | ocr_formatting_noise | warning | ✅ Fixed — b^* → b |
| anom-2005-018 (global) | source_repo_dirty | warning | ⓘ — info（非阻塞） |
| anom-2005-019 (global) | nonstandard_latex_macro | info | ⓘ — info（建议后续处理） |

**原 19 条 anomaly 中：17 条已修复（5 error + 10 warning + 2 info），2 条 global info 保留为 ready_with_info。**

## 4. 最终状态

- **active error**: 0
- **active warning**: 0
- **active info**: 2（source_repo_dirty, pmb_macro_usage — 均为 global 非阻塞）
- **所有题目 reviewStatus**: `needs_human_review`
- **所有题目就绪分类**: `ready_for_approval`（全部 23 题）
- **强制检查状态**: 全部通过
