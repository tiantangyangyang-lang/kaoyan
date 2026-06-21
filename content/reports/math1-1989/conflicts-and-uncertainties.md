# Math1 1989 — Markdown-First Finalization: Conflicts and Uncertainties

本报告由 `cc-math1-md-finalize-year` 任务生成。基于真题 Markdown 与解析 Markdown 的内容对比、已有结构修复产物和本轮确定性修复。

## 已解决的冲突

### Q11-Q13 解析错配（已修复）
- **原状**: 解析 Markdown 中三-(1)、三-(2)、三-(3) 的解析被合并为一个容器，配给了 Q11
- **修复**: 按 `questions-structure-repaired.json` 的结构拆分，Q11/Q12/Q13 各得正确解析
- **Q11 补充**: 从 solution markdown 第 85 行恢复了三-(1) 的简短解析
- **证据**: solution markdown `三、\n(1)【解】...` 行

### Q19 答案错配 + Q20-Q22 解析缺失（已修复）
- **原状**: Q19 的 answerCandidate 被设为 "0.7"（这是 Q20 的概率答案，不是 Q19 的面积最值答案）
- **原状**: Q20/Q21/Q22 的解析被嵌入 Q19 的 explanationCandidate 末尾
- **修复**: Q19 answerCandidate → null；Q20/Q21/Q22 的 answerCandidate 和 explanationCandidate 从嵌入块中拆出
- **Q19 正确答案**（来自解析）: $R = \frac{4}{3}a$

### Q18 解析截断（已修复）
- **原状**: explanationCandidate 缺少开头 "八、【证明】（1）因为 A 可逆..."
- **修复**: 从 solution markdown 恢复完整证明过程

### Q23 OCR 错误（已修复）
- **原状**: 解析末尾 `- \infty < z + \infty`（应为 `- \infty < z < + \infty`）
- **修复**: 确定性 OCR 纠错

## 当前不确定项

### 全部为 info 级别

| 项目 | 说明 |
|------|------|
| 解答题无简短答案 | Q11-Q19, Q23 为 solution 型，设计上不含 answerCandidate；解析已完整保留 |
| 数学正确性 | Markdown 内容均来自来源库，未做数学正确性判断 |
| 知识点标签 | 所有题目待人工标注知识点 |

## 限制

- 未读取 PDF 页面（按 Markdown-first 策略不要求 PDF）
- 未做深度语义/数学判断
- 仅通过真题 Markdown、解析 Markdown 和确定性逻辑进行修复
- 来源库版权状态：数学一仓库标记 CC BY-NC-SA 4.0，商业使用需额外授权
