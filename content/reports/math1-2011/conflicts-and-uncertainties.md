# Math1 2011 — MD-Finalization Conflicts and Uncertainties

本报告由 MD-first finalization 生成。
运行 ID: 20260620-170330-cc-math1-md-finalize-year-2011

## 已解决的异常

| stableId | 原异常 | 解决方案 | 证据 |
|---|---|---|---|
| math1-2011-q03 | incomplete_options (只有 A,B,C) | 选项 D 已从 stem 中分离 | paper Markdown L33: `$(\mathrm{D})f(0) < 1, f''(0) < 0.$` |
| math1-2011-q07 | incomplete_options (只有 A,B) | 选项 C,D 已从 stem 中分离 | paper Markdown L67-73: `$(\mathrm{C})f_{1}(x)F_{2}(x)$` / `$(\mathrm{D})f_{1}(x)F_{2}(x) + f_{2}(x)F_{1}(x).$` |

## 已应用的确定性修复

| stableId | 修复类型 | 说明 | 证据 |
|---|---|---|---|
| math1-2011-q08 | stem_cleaned | 移除泄漏的"二、填空题"节标题 | paper Markdown 节标题属于下一节 |
| math1-2011-q14 | stem_cleaned | 移除泄漏的"三、解答题"节标题 | paper Markdown 节标题属于下一节 |
| math1-2011-q17 | ocr_fix | 修复 `\arctan x - x = 0` → `k\arctan x - x = 0` | solution L248 定义 `f(x) = k\arctan x - x` |

## 当前活动异常

0 项。

## 冲突

无。真题 Markdown 与解析 Markdown 在所有题目上一致（除 Q17 的 k 参数 OCR 丢失已修复）。

## 限制

- 未逐页核对 PDF。
- 知识点标签未标注（需要人工完成）。
- 所有题目仍为 `needs_human_review`，在人工确认前不得发布。
