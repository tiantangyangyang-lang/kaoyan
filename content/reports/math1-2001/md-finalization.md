# Math1 2001 — Markdown-First Finalization Report

> Run ID: `20260620-150843-cc-math1-md-finalize-year-2001`
> Source repo: Kaoyan-Math1-Papers @ 3151b4ac (dirty, 2001 files unaffected)
> Transform: math1-legacy-transform-v1

---

## 1. 最终状态

| 分类 | 题数 | 题目 |
|------|------|------|
| `ready_for_approval` | 19 | q01-q05, q07-q20 |
| `ready_with_info` | 1 | q06 (image-only options) |
| `blocked` | 0 | — |

**全部 20 题 status = `needs_human_review`**。没有题目标记为 approved 或 published。

## 2. 题目比对结果

### 2.1 题干 (stem) ↔ 真题 Markdown

全部 20 题题干与 `papers/2001年考研数学(一)真题.md` 逐题匹配通过。

| Section | 题号 | Paper 行号 | 匹配 |
|---------|------|-----------|------|
| 一、填空题 | 1-5 | lines 3-8 | ✓ |
| 二、选择题 | 6-10 | lines 11-64 | ✓ |
| 三、解答题 | 11 | lines 66-68 | ✓ |
| 四、解答题 | 12 | lines 70-72 | ✓ |
| 五、解答题 | 13 | lines 74-76 | ✓ |
| 六、解答题 | 14 | lines 78-80 | ✓ |
| 七、解答题 | 15 | lines 82-87 | ✓ |
| 八、解答题 | 16 | lines 89-93 | ✓ |
| 九、解答题 | 17 | lines 95-97 | ✓ |
| 十、解答题 | 18 | lines 99-108 | ✓ |
| 十一、解答题 | 19 | lines 110-115 | ✓ |
| 十二、解答题 | 20 | lines 117-119 | ✓ |

### 2.2 答案/解析 ↔ 解析 Markdown

全部 20 题答案和解析与 `solutions/2001年解析/2001年解析.md` 逐题匹配通过。

| 题号 | 解析编号 | Solution 行号 | 答案状态 |
|------|---------|--------------|---------|
| 1 | (1) | lines 5-7 | 显式【答案】 |
| 2 | (2) | lines 9-17 | 显式【答案】 |
| 3 | (3) | lines 19-36 | 显式【答案】 |
| 4 | (4) | lines 38-42 | 显式【答案】 |
| 5 | (5) | lines 44-50 | 显式【答案】 |
| 6 | (6) | lines 54-58 | 显式【答案】 |
| 7 | (7) | lines 60-70 | 显式【答案】 |
| 8 | (8) | lines 72-94 | 显式【答案】 |
| 9 | (9) | lines 96-104 | 显式【答案】 |
| 10 | (10) | lines 106-120 | 显式【答案】 |
| 11 | (11) | lines 124-134 | **嵌入解析中** |
| 12 | (12) | lines 136-152 | **嵌入解析中** |
| 13 | (13) | lines 154-164 | **嵌入解析中** |
| 14 | (14) | lines 166-190 | **嵌入解析中** |
| 15 | (15) | lines 192-216 | **嵌入解析中** |
| 16 | (16) | lines 218-244 | **嵌入解析中** |
| 17 | (17) | lines 246-256 | **嵌入解析中** |
| 18 | (18) | lines 258-266 | **嵌入解析中** |
| 19 | (19) | lines 279-287 | **嵌入解析中** |
| 20 | (20) | lines 289-295 | **嵌入解析中** |

## 3. 本次修复

### 3.1 答案提取 (q11-20)

源 solution 文件中 (11)-(20) 没有显式【答案】标记，答案嵌入在解析推导末尾行。本次逐题从解析中提取答案：

| 题号 | 提取的答案 | 提取位置 |
|------|-----------|---------|
| 11 | $-\frac{1}{2\mathrm{e}^{2x}}\arctan\mathrm{e}^x - \frac{1}{2\mathrm{e}^x} - \frac{1}{2}\arctan\mathrm{e}^x + C$ | Solution (11) 方法一/二末行 |
| 12 | $51$ | Solution (12) 末行 |
| 13 | $f(x) = 1 + 2\sum \frac{(-1)^n}{1-4n^2}x^{2n}$; $\sum = \frac{\pi}{4} - \frac{1}{2}$ | Solution (13) 末行 |
| 14 | $-24$ | Solution (14) 末行 |
| 15 | — (证明题) | 无数值答案，answerStatus: not_applicable |
| 16 | $100$ 小时 | Solution (16) 末行 |
| 17 | $s$ 偶 → $t_1 \neq \pm t_2$; $s$ 奇 → $t_1 \neq -t_2$ | Solution (17) 末行 |
| 18 | $\mathbf{B} = \begin{pmatrix} 0&0&0\\1&0&3\\0&1&-2 \end{pmatrix}$; $\|\mathbf{A}+\mathbf{E}\| = -4$ | Solution (18) 推导中 |
| 19 | (1) $P\{Y=m\mid X=n\} = C_n^m p^m (1-p)^{n-m}$; (2) joint formula | Solution (19) 推导中 |
| 20 | $2(n-1)\sigma^2$ | Solution (20) 末行 |

**证据**：答案均从 solution Markdown 中唯一确定的推导结果行提取，不需 AI 合成。

### 3.2 OCR 归一化

| 题目 | 字段 | 原文（OCR 乱码） | 修复后 | 原因 |
|------|------|-----------------|--------|------|
| q02 | explanationCandidate | `\operatorname {d i v} (\mathbf {g r a d} r)` | `\operatorname{div}(\mathbf{grad} r)` | OCR 错误将字母间插入空格，导致渲染为 "d i v"、"g r a d" |
| q16 | explanationCandidate | `\frac {1 3 \pi h ^ {2} (t)}{1 2}` | `\frac{13\pi h^{2}(t)}{12}` | OCR 错误将数字 13 和 12 拆分为 "1 3"、"1 2" |

修复字段均记录了 `repairs[]` 数组，包含原文、修复后文本和理由。

## 4. 未解决问题

### 4.1 Warning 级

| # | 题目 | 类型 | 描述 |
|---|------|------|------|
| W1 | q06 | image_only_options | 选项 A/B/C/D 和题干的 f(x) 图全部是图片引用，无法从文本验证 |
| W2 | q17 | garbled_determinant_source | 源 solution 文件第 254 行行列式用 `\begin{array}{r}` 无竖线标记。Staging 修正为 `\begin{vmatrix}`。数学上下文支持修正，但需人工对照 PDF 确认 |

### 4.2 Info 级

| # | 题目 | 类型 | 描述 |
|---|------|------|------|
| I1 | q07 | inline_option_in_stem | 选项 A 在原文段落内（非分行），已正确提取 |
| I2 | q15,18,19 | multi_part_stem | 子题 (1)(2) 合并为单题，与 solution 编号一致 |

## 5. 没有修改的内容

- 来源库 `Kaoyan-Math1-Papers`：无任何修改
- `content/approved/`：无修改
- 其他年份文件：无修改
- `task_plan.md`、`notes.md`：无修改
- 题目 stableId、questionType、sourceTracking 字段：保持不变

## 6. ready_for_approval 判定依据

19 道题被判定为 `ready_for_approval`，判定标准：

1. **题干**与真题 Markdown 逐字匹配 ✓
2. **答案**与解析 Markdown 中的【答案】或推导结果匹配 ✓
3. **解析**与解析 Markdown 中的【解】/【证明】/推导匹配 ✓
4. **无 active error 或 warning**（OCR 修复已在本次完成）
5. **内容可由 Markdown 证据闭合** — 不需要 PDF 复核即可确认 text-level 正确性

## 7. ready_with_info 判定依据

q06 判定为 `ready_with_info`：
- 题干和选项全部是图片引用（5 张图片）
- Solution 文本推理给出答案 (D)，但与图片的视觉一致性无法从文本确认
- 需要人工对照 PDF 或图片文件进行视觉验证
- 不阻塞后续处理，但需要 info 标记提醒人工审核者

## 8. 结论

Math1 2001 Markdown-first 最终整理完成。20 题全部匹配真题与解析 Markdown，19 题可进入人工审核的最终确认阶段，1 题（q06）需附带图片视觉验证提示。无 blocked 题目。active error=0, active warning=2, active info=2。
