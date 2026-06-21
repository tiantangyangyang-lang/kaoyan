# Math1 1999 — Conflicts and Uncertainties (md-finalization)

本报告由 `cc-math1-md-finalize-year` 任务生成。基于真题 Markdown、解析 Markdown 与已有结构修复产物。

## 已解决的冲突

| 题目 | 原异常 | 严重度 | 解决方案 |
|------|--------|--------|----------|
| Q10 | incomplete_options — 缺少选项 A | warning | 从真题 Markdown 第 49 行恢复选项 A：`$P\{X+Y \leqslant 0\} = \frac{1}{2}$`。修复已在 structure-repair 中应用，md-finalization 确认。 |

## 已知 info 级别注释

| 题目 | 类型 | 详情 | 影响 |
|------|------|------|------|
| Q06 | ocr_artifact_in_explanation | 变量替换记号 `\frac{t = -u}{-a}` 应为 `\xlongequal{t = -u}` | 不影响数学含义 |
| Q14 | ocr_artifact_in_explanation | `f^{\prime \prime}` 同时用于二阶和三阶导数 | 不影响证明逻辑 |

## 未解决的冲突

- 无

## 限制

- 未读取 PDF 页面（本次任务范围为 Markdown-first）。
- 数学正确性未经独立验证。
- info 级别的 OCR 注释不影响题目结构完整性，但建议人工复核时留意。
- `sourceDirty: true` 表示来源仓库在盘点时存在未提交更改。
