# Math1 2021 — Conflicts and Uncertainties (MD-Finalization)

运行: `20260620-180254-cc-math1-md-finalize-year-2021`

## 已修复

- `math1-2021-q03` [resolved]: 选项解析错误 — 原 staging 将 4 个选项合并为 2 个，已从 paper Markdown (lines 31-37) 确定性修复为 A/B/C/D 四项。
- `math1-2021-q10` [resolved]: 选项 D 末尾混入填空题 section header，已剥离。

## 已知信息（非阻塞）

- `math1-2021-q07` [info]: Stem 编号 "7）" 缺少左括号
- `math1-2021-q08` [info]: Stem 编号 "8）" 缺少左括号
- `math1-2021-q09` [info]: Stem 编号 "9）" 缺少左括号
- `math1-2021-q10` [info]: Stem 编号 "10）" 缺少左括号
- `math1-2021-q11` [info]: Stem 编号 "11)" 使用 ")" 而非 "）"
- `math1-2021-q14` [info]: Stem 编号为原始填空题 "4）" 映射
- `math1-2021-q15` [info]: Stem 编号为原始填空题 "5）" 映射

## 限制

- 未读取 PDF 页面（任务要求 Markdown-first，无需 PDF）
- 未新增数学正确性判断
- 编号不一致均来自来源 Markdown，已原样保留
- 解答题 answerCandidate 为 null 属结构性设计（非缺失错误）
