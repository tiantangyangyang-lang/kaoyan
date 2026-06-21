# Math1 2001 — 冲突与不确定项报告 (MD Finalization 后更新)

> MD Finalization 运行：`20260620-150843-cc-math1-md-finalize-year-2001`
> 先前进展：`20260616-220001-ds-math1-year-2001`
> PDF 核验状态：**not_run**
> 来源仓库：Kaoyan-Math1-Papers @ 3151b4ac (dirty, 2001 files unaffected)

---

## 1. Paper / Solution 冲突

**冲突数：0**

本次 Markdown-first 逐题比对未发现 paper 与 solution 之间的实质性内容冲突。

1 项格式级差异（**staging 已修正**）：

| 题号 | 类型 | 详情 | 状态 |
|------|------|------|------|
| 17 | formula_rendering | 源 solution 文件第 254 行行列式用 `\begin{array}{r}` 无竖线。Staging 修正为 `\begin{vmatrix}`。 | **staging 已修正，需 PDF 确认** |

---

## 2. OCR 噪声（MD Finalization 后状态）

本次 md-finalization 修复了 2 处影响渲染的 OCR 乱码：

| 修复前 | 修复后 | 涉及题目 | 影响 |
|--------|--------|---------|------|
| `\operatorname {d i v} (\mathbf {g r a d} r)` | `\operatorname{div}(\mathbf{grad} r)` | q02 | 原文渲染为 "d i v" 和 "g r a d" |
| `\frac {1 3 \pi h ^ {2} (t)}{1 2}` | `\frac{13\pi h^{2}(t)}{12}` | q16 | 原文渲染为 "1 3" 和 "1 2" |

仍有但 **不影响渲染** 的 OCR 残余（源自 OCR pipeline 的多余空格）：

| 位置 | 示例 | 影响 |
|------|------|------|
| q03, q14, q16 等 | `\int_ {- 1} ^ {0}`, `\frac {2}{3}` | 无 — LaTeX/KaTeX 正确渲染 |

---

## 3. 答案状态（MD Finalization 后）

**所有 20 题答案已闭合。**

| 状态 | 题数 | 题目 |
|------|------|------|
| candidate_from_solutions（显式【答案】） | 10 | q01-q10 |
| candidate_from_solutions（从解析提取） | 9 | q11-q14, q16-q20 |
| not_applicable（证明题） | 1 | q15 |

q11-20 的答案提取位置和内容详见 `md-finalization.md` §3.1。

---

## 4. 图片依赖

| 题号 | 图片数量 | 用途 | 影响 | 状态 |
|------|---------|------|------|------|
| 3 | 1 | 积分区域图（解析中 "如图所示"） | 辅助理解 | **文本解释完整，图是辅助** |
| 6 | 5 | f(x) 图 + 4 个 f'(x) 候选图 | **高 — 题目完全依赖图片** | **需人工视觉验证** |

所有图片文件存在于 source-mirror 目录。本次未进行图片内容验证。

---

## 5. 需从 PDF 最终确认的项目（缩减后）

MD Finalization 将需 PDF 确认的项目从 6 项缩减为 2 项：

1. ✅ ~~q11-20 嵌入答案~~ — 本次已从 Markdown 中提取
2. ✅ ~~q02, q16 OCR 空格~~ — 本次已归一化
3. ✅ ~~q03 积分区域图~~ — text 解释完整，因为辅助
4. ⚠️ **q06 f(x) 原图与 4 个 f'(x) 候选图的视觉对照** — 仍需
5. ⚠️ **q17 行列式公式的 PDF 确认** — 仍需（staging 已修正，需最终确认）
6. ✅ ~~q14, q16 计算步骤~~ — Markdown 推导完整，数学逻辑自洽，可在人工审核中快速验证

---

## 6. 源仓库状态

- Commit: `3151b4acf26ea19ccd427b869a715e65e1990091`
- Dirty: true（7 个已修改 tracked 文件：1987/1988/2003/2020/2024 papers, 2003/2020 solutions; 2 个 untracked 目录）
- **2001 年文件未在 dirty 列表中，内容不受影响**
- Source mirror 中的 2001 文件 SHA-256 与 source-before.json 记录一致

---

## 7. 总结

| 指标 | MD Finalization 前 | MD Finalization 后 |
|------|-------------------|-------------------|
| Paper/Solution 冲突 | 0 | 0 |
| OCR 噪声类型 | 5 | 3 (5 → 修复2项) |
| 缺失答案 | 10 题 (q11-20) | 0 题 |
| Anomalies (active) | 12 | 4 (2 warning + 2 info) |
| 需 PDF 确认 | 6 项 | 2 项 |
| ready_for_approval | — | 19 题 |
| ready_with_info | — | 1 题 (q06) |
| blocked | — | 0 题 |
| 状态 | needs_human_review | needs_human_review |
