# Math1 2019 — MD Finalization Conflicts and Uncertainties

本报告由 `cc-math1-md-finalize-year` 任务生成。基于真题 Markdown 与解析 Markdown 的交叉对照完成确定性修复。

## 已解决异常（3→0 active warnings）

| 原异常 | 状态 | 解决方式 |
|--------|------|----------|
| Q18 missing_solution | ✅ 已解决 | 从 Q17 解析尾部提取，依据 solution MD (18) 题号标记 |
| Q20 missing_solution | ✅ 已解决 | 从 Q19 解析尾部提取，依据 solution MD (20) 题号标记 |
| Q06 incomplete_options | ✅ 已解决 | 选项 D 在 paper MD 第66行以 `(\mathrm{D})` 标记存在，已分离 |

## 确定性修复（6项，0项有待证实）

| 题号 | 修复内容 | 证据类型 | 确定性 |
|------|----------|----------|--------|
| Q02 | 分段函数定义 | Solution 左右导数计算 | 唯一确定 |
| Q06 | 选项 D 分离 | Paper MD line 66 | 唯一确定 |
| Q06 | 图片关联 | Paper MD "如图所示" + line 88 | 高（位置需 PDF 确认） |
| Q08 | 尾随内容清理 | OCR 布局分析 | 唯一确定 |
| Q14 | 尾随内容清理 | OCR 布局分析 | 唯一确定 |
| Q17/Q18 | 解析分离 | Solution MD (18) 标记 | 唯一确定 |
| Q19/Q20 | 解析分离 | Solution MD (20) 标记 | 唯一确定 |

## 剩余不确定性

仅1项 info 级别：
- Q06 图片 bc18cfda.jpg 在 markdown 中的放置位置（Q08 之后）与逻辑归属（Q06"如图所示"）不一致。已在结构化数据中关联到 Q06，但最终位置需 PDF 确认。

## 阻塞项

无。active error = 0, active warning = 0。
