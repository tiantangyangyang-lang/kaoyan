# Math1 2002 — 冲突与不确定项汇总

> md-finalization: `20260620-185410-cc-math1-md-finalize-year-2002`
> 日期: 2026-06-20

## md-finalization 结论

**全部20题目已由真题Markdown与解析Markdown证据闭合。** 0项active error, 0项active warning, 1项info。

## 已解决的冲突/不确定项

| # | 类型 | 原严重度 | 解决方法 | 证据 |
|---|------|---------|---------|------|
| 1 | Q6 OCR文本损毁 | error → info | 从solution证据数学逻辑唯一恢复①② | solution行68-70: ②=一阶偏导数连续 → ③=可微 → ①=连续 |
| 2 | Q9 选项图片标签错位 | error → info | staging 2026-06-17修复，md-finalization验证一致 | paper行47-57: 图片顺序A→5a83, B→8127, C→6a75, D→9e0f |
| 3 | Q10 选项切分失败 | error → 已解决 | staging 2026-06-17修复，从paper行61-64恢复四个选项 | paper Markdown原文 |
| 4 | Q2-Q5/Q7-Q10 嵌入式答案 | error → 已解决 | staging 2026-06-17拆分 | solution Markdown section格式 |
| 5 | Q11-Q20 answerCandidate缺失 | warning → 已解决 | md-finalization从explanationCandidate提取 | 各题解析文末均有明确结果 |
| 6 | Q6 stem JSON编码（弯引号） | error → 已解决 | 2026-06-20 md-finalization修复3处Unicode弯引号为ASCII双引号 | 文件行181: property名和string定界符原使用U+201C/U+201D |

## 保留的info级不确定项

| # | 题目 | 说明 | 为什么不是error/warning |
|---|------|------|----------------------|
| 1 | Q9 | 全部选项为图片，需PDF确认图片内容 | 选项标签映射已正确，答案(B)已确定；图片视觉确认不阻塞内容正确性 |
| 2 | Q6 | OCR恢复的性质措辞需PDF确认精确中文原文 | 数学内容已从solution唯一确定；措辞可能有个别字差异但不影响题目正解 |

## 已知但不可修复

- 无。所有可修复问题均已处理。

## 不依赖PDF的证据链

- Q6 性质①②恢复: solution明确说明"两个偏导数连续→可微→连续+可偏导"，选项②⇒③⇒①唯一对应
- Q9 答案(B): solution明确"r(A)=r(Ā)=2<3→无数个解→三平面无数交点→选(B)"
- Q10 选项: paper Markdown行61-64完整保留了四个选项文本

## 审核建议

人工审核只需：
1. Q9 对照PDF看一眼四张图，确认(B)图确实是"三平面交于一直线"
2. Q6 对照PDF确认①②的中文措辞是否与恢复文本一致
3. 其余18题可直接审核答案正确性，不依赖PDF逐字比对
