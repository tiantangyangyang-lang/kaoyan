# Math1 2018 — MD Finalization: Conflicts and Uncertainties

本报告由 MD finalization 任务 (2026-06-20) 生成。基于真题 Markdown 与解析 Markdown 的完整逐题核对。

## 已修复问题

### Q6 — 选项 D 合并 (resolved)
- **原始状态**: 选项 D 文本合并到选项 C 的 value 字段，options 数组只有 3 项。
- **根因**: Paper Markdown line 63 中选项 D 标签为 `$(\mathrm{D})r(\\mathbf{A},\\mathbf{B})...`，LaTeX 内的 `\mathrm{D}` 包裹导致选项解析器无法识别。
- **修复**: 从 paper Markdown 直接提取选项 D 文本，拆分为独立选项。所有 4 选项现已完整。
- **证据**: `papers/2018年考研数学(一)真题.md` line 63。

### Q8 — Section header bleed (resolved)
- **原始状态**: Q8 的 stem、option D value 和 explanation 尾部均包含 `# 二、填空题(...)`。
- **修复**: 从三个字段中移除 section header 文本。

### Q14 — Section header bleed (resolved)
- **原始状态**: Q14 的 stem 和 explanation 尾部包含 `# 三、解答题(...)`。
- **修复**: 从两个字段中移除 section header 文本。

### Q5, Q7 — answerCandidate format (resolved)
- **原始状态**: 使用全角括号 `（A）.` 而非半角 `(A).`
- **修复**: 统一为半角括号格式。

## 已知信息

- 0 active errors
- 0 active warnings
- 1 active info: Q6 historical incomplete_options artifact (resolved in content, downgraded to info)

## 限制

- 解答题 (Q15-Q23) 的 `answerCandidate` 为空 — 属于结构性预期，不是异常。
- 未对数学解答的正确性做独立验证 — 仅确认了答案与解析中声明的答案一致。
- 知识点标签 (knowledgePoints) 尚未填充 — 需要人工标注。

## 与来源 Markdown 的一致性

所有 23 题的题干、选项、答案均已与 source-mirror 中的真题 Markdown 和解析 Markdown 逐项核对，无内容冲突。
