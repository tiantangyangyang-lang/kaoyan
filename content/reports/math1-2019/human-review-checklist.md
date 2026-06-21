# 数学一 2019 人工审核清单

> 生成方式: `cc-math1-md-finalize-year`
> 标准化产物: `content/review/math1/2019/questions-reviewed.json`
> 所有题目状态: `needs_human_review`
> 运行 ID: `20260620-174613-cc-math1-md-finalize-year-2019`

## 优先级

- P0: 0 项
- P1: 1 项
- P2: 0 项

## P0（必须先处理）

- 无。所有此前标记为 warning 的异常（Q18/Q20 missing_solution、Q06 incomplete_options）已通过 Markdown 证据确定性修复。

## P1（建议本轮处理）

- `math1-2019-q06`: 图片 bc18cfda.jpg 放置位置需 PDF 确认。该图在 paper markdown 中位于 Q08 之后，但 Q06 的题干写"如图所示"。已在结构化数据中关联到 Q06 stem，但实际页面位置需人工对照 PDF 确认。

## P2（可顺手处理）

- 无。

## 已修复项（无需人工处理）

| 问题 | 修复 | 证据 |
|------|------|------|
| Q02 分段函数 OCR 错误 | `x & |x|` → `x|x|, x≤0; x ln x, x>0` | 解答中左右导数计算 |
| Q06 选项 C/D 合并 | 分离为选项 D | Paper MD line 66 含 `(\mathrm{D})` 标记 |
| Q08/Q14 stem 尾随内容 | 移除 section header | 原始 OCR 布局残余 |
| Q17/Q18 解析合并 | 分离为独立题 | Solution MD (18) 标记 |
| Q19/Q20 解析合并 | 分离为独立题 | Solution MD (20) 标记 |

## 审核要求

- 优先对照真题 Markdown 与解析 Markdown 确认内容完整性。
- 对 Q06 图片位置有疑问时可参考原始 PDF。
- 在未逐页核对 PDF 前，保持 `needs_human_review` 状态。
- 通过审核后更新 `content/approved/math1/2019/` 中的内容。
