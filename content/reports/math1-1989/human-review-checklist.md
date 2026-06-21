# 数学一 1989 人工审核清单

> 生成方式: `cc-math1-md-finalize-year`
> 运行 ID: `20260620-152242-cc-math1-md-finalize-year-1989`
> 标准化产物: `content/review/math1/1989/questions-reviewed.json`
> 所有题目状态: `needs_human_review`

## 当前状态

- **active error: 0**
- **active warning: 0**
- **info only: 7**（原始结构异常已全部修复的记录 + solution 类型无简短答案的说明）
- **所有 23 题均有完整解析（explanationCandidate）**
- **所有 23 题保持 `needs_human_review`**

## 优先级

- **P0**: 0 项
- **P1**: 0 项（原始 6 项已修复）
- **P2**: 7 项 info（供参考，非阻塞）

## 本次 Markdown-First 最终整理已完成的修复

### 结构修复（从 `questions-structure-repaired.json` 吸收）
- `section_split_mismatch` in 三：Q11-Q13 解析块已正确拆分
- `missing_solution` Q12：从 Q11 容器中恢复
- `missing_solution` Q13：从 Q11 容器中恢复
- `missing_solution` Q20：从 Q19 容器中恢复
- `missing_solution` Q21：从 Q19 容器中恢复
- `missing_solution` Q22：从 Q19 容器中恢复

### 内容修复（本轮从 source markdown 读取并确定性修复）
- Q11 (`math1-1989-q11`)：从 solution markdown 恢复三-(1) 的解析（原为 null）
- Q18 (`math1-1989-q18`)：恢复完整证明过程（原缺失 "因为 A 可逆..." 开头段）
- Q19 (`math1-1989-q19`)：修复错误 answerCandidate "0.7" → null（0.7 是 Q20 的答案）
- Q23 (`math1-1989-q23`)：修复 OCR 错误 `-∞ < z + ∞` → `-∞ < z < +∞`

## 待人工确认

### 数学正确性（每题）
- 所有题目需要人工确认题干/答案/解析的数学正确性
- 特别是：填空题答案值是否正确、选择题选项是否正确匹配、解答题推导是否正确

### 解答题 answerCandidate
Questions 11-19 和 23 为解答型（solution），按设计不含简短 answerCandidate。人工审核时决定是否需要补充。

### Q11 解析
Q11（三-(1)偏导数）的解析来自 solution markdown 的 `(1)【解】` 行，内容为一行简短结果。人工确认是否需要补充推导过程。

## 审核要求

- 题目内容已由真题 Markdown 和解析 Markdown 确定，不强制要求 PDF 逐页对照
- 只有字段缺失、乱码无法唯一恢复或图片承载关键文字时，才需要原始 PDF
- 确认后可将合适的题目状态更新为 approved

## 各题快速索引

| stableId | 题号 | 题型 | 有解析 | 有答案 |
|----------|------|------|--------|--------|
| math1-1989-q01 | 1 | 填空 | ✅ | ✅ -1 |
| math1-1989-q02 | 2 | 填空 | ✅ | ✅ x-1 |
| math1-1989-q03 | 3 | 填空 | ✅ | ✅ π |
| math1-1989-q04 | 4 | 填空 | ✅ | ✅ 2 |
| math1-1989-q05 | 5 | 填空 | ✅ | ✅ 矩阵 |
| math1-1989-q06 | 6 | 选择 | ✅ | ✅ A |
| math1-1989-q07 | 7 | 选择 | ✅ | ✅ C |
| math1-1989-q08 | 8 | 选择 | ✅ | ✅ D |
| math1-1989-q09 | 9 | 选择 | ✅ | ✅ B |
| math1-1989-q10 | 10 | 选择 | ✅ | ✅ C |
| math1-1989-q11 | 三(1) | 解答 | ✅ | — |
| math1-1989-q12 | 三(2) | 解答 | ✅ | — |
| math1-1989-q13 | 三(3) | 解答 | ✅ | — |
| math1-1989-q14 | 四 | 解答 | ✅ | — |
| math1-1989-q15 | 五 | 解答 | ✅ | — |
| math1-1989-q16 | 六 | 解答 | ✅ | — |
| math1-1989-q17 | 七 | 解答 | ✅ | — |
| math1-1989-q18 | 八 | 解答 | ✅ | — |
| math1-1989-q19 | 九 | 解答 | ✅ | — |
| math1-1989-q20 | 十(1) | 填空 | ✅ | ✅ 0.7 |
| math1-1989-q21 | 十(2) | 填空 | ✅ | ✅ 0.75 |
| math1-1989-q22 | 十(3) | 填空 | ✅ | ✅ 0.8 |
| math1-1989-q23 | 十一 | 解答 | ✅ | — |
